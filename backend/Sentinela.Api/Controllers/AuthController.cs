using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sentinela.Api.Data;
using Sentinela.Api.Models;
using Sentinela.Api.Services;

namespace Sentinela.Api.Controllers;

public record RegistrarRequest(string Nome, string Email, string Senha, string? WhatsAppNumero = null);
public record EntrarRequest(string Email, string Senha);
public record AuthResponse(string Token, Guid UsuarioId, string Nome, string Email);

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly SentinelaDbContext _db;
    private readonly IJwtService _jwt;
    private readonly ILogger<AuthController> _logger;

    public AuthController(SentinelaDbContext db, IJwtService jwt, ILogger<AuthController> logger)
    {
        _db = db;
        _jwt = jwt;
        _logger = logger;
    }

    /// <summary>Cadastra novo usuário e retorna JWT.</summary>
    [HttpPost("registrar")]
    public async Task<IActionResult> Registrar([FromBody] RegistrarRequest req)
    {
        if (await _db.Usuarios.AnyAsync(u => u.Email == req.Email.ToLower()))
            return Conflict(new { mensagem = "E-mail já cadastrado." });

        // WhatsApp é obrigatório desde o cadastro — é o canal usado para os
        // alertas de multa nova, e sem ele o usuário chegaria ao painel sem
        // como receber notificação nenhuma até preencher depois.
        var whatsAppLimpo = new string((req.WhatsAppNumero ?? "").Where(char.IsDigit).ToArray());
        if (whatsAppLimpo.Length < 10)
            return BadRequest(new { mensagem = "WhatsApp é obrigatório (DDD + número)." });

        var usuario = new Usuario
        {
            Nome = req.Nome.Trim(),
            Email = req.Email.ToLower().Trim(),
            SenhaHash = _jwt.HashSenha(req.Senha),
            WhatsAppNumero = whatsAppLimpo
        };

        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Novo usuário registrado: {Email}", usuario.Email);

        var token = _jwt.GerarToken(usuario);
        return Created($"/api/usuarios/{usuario.Id}", new AuthResponse(token, usuario.Id, usuario.Nome, usuario.Email));
    }

    /// <summary>Autentica usuário existente e retorna JWT.</summary>
    [HttpPost("entrar")]
    public async Task<IActionResult> Entrar([FromBody] EntrarRequest req)
    {
        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == req.Email.ToLower());

        if (usuario is null || !_jwt.VerificarSenha(req.Senha, usuario.SenhaHash))
            return Unauthorized(new { mensagem = "E-mail ou senha incorretos." });

        usuario.UltimoLoginEm = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var token = _jwt.GerarToken(usuario);
        return Ok(new AuthResponse(token, usuario.Id, usuario.Nome, usuario.Email));
    }
}
