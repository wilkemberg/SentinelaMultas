using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sentinela.Api.Data;
using Sentinela.Api.Services;

namespace Sentinela.Api.Controllers;

public record AtualizarPerfilRequest(
    string? Nome,
    string? WhatsAppNumero,
    bool? NotificarEmail,
    bool? NotificarWhatsApp,
    bool? AtividadeRemunerada,
    string? Cpf,
    string? NumeroRegistroCnh,
    string? CategoriaCnh,
    DateTime? DataNascimento,
    DateTime? DataExpedicaoCnh,
    string? NomeMae);

public record ValidarCnhRequest(string CodigoSeguranca);
public record ExcluirContaRequest(string Senha);

[ApiController]
[Route("api/usuarios")]
[Authorize]
public class UsuariosController : ControllerBase
{
    private readonly SentinelaDbContext _db;
    private readonly ICnhValidacaoService _cnhValidacaoService;
    private readonly IJwtService _jwt;
    private readonly ILogger<UsuariosController> _logger;

    public UsuariosController(SentinelaDbContext db, ICnhValidacaoService cnhValidacaoService, IJwtService jwt, ILogger<UsuariosController> logger)
    {
        _db = db;
        _cnhValidacaoService = cnhValidacaoService;
        _jwt = jwt;
        _logger = logger;
    }

    [HttpGet("me")]
    public async Task<IActionResult> ObterPerfil()
    {
        var usuarioId = User.GetUsuarioId();
        var usuario = await _db.Usuarios
            .Include(u => u.Veiculos)
            .ThenInclude(v => v.Multas)
            .FirstOrDefaultAsync(u => u.Id == usuarioId);

        if (usuario is null) return NotFound();

        // Se a CNH já foi validada oficialmente (SENATRAN), a validade real
        // informada pela base RENACH tem prioridade sobre a estimativa calculada
        // localmente a partir de data de nascimento + expedição.
        var validadeCnh = usuario.ValidadeCnhOficial.HasValue
            ? CnhValidadeCalculator.ComOficial(usuario.ValidadeCnhOficial.Value)
            : CnhValidadeCalculator.Calcular(usuario.DataNascimento, usuario.DataExpedicaoCnh);

        return Ok(new
        {
            usuario.Id,
            usuario.Nome,
            usuario.Email,
            usuario.WhatsAppNumero,
            usuario.EmailVerificado,
            usuario.NotificarEmail,
            usuario.NotificarWhatsApp,
            usuario.AtividadeRemunerada,
            usuario.Cpf,
            usuario.NumeroRegistroCnh,
            usuario.CategoriaCnh,
            usuario.DataNascimento,
            usuario.DataExpedicaoCnh,
            usuario.NomeMae,
            usuario.SituacaoCnh,
            usuario.CnhValidadaEm,
            ValidadeCnh = validadeCnh,
            usuario.CriadoEm,
            usuario.UltimoLoginEm,
            TotalVeiculos = usuario.Veiculos.Count,
            TotalMultas = usuario.Veiculos.Sum(v => v.Multas.Count)
        });
    }

