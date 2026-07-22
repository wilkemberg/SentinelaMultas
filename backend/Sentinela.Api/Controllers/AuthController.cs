using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Sentinela.Api.Data;
using Sentinela.Api.Models;
using Sentinela.Api.Services;

namespace Sentinela.Api.Controllers;

public record RegistrarRequest(string Nome, string Email, string Senha, string? WhatsAppNumero = null, bool AceitouTermos = false);
public record EntrarRequest(string Email, string Senha);
public record AuthResponse(string Token, Guid UsuarioId, string Nome, string Email, bool EmailVerificado);
public record EsqueciSenhaRequest(string Email);
public record RedefinirSenhaRequest(string Token, string NovaSenha);

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly SentinelaDbContext _db;
    private readonly IJwtService _jwt;
    private readonly INotificacaoService _notificacaoService;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        SentinelaDbContext db,
        IJwtService jwt,
        INotificacaoService notificacaoService,
        IConfiguration config,
        ILogger<AuthController> logger)
    {
        _db = db;
        _jwt = jwt;
        _notificacaoService = notificacaoService;
        _config = config;
        _logger = logger;
    }

    /// <summary>Cadastra novo usuário e retorna JWT.</summary>
    [HttpPost("registrar")]
    public async Task<IActionResult> Registrar([FromBody] RegistrarRequest req, CancellationToken ct)
    {
        if (await _db.Usuarios.AnyAsync(u => u.Email == req.Email.ToLower()))
            return Conflict(new { mensagem = "E-mail já cadastrado." });

        // WhatsApp é obrigatório desde o cadastro — é o canal usado para os
        // alertas de multa nova, e sem ele o usuário chegaria ao painel sem
        // como receber notificação nenhuma até preencher depois.
        var whatsAppLimpo = new string((req.WhatsAppNumero ?? "").Where(char.IsDigit).ToArray());
        if (whatsAppLimpo.Length < 10)
            return BadRequest(new { mensagem = "WhatsApp é obrigatório (DDD + número)." });

        // Consentimento LGPD: sem aceitar os Termos de Uso e a Política de
        // Privacidade, o cadastro não prossegue — não é opcional, dado que
        // coletamos CPF, RENAVAM e CNH.
        if (!req.AceitouTermos)
            return BadRequest(new { mensagem = "É necessário aceitar os Termos de Uso e a Política de Privacidade." });

        var usuario = new Usuario
        {
            Nome = req.Nome.Trim(),
            Email = req.Email.ToLower().Trim(),
            SenhaHash = _jwt.HashSenha(req.Senha),
            WhatsAppNumero = whatsAppLimpo,
            ConsentimentoLgpdEm = DateTime.UtcNow,
            TokenVerificacaoEmail = _jwt.GerarTokenAleatorio(),
            TokenVerificacaoEmailExpiraEm = DateTime.UtcNow.AddHours(24),
        };

        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Novo usuário registrado: {Email}", usuario.Email);

        // Best-effort: falha ao enviar o e-mail de verificação não deve
        // impedir o cadastro (ex.: Resend fora do ar ou sem chave em dev).
        try
        {
            var origem = _config["Frontend:Origem"] ?? "http://localhost:3000";
            var link = $"{origem}/verificar-email?token={usuario.TokenVerificacaoEmail}";
            await _notificacaoService.EnviarEmailVerificacaoAsync(usuario, link, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao enviar e-mail de verificação para {Email}", usuario.Email);
        }

        var token = _jwt.GerarToken(usuario);
        return Created($"/api/usuarios/{usuario.Id}", new AuthResponse(token, usuario.Id, usuario.Nome, usuario.Email, usuario.EmailVerificado));
    }

    /// <summary>Autentica usuário existente e retorna JWT.</summary>
    [HttpPost("entrar")]
    public async Task<IActionResult> Entrar([FromBody] EntrarRequest req)
    {
        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == req.Email.ToLower());

        if (usuario is null || !_jwt.VerificarSenha(req.Senha, usuario.SenhaHash))
            return Unauthorized(new { mensagem = "E-mail ou senha incorretos." });

        if (usuario.ContaExcluida)
            return Unauthorized(new { mensagem = "Esta conta foi excluída." });

        usuario.UltimoLoginEm = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var token = _jwt.GerarToken(usuario);
        return Ok(new AuthResponse(token, usuario.Id, usuario.Nome, usuario.Email, usuario.EmailVerificado));
    }

    /// <summary>
    /// Confirma o e-mail cadastrado a partir do link enviado no registro.
    /// </summary>
    [HttpPost("verificar-email")]
    public async Task<IActionResult> VerificarEmail([FromQuery] string token)
    {
        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.TokenVerificacaoEmail == token);
        if (usuario is null || usuario.TokenVerificacaoEmailExpiraEm is null || usuario.TokenVerificacaoEmailExpiraEm < DateTime.UtcNow)
            return BadRequest(new { mensagem = "Link de verificação inválido ou expirado." });

        usuario.EmailVerificado = true;
        usuario.TokenVerificacaoEmail = null;
        usuario.TokenVerificacaoEmailExpiraEm = null;
        await _db.SaveChangesAsync();

        return Ok(new { mensagem = "E-mail confirmado com sucesso." });
    }

    /// <summary>
    /// Reenvia o e-mail de verificação para o usuário autenticado, caso o link
    /// original tenha expirado ou se perdido.
    /// </summary>
    [HttpPost("reenviar-verificacao")]
    [Authorize]
    public async Task<IActionResult> ReenviarVerificacao(CancellationToken ct)
    {
        var usuarioId = User.GetUsuarioId();
        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id == usuarioId);
        if (usuario is null) return NotFound();

        if (usuario.EmailVerificado)
            return Ok(new { mensagem = "Este e-mail já está verificado." });

        usuario.TokenVerificacaoEmail = _jwt.GerarTokenAleatorio();
        usuario.TokenVerificacaoEmailExpiraEm = DateTime.UtcNow.AddHours(24);
        await _db.SaveChangesAsync();

        var origem = _config["Frontend:Origem"] ?? "http://localhost:3000";
        var link = $"{origem}/verificar-email?token={usuario.TokenVerificacaoEmail}";
        await _notificacaoService.EnviarEmailVerificacaoAsync(usuario, link, ct);

        return Ok(new { mensagem = "E-mail de verificação reenviado." });
    }

    /// <summary>
    /// Solicita a redefinição de senha. Sempre responde com a mesma mensagem
    /// genérica, exista ou não o e-mail — evita que alguém use este endpoint
    /// para descobrir quais e-mails estão cadastrados.
    /// </summary>
    [HttpPost("esqueci-senha")]
    public async Task<IActionResult> EsqueciSenha([FromBody] EsqueciSenhaRequest req, CancellationToken ct)
    {
        var mensagemGenerica = new { mensagem = "Se este e-mail estiver cadastrado, enviaremos um link de redefinição." };

        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == req.Email.ToLower().Trim());
        if (usuario is null || usuario.ContaExcluida)
            return Ok(mensagemGenerica);

        usuario.TokenResetSenha = _jwt.GerarTokenAleatorio();
        usuario.TokenResetSenhaExpiraEm = DateTime.UtcNow.AddHours(1);
        await _db.SaveChangesAsync();

        try
        {
            var origem = _config["Frontend:Origem"] ?? "http://localhost:3000";
            var link = $"{origem}/redefinir-senha?token={usuario.TokenResetSenha}";
            await _notificacaoService.EnviarEmailRedefinicaoSenhaAsync(usuario, link, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao enviar e-mail de redefinição de senha para {Email}", usuario.Email);
        }

        return Ok(mensagemGenerica);
    }

    /// <summary>Confirma a nova senha a partir do token recebido por e-mail.</summary>
    [HttpPost("redefinir-senha")]
    public async Task<IActionResult> RedefinirSenha([FromBody] RedefinirSenhaRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.NovaSenha) || req.NovaSenha.Length < 6)
            return BadRequest(new { mensagem = "A nova senha deve ter pelo menos 6 caracteres." });

        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.TokenResetSenha == req.Token);
        if (usuario is null || usuario.TokenResetSenhaExpiraEm is null || usuario.TokenResetSenhaExpiraEm < DateTime.UtcNow)
            return BadRequest(new { mensagem = "Link de redefinição inválido ou expirado. Solicite um novo." });

        usuario.SenhaHash = _jwt.HashSenha(req.NovaSenha);
        usuario.TokenResetSenha = null;
        usuario.TokenResetSenhaExpiraEm = null;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Senha redefinida com sucesso para {Email}", usuario.Email);
        return Ok(new { mensagem = "Senha redefinida com sucesso. Você já pode entrar com a nova senha." });
    }
}
