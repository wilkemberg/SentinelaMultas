using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sentinela.Api.Data;
using Sentinela.Api.Models;
using Sentinela.Api.Services;

namespace Sentinela.Api.Controllers;

[ApiController]
[Route("api/multas")]
[Authorize]
public class MultasController : ControllerBase
{
    private readonly SentinelaDbContext _db;
    private readonly ICtbAnaliseService _analiseService;
    private readonly ILogger<MultasController> _logger;

    public MultasController(SentinelaDbContext db, ICtbAnaliseService analiseService, ILogger<MultasController> logger)
    {
        _db = db;
        _analiseService = analiseService;
        _logger = logger;
    }

    [HttpGet("minha")]
    public async Task<IActionResult> ListarMinhas()
    {
        var usuarioId = User.GetUsuarioId();
        var multas = await _db.Multas
            .Include(m => m.Veiculo)
            .Where(m => m.Veiculo!.UsuarioId == usuarioId)
            .OrderByDescending(m => m.DetectadaEm)
            .Select(m => new
            {
                m.Id,
                m.NumeroAutoInfracao,
                m.OrgaoAutuador,
                m.CodigoInfracaoCtb,
                m.ArtigoCtb,
                m.DescricaoInfracao,
                m.Gravidade,
                m.Valor,
                m.Pontos,
                m.DataInfracao,
                m.PrazoDefesaPrevia,
                m.PrazoRecursoJari,
                m.Status,
                m.AnaliseIa,
                m.ChanceRecursoPercent,
                m.OndeRecorrer,
                m.OndeObterDesconto,
                m.LocalInfracao,
                m.AutuacaoPdfUrl,
                m.BoletoPdfUrl,
                m.FontesConfirmacao,
                m.DetectadaEm,
                m.AnalisadaEm,
                PlacaVeiculo = m.Veiculo!.Placa,
                VeiculoId = m.Veiculo.Id,
                DiasParaPrazo = m.PrazoDefesaPrevia.HasValue
                    ? (int)(m.PrazoDefesaPrevia.Value - DateTime.UtcNow).TotalDays
                    : (int?)null
            })
            .ToListAsync();

        return Ok(multas);
    }

    [HttpGet("veiculo/{veiculoId:guid}")]
    public async Task<IActionResult> ListarPorVeiculo(Guid veiculoId)
    {
        var usuarioId = User.GetUsuarioId();

        // Verifica que o veículo pertence ao usuário autenticado
        var veiculoDoUsuario = await _db.Veiculos.AnyAsync(v => v.Id == veiculoId && v.UsuarioId == usuarioId);
        if (!veiculoDoUsuario) return Forbid();

        var multas = await _db.Multas
            .Where(m => m.VeiculoId == veiculoId)
            .OrderByDescending(m => m.DetectadaEm)
            .ToListAsync();

        return Ok(multas);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObterDetalhe(Guid id)
    {
        var usuarioId = User.GetUsuarioId();
        var multa = await _db.Multas
            .Include(m => m.Veiculo)
            .FirstOrDefaultAsync(m => m.Id == id && m.Veiculo!.UsuarioId == usuarioId);

        return multa is null ? NotFound() : Ok(multa);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> AtualizarStatus(Guid id, [FromQuery] StatusRecurso status)
    {
        var usuarioId = User.GetUsuarioId();
        var multa = await _db.Multas
            .Include(m => m.Veiculo)
            .FirstOrDefaultAsync(m => m.Id == id && m.Veiculo!.UsuarioId == usuarioId);

        if (multa is null) return NotFound();

        multa.Status = status;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Regera a defesa para uma multa. Útil se o usuário quiser personalizar
    /// ou se a primeira geração falhou.
    /// </summary>
    [HttpPost("{id:guid}/gerar-defesa")]
    public async Task<IActionResult> GerarDefesa(Guid id)
    {
        var usuarioId = User.GetUsuarioId();
        var multa = await _db.Multas
            .Include(m => m.Veiculo)
            .FirstOrDefaultAsync(m => m.Id == id && m.Veiculo!.UsuarioId == usuarioId);

        if (multa is null) return NotFound();

        try
        {
            var encontrada = new MultaEncontrada(
                multa.NumeroAutoInfracao,
                multa.OrgaoAutuador,
                multa.CodigoInfracaoCtb,
                multa.DescricaoInfracao,
                multa.Valor,
                multa.Pontos,
                multa.DataInfracao);

            var analise = await _analiseService.AnalisarAsync(encontrada);
            var textoDefesa = await _analiseService.GerarTextoDefesaAsync(multa, analise);

            multa.TextoDefesa = textoDefesa;
            multa.FundamentacaoRecurso = analise.JustificativaRecurso;
            multa.Status = StatusRecurso.DefesaGerada;
            multa.AnalisadaEm = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                multaId = multa.Id,
                textoDefesa,
                analise.ArtigoCtb,
                analise.JustificativaRecurso,
                analise.RecursoRecomendado
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao gerar defesa para multa {Id}", id);
            return StatusCode(500, new { mensagem = "Falha ao gerar defesa. Tente novamente." });
        }
    }
}