    [HttpPatch("me")]
    public async Task<IActionResult> AtualizarPerfil([FromBody] AtualizarPerfilRequest req)
    {
        var usuarioId = User.GetUsuarioId();
        var usuario = await _db.Usuarios.FindAsync(usuarioId);
        if (usuario is null) return NotFound();

        // Nome, CPF e WhatsApp são obrigatórios (ver aba "Minha Conta" no
        // frontend): quando o campo é enviado explicitamente nesta chamada, não
        // aceitamos deixá-lo em branco. Chamadas que não tocam nesses campos
        // (ex.: só mudando categoria da CNH) continuam funcionando normalmente,
        // sem precisar reenviar tudo.
        if (req.Nome is not null && string.IsNullOrWhiteSpace(req.Nome))
            return BadRequest(new { mensagem = "Nome é obrigatório." });

        string? cpfLimpo = null;
        if (req.Cpf is not null)
        {
            cpfLimpo = new string(req.Cpf.Where(char.IsDigit).ToArray());
            if (cpfLimpo.Length != 11)
                return BadRequest(new { mensagem = "CPF é obrigatório e deve ter 11 dígitos." });
        }

        string? whatsAppLimpo = null;
        if (req.WhatsAppNumero is not null)
        {
            whatsAppLimpo = new string(req.WhatsAppNumero.Where(char.IsDigit).ToArray());
            if (whatsAppLimpo.Length < 10)
                return BadRequest(new { mensagem = "WhatsApp é obrigatório (DDD + número)." });
        }

        if (req.Nome is not null) usuario.Nome = req.Nome.Trim();
        if (whatsAppLimpo is not null) usuario.WhatsAppNumero = whatsAppLimpo;
        if (req.NotificarEmail.HasValue) usuario.NotificarEmail = req.NotificarEmail.Value;
        if (req.NotificarWhatsApp.HasValue) usuario.NotificarWhatsApp = req.NotificarWhatsApp.Value;
        if (req.AtividadeRemunerada.HasValue) usuario.AtividadeRemunerada = req.AtividadeRemunerada.Value;
        if (cpfLimpo is not null) usuario.Cpf = cpfLimpo;
        if (req.NumeroRegistroCnh is not null) usuario.NumeroRegistroCnh = req.NumeroRegistroCnh.Trim();
        if (req.CategoriaCnh is not null) usuario.CategoriaCnh = req.CategoriaCnh.Trim().ToUpperInvariant();
        if (req.DataNascimento.HasValue) usuario.DataNascimento = req.DataNascimento.Value;
        if (req.DataExpedicaoCnh.HasValue) usuario.DataExpedicaoCnh = req.DataExpedicaoCnh.Value;
        if (req.NomeMae is not null) usuario.NomeMae = req.NomeMae.Trim();

        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Valida a CNH oficialmente na base RENACH via SENATRAN (Infosimples).
    /// Ação manual e pontual — nunca roda automaticamente, porque o site de
    /// origem limita a 5 consultas/dia por login. Exige que o usuário já tenha
    /// preenchido CPF, número de registro, nome e nome da mãe no perfil, além
    /// de informar o código de segurança (impresso no espelho/QR da CNH digital).
    /// </summary>
    [HttpPost("validar-cnh")]
    public async Task<IActionResult> ValidarCnh([FromBody] ValidarCnhRequest req)
    {
        var usuarioId = User.GetUsuarioId();
        var usuario = await _db.Usuarios.FindAsync(usuarioId);
        if (usuario is null) return NotFound();

        if (string.IsNullOrWhiteSpace(usuario.Cpf) ||
            string.IsNullOrWhiteSpace(usuario.NumeroRegistroCnh) ||
            string.IsNullOrWhiteSpace(usuario.Nome) ||
            string.IsNullOrWhiteSpace(usuario.NomeMae))
        {
            return BadRequest(new
            {
                mensagem = "Preencha CPF, número de registro, nome completo e nome da mãe no seu perfil antes de validar a CNH."
            });
        }

        if (string.IsNullOrWhiteSpace(req.CodigoSeguranca))
            return BadRequest(new { mensagem = "Informe o código de segurança da CNH (encontrado no espelho/QR da CNH digital)." });

        var resultado = await _cnhValidacaoService.ValidarAsync(
            usuario.Cpf!, usuario.NumeroRegistroCnh!, req.CodigoSeguranca.Trim(), usuario.Nome, usuario.NomeMae!);

        if (!resultado.Sucesso || resultado.Dados is null)
            return StatusCode(502, new { mensagem = $"Não foi possível validar a CNH: {resultado.MensagemErro}" });

        var dados = resultado.Dados;

        // Só sobrescreve campos que vieram preenchidos na resposta oficial —
        // preserva o que o usuário já tinha digitado quando o SENATRAN não
        // devolve algum dado específico.
        if (!string.IsNullOrWhiteSpace(dados.Categoria)) usuario.CategoriaCnh = dados.Categoria.ToUpperInvariant();
        if (dados.EmissaoData.HasValue) usuario.DataExpedicaoCnh = dados.EmissaoData.Value;
        if (dados.ValidadeData.HasValue) usuario.ValidadeCnhOficial = dados.ValidadeData.Value;
        if (!string.IsNullOrWhiteSpace(dados.Situacao)) usuario.SituacaoCnh = dados.Situacao;
        usuario.CnhValidadaEm = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Avisos importantes: se o nome informado não bate com o que consta na
        // base oficial, o usuário precisa saber — pode ser erro de digitação ou
        // algo mais sério, mas de qualquer forma merece atenção.
        var avisos = new List<string>();
        if (dados.NomeCondutorIdenticoAoInformado == false)
            avisos.Add("O nome informado não confere exatamente com o nome oficial da base do SENATRAN.");
        if (dados.NomeMaeIdenticoAoInformado == false)
            avisos.Add("O nome da mãe informado não confere exatamente com o nome oficial da base do SENATRAN.");

        return Ok(new
        {
            Sucesso = true,
            usuario.SituacaoCnh,
            usuario.CategoriaCnh,
            usuario.DataExpedicaoCnh,
            usuario.ValidadeCnhOficial,
            usuario.CnhValidadaEm,
            Avisos = avisos
        });
    }

    /// <summary>
    /// Pontuação de CNH calculada a partir das multas com pontos monitoradas
    /// pelo Sentinela, na janela móvel de 12 meses, aplicando a regra de
    /// limite (20/30/40 conforme gravidade, ou 40 fixo se atividade remunerada)
    /// da Lei 14.071/2020. Não é o extrato oficial de pontos do condutor.
    /// </summary>
    [HttpGet("pontuacao-cnh")]
    public async Task<IActionResult> ObterPontuacaoCnh()
    {
        var usuarioId = User.GetUsuarioId();
        var usuario = await _db.Usuarios
            .Include(u => u.Veiculos)
            .ThenInclude(v => v.Multas)
            .FirstOrDefaultAsync(u => u.Id == usuarioId);

        if (usuario is null) return NotFound();

        var todasAsMultas = usuario.Veiculos.SelectMany(v => v.Multas);
        var resultado = PontuacaoCnhCalculator.Calcular(todasAsMultas, usuario.AtividadeRemunerada);

        return Ok(resultado);
    }

    /// <summary>
    /// Exclusão de conta (LGPD, direito de eliminação). Confirma a senha atual
    /// antes de prosseguir. Soft delete: marca a conta como excluída e desliga
    /// o monitoramento de todos os veículos (para de consultar e notificar
    /// imediatamente), mas preserva o histórico de multas/veículos já gerado —
    /// inclusive os PDFs de defesa, que continuam válidos como registro. Se o
    /// usuário pedir remoção completa dos dados no futuro, isso vira uma
    /// segunda etapa manual (aqui só cobrimos "parar de usar o serviço").
    /// </summary>
    [HttpDelete("me")]
    public async Task<IActionResult> ExcluirConta([FromBody] ExcluirContaRequest req)
    {
        var usuarioId = User.GetUsuarioId();
        var usuario = await _db.Usuarios.Include(u => u.Veiculos).FirstOrDefaultAsync(u => u.Id == usuarioId);
        if (usuario is null) return NotFound();

        if (!_jwt.VerificarSenha(req.Senha, usuario.SenhaHash))
            return BadRequest(new { mensagem = "Senha incorreta." });

        usuario.ContaExcluida = true;
        usuario.ContaExcluidaEm = DateTime.UtcNow;
        usuario.NotificarEmail = false;
        usuario.NotificarWhatsApp = false;
        foreach (var veiculo in usuario.Veiculos)
            veiculo.MonitoramentoAtivo = false;

        await _db.SaveChangesAsync();
        _logger.LogInformation("Conta excluída (soft delete): {Email}", usuario.Email);

        return Ok(new { mensagem = "Conta excluída. Você não será mais monitorado nem notificado." });
    }
}
