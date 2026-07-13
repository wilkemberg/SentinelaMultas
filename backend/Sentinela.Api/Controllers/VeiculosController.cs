using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sentinela.Api.Data;
using Sentinela.Api.Models;
using Sentinela.Api.Services;

namespace Sentinela.Api.Controllers;

public record CriarVeiculoRequest(string Placa, string Renavam, string Uf = "RJ");

[ApiController]
[Route("api/veiculos")]
[Authorize]
public class VeiculosController : ControllerBase
{
    private readonly SentinelaDbContext _db;
    private readonly IConsultaMultasService _consultaService;
    private readonly ICtbAnaliseService _analiseService;
    private readonly INotificacaoService _notificacaoService;
    private readonly ILogger<VeiculosController> _logger;

    public VeiculosController(
        SentinelaDbContext db,
        IConsultaMultasService consultaService,
        ICtbAnaliseService analiseService,
        INotificacaoService notificacaoService,
        ILogger<VeiculosController> logger)
    {
        _db = db;
        _consultaService = consultaService;
        _analiseService = analiseService;
        _notificacaoService = notificacaoService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> ListarMeus()
    {
        var usuarioId = User.GetUsuarioId();
        var veiculos = await _db.Veiculos
            .Where(v => v.UsuarioId == usuarioId)
            .Include(v => v.Multas)
            .OrderByDescending(v => v.CriadoEm)
            .Select(v => new
            {
                v.Id,
                v.Placa,
                v.Renavam,
                v.Uf,
                v.MonitoramentoAtivo,
                v.UltimaVerificacaoEm,
                v.CriadoEm,
                TotalMultas = v.Multas.Count,
                MultasAbertas = v.Multas.Count(m =>
                    m.Status == StatusRecurso.NaoAvaliado ||
                    m.Status == StatusRecurso.RecursoViavel ||
                    m.Status == StatusRecurso.DefesaGerada),
                UltimaMultaEm = v.Multas.Any() ? v.Multas.Max(m => m.DetectadaEm) : (DateTime?)null
            })
            .ToListAsync();

        return Ok(veiculos);
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] CriarVeiculoRequest req)
    {
        var usuarioId = User.GetUsuarioId();

        // Evita duplicata de placa+renavam para o mesmo usuário
        var jaExiste = await _db.Veiculos.AnyAsync(v =>
            v.UsuarioId == usuarioId &&
            v.Placa == req.Placa.ToUpperInvariant().Trim());

        if (jaExiste)
            return Conflict(new { mensagem = "Essa placa já está cadastrada na sua conta." });

        var veiculo = new Veiculo
        {
            UsuarioId = usuarioId,
            Placa = req.Placa.ToUpperInvariant().Trim(),
            Renavam = req.Renavam.Trim(),
            Uf = req.Uf.ToUpperInvariant()
        };

        _db.Veiculos.Add(veiculo);
        await _db.SaveChangesAsync();

        return Created($"/api/veiculos/{veiculo.Id}", new
        {
            veiculo.Id,
            veiculo.Placa,
            veiculo.Renavam,
            veiculo.Uf,
            veiculo.MonitoramentoAtivo,
            veiculo.CriadoEm
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Remover(Guid id)
    {
        var usuarioId = User.GetUsuarioId();
        var veiculo = await _db.Veiculos.FirstOrDefaultAsync(v => v.Id == id && v.UsuarioId == usuarioId);
        if (veiculo is null) return NotFound();

        _db.Veiculos.Remove(veiculo);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/monitoramento")]
    public async Task<IActionResult> AlternarMonitoramento(Guid id, [FromQuery] bool ativo)
    {
        var usuarioId = User.GetUsuarioId();
        var veiculo = await _db.Veiculos.FirstOrDefaultAsync(v => v.Id == id && v.UsuarioId == usuarioId);
        if (veiculo is null) return NotFound();

        veiculo.MonitoramentoAtivo = ativo;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Consulta agora (não espera o job das 07:00). Útil logo após o cadastro.
    /// Retorna as multas novas encontradas nesta verificação.
    /// </summary>
    [HttpPost("{id:guid}/verificar-agora")]
    public async Task<IActionResult> VerificarAgora(Guid id)
    {
        var usuarioId = User.GetUsuarioId();
        var veiculo = await _db.Veiculos
            .Include(v => v.Usuario)
            .Include(v => v.Multas)
            .FirstOrDefaultAsync(v => v.Id == id && v.UsuarioId == usuarioId);

        if (veiculo is null || veiculo.Usuario is null) return NotFound();

        try
        {
            var resultado = await _consultaService.ConsultarAsync(veiculo.Placa, veiculo.Renavam, veiculo.Uf);

            if (!resultado.Sucesso)
                return StatusCode(502, new { mensagem = $"Falha ao consultar órgãos: {resultado.MensagemErro}" });

            var multasPorNumero = veiculo.Multas.ToDictionary(m => m.NumeroAutoInfracao);
            var encontradasDeduplicadas = resultado.Multas
                // Defesa extra contra duplicidade (além da que já acontece dentro
                // do serviço de consulta) — evita violar o índice único
                // (VeiculoId, NumeroAutoInfracao) do banco.
                .GroupBy(m => m.NumeroAutoInfracao)
                .Select(g => g.First())
                .ToList();

            var novas = encontradasDeduplicadas
                .Where(m => !multasPorNumero.ContainsKey(m.NumeroAutoInfracao))
                .ToList();

            var multasCriadas = new List<Multa>();
            var multasAtualizadas = new List<Multa>();

            foreach (var encontrada in novas)
            {
                var analise = await _analiseService.AnalisarAsync(encontrada);
                var multa = new Multa
                {
                    VeiculoId = veiculo.Id,
                    NumeroAutoInfracao = encontrada.NumeroAutoInfracao,
                    OrgaoAutuador = encontrada.OrgaoAutuador,
                    CodigoInfracaoCtb = encontrada.CodigoInfracaoCtb,
                    ArtigoCtb = analise.ArtigoCtb,
                    DescricaoInfracao = encontrada.DescricaoInfracao,
                    Gravidade = analise.Gravidade,
                    Valor = encontrada.Valor,
                    Pontos = encontrada.Pontos,
                    DataInfracao = encontrada.DataInfracao,
                    PrazoDefesaPrevia = analise.PrazoEstimado,
                    Status = analise.RecursoRecomendado ? StatusRecurso.RecursoViavel : StatusRecurso.RecursoNaoRecomendado,
                    AnaliseIa = analise.ExplicacaoSimples,
                    FundamentacaoRecurso = analise.JustificativaRecurso,
                    ComoEvitarNoFuturo = analise.ComoEvitarNoFuturo,
                    LocalInfracao = encontrada.Local,
                    Municipio = encontrada.Municipio,
                    AutuacaoPdfUrl = encontrada.AutuacaoPdfUrl,
                    BoletoPdfUrl = encontrada.BoletoPdfUrl,
                    AnalisadaEm = DateTime.UtcNow
                };

                _db.Multas.Add(multa);
                multasCriadas.Add(multa);
            }

            // Reconcilia multas já existentes cujos dados ficaram incompletos
            // (valor/pontos zerados, artigo vazio ou data caindo no fallback
            // "agora" — problemas de uma versão anterior da extração). Sem isso,
            // as multas já salvas continuariam erradas para sempre, já que a
            // deduplicação normalmente as ignora por completo.
            foreach (var encontrada in encontradasDeduplicadas)
            {
                if (!multasPorNumero.TryGetValue(encontrada.NumeroAutoInfracao, out var existente))
                    continue;

                var precisaAtualizar =
                    existente.Valor <= 0 ||
                    existente.Pontos <= 0 ||
                    string.IsNullOrWhiteSpace(existente.ArtigoCtb) ||
                    existente.DataInfracao.Date != encontrada.DataInfracao.Date;

                if (!precisaAtualizar) continue;

                var analise = await _analiseService.AnalisarAsync(encontrada);
                existente.CodigoInfracaoCtb = encontrada.CodigoInfracaoCtb;
                existente.ArtigoCtb = analise.ArtigoCtb;
                existente.Gravidade = analise.Gravidade;
                existente.Valor = encontrada.Valor;
                existente.Pontos = encontrada.Pontos;
                existente.DataInfracao = encontrada.DataInfracao;
                existente.PrazoDefesaPrevia = analise.PrazoEstimado;
                existente.LocalInfracao = encontrada.Local;
                existente.Municipio = encontrada.Municipio;
                existente.AutuacaoPdfUrl ??= encontrada.AutuacaoPdfUrl;
                existente.BoletoPdfUrl ??= encontrada.BoletoPdfUrl;
                if (string.IsNullOrWhiteSpace(existente.AnaliseIa))
                    existente.AnaliseIa = analise.ExplicacaoSimples;

                multasAtualizadas.Add(existente);
            }

            veiculo.UltimaVerificacaoEm = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                PlacaVerificada = veiculo.Placa,
                TotalMultasEncontradas = resultado.Multas.Count,
                MultasNovas = multasCriadas.Count,
                MultasAtualizadas = multasAtualizadas.Count,
                Ids = multasCriadas.Select(m => m.Id)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao verificar veículo {Placa} manualmente", veiculo.Placa);
            // TODO: trocar por mensagem genérica antes de expor a API publicamente —
            // por ora, devolvemos a cadeia completa de exceções (incluindo a inner
            // exception, onde o Npgsql/EF Core coloca o motivo real) para
            // diagnosticar sem precisar dos logs do container.
            return StatusCode(500, new { mensagem = $"Erro interno ao processar a verificação: {DescreverExcecao(ex)}" });
        }
    }

    private static string DescreverExcecao(Exception ex)
    {
        var partes = new List<string>();
        var atual = ex;
        while (atual is not null)
        {
            partes.Add(atual.Message);
            atual = atual.InnerException;
        }
        return string.Join(" → ", partes);
    }
}
