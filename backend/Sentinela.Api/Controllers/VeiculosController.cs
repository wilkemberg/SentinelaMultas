using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sentinela.Api.Data;
using Sentinela.Api.Models;
using Sentinela.Api.Services;

namespace Sentinela.Api.Controllers;

public record CriarVeiculoRequest(string Placa, string Renavam, string Uf = "RJ", string? CpfProprietario = null, string? Tipo = null);

[ApiController]
[Route("api/veiculos")]
[Authorize]
public class VeiculosController : ControllerBase
{
    private readonly SentinelaDbContext _db;
    private readonly IConsultaMultasService _consultaService;
    private readonly IConsultaMultasDetranRjService _consultaDetranRjService;
    private readonly ICtbAnaliseService _analiseService;
    private readonly INotificacaoService _notificacaoService;
    private readonly ILogger<VeiculosController> _logger;

    public VeiculosController(
        SentinelaDbContext db,
        IConsultaMultasService consultaService,
        IConsultaMultasDetranRjService consultaDetranRjService,
        ICtbAnaliseService analiseService,
        INotificacaoService notificacaoService,
        ILogger<VeiculosController> logger)
    {
        _db = db;
        _consultaService = consultaService;
        _consultaDetranRjService = consultaDetranRjService;
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
                v.Tipo,
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

        // CPF é opcional: só faz sentido preencher quando o veículo NÃO está no
        // nome do dono da conta (carro financiado, de terceiro, de empresa) —
        // caso comum, o Sentinela usa o CPF já cadastrado no perfil (Usuario.Cpf).
        var cpfLimpo = string.IsNullOrWhiteSpace(req.CpfProprietario)
            ? null
            : new string(req.CpfProprietario.Where(char.IsDigit).ToArray());

        if (!string.IsNullOrEmpty(cpfLimpo) && cpfLimpo.Length != 11)
            return BadRequest(new { mensagem = "CPF do proprietário inválido. Deve ter 11 dígitos, ou deixe em branco para usar o CPF do seu perfil." });

        // Tipo (Carro/Moto) é só um detalhe de exibição — qualquer valor não
        // reconhecido cai em Carro, nunca bloqueia o cadastro por causa disso.
        var tipo = Enum.TryParse<TipoVeiculo>(req.Tipo, ignoreCase: true, out var tipoParsed)
            ? tipoParsed
            : TipoVeiculo.Carro;

        var veiculo = new Veiculo
        {
            UsuarioId = usuarioId,
            Placa = req.Placa.ToUpperInvariant().Trim(),
            Renavam = req.Renavam.Trim(),
            Uf = req.Uf.ToUpperInvariant(),
            CpfProprietario = cpfLimpo,
            Tipo = tipo
        };

        _db.Veiculos.Add(veiculo);
        await _db.SaveChangesAsync();

        return Created($"/api/veiculos/{veiculo.Id}", new
        {
            veiculo.Id,
            veiculo.Placa,
            veiculo.Renavam,
            veiculo.Uf,
            veiculo.Tipo,
            veiculo.CpfProprietario,
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
    /// Consulta agora (não espera o job das 10:00). Útil logo após o cadastro.
    /// Retorna as multas novas encontradas nesta verificação.
    /// </summary>
    [HttpPost("{id:guid}/verificar-agora")]
    public async Task<IActionResult> VerificarAgora(Guid id, CancellationToken ct)
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
                _logger.LogWarning("SERPRO/RADAR falhou para {Placa}, tentando seguir só com DETRAN-RJ: {Erro}", veiculo.Placa, resultado.MensagemErro);

            // Segunda fonte (DETRAN-RJ) — complementa o SERPRO/RADAR, que só reflete
            // o RENAINF (base nacional) depois que o órgão autuador conclui seu
            // próprio trâmite interno. IMPORTANTE: essa consulta roda mesmo que o
            // SERPRO/RADAR tenha falhado acima — é justamente o cenário real que
            // motivou essa segunda fonte existir (multa já visível no DETRAN-RJ,
            // mas o SERPRO/RADAR não retorna nada para aquela placa/renavam).
            // Abortar aqui em cima teria travado a verificação antes de sequer
            // tentar a fonte que, na prática, era a única com a multa.
            var cpfParaDetranRj = veiculo.CpfProprietario ?? veiculo.Usuario.Cpf ?? "";
            var resultadoDetranRj = await _consultaDetranRjService.ConsultarAsync(cpfParaDetranRj, veiculo.Renavam);
            if (!resultadoDetranRj.Sucesso)
                _logger.LogWarning("DETRAN-RJ Nada Consta falhou para {Placa}, seguindo só com SERPRO/RADAR: {Erro}", veiculo.Placa, resultadoDetranRj.MensagemErro);

            // Só falha de verdade se AS DUAS fontes falharam — se pelo menos uma
            // respondeu (mesmo que com zero multas), a verificação é válida.
            if (!resultado.Sucesso && !resultadoDetranRj.Sucesso)
                return StatusCode(502, new { mensagem = $"Falha ao consultar as duas fontes de multas. SERPRO/RADAR: {resultado.MensagemErro} | DETRAN-RJ: {resultadoDetranRj.MensagemErro}" });

            var multasPorNumero = veiculo.Multas.ToDictionary(m => m.NumeroAutoInfracao);
            var encontradasDeduplicadas = MultasMerge.Combinar(resultado.Multas, resultadoDetranRj.Multas);

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
                    FontesConfirmacao = encontrada.Fonte,
                    AnalisadaEm = DateTime.UtcNow
                };

                // Campos extras do record estendido (se disponíveis) — mesma
                // lógica do job diário, faltava aqui na verificação manual.
                if (analise is AnaliseCtbCompleta completa)
                {
                    multa.ChanceRecursoPercent = completa.ChanceRecursoPercent;
                    multa.OndeRecorrer = completa.OndeRecorrer;
                    multa.OndeObterDesconto = completa.OndeObterDesconto;
                }

                _db.Multas.Add(multa);
                multasCriadas.Add(multa);

                // Notifica (e-mail com PDF anexo da multa + WhatsApp, se
                // habilitados) já na verificação manual — antes só o job diário
                // das 10:00 avisava; "Verificar agora" só atualizava a tela.
                await _notificacaoService.NotificarMultaEncontradaAsync(veiculo.Usuario, veiculo, multa, analise, ct);
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

                // Sempre atualiza quais fontes confirmaram esta multa — operação
                // barata (sem IA), independente de mais algum outro campo ter
                // mudado. Ex.: uma multa vista antes só no DETRAN-RJ pode passar a
                // aparecer também no SERPRO/RADAR num ciclo seguinte.
                var fontesAtualizadas = MultasMerge.CombinarFontes(existente.FontesConfirmacao, encontrada.Fonte);
                if (fontesAtualizadas != existente.FontesConfirmacao)
                {
                    existente.FontesConfirmacao = fontesAtualizadas;
                    if (!multasAtualizadas.Contains(existente))
                        multasAtualizadas.Add(existente);
                }

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

                if (!multasAtualizadas.Contains(existente))
                    multasAtualizadas.Add(existente);
            }

            veiculo.UltimaVerificacaoEm = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            // Mesma notificação de "tudo certo" que o job diário manda quando
            // não há multa nova — mantém consistência entre os dois caminhos.
            if (multasCriadas.Count == 0)
                await _notificacaoService.NotificarSemMultasAsync(veiculo.Usuario, veiculo, ct);

            return Ok(new
            {
                PlacaVerificada = veiculo.Placa,
                TotalMultasEncontradas = encontradasDeduplicadas.Count,
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
