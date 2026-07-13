using Microsoft.EntityFrameworkCore;
using Sentinela.Api.Data;
using Sentinela.Api.Models;
using Sentinela.Api.Services;

namespace Sentinela.Api.BackgroundJobs;

/// <summary>
/// Roda 1x/dia às 07:00. Para cada veículo com monitoramento ativo:
/// - Consulta DETRAN-RJ, CET-Rio e PRF em paralelo (via MultiOrgaoConsultaService)
/// - Cria registros de Multa para o que for novo
/// - Manda para análise completa da IA (CTB + defesa)
/// - Dispara notificação por e-mail e/ou WhatsApp
/// </summary>
public class MonitoramentoDiarioJob : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<MonitoramentoDiarioJob> _logger;
    private static readonly TimeSpan HorarioExecucao = new(7, 0, 0); // 07:00 diariamente

    public MonitoramentoDiarioJob(IServiceProvider services, ILogger<MonitoramentoDiarioJob> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var agora = DateTime.Now;
            var proximaExecucao = agora.Date.Add(HorarioExecucao);
            if (proximaExecucao <= agora) proximaExecucao = proximaExecucao.AddDays(1);

            var atraso = proximaExecucao - agora;
            _logger.LogInformation("Próxima verificação diária em {Atraso:hh\\:mm\\:ss}", atraso);
            await Task.Delay(atraso, stoppingToken);

            if (stoppingToken.IsCancellationRequested) break;

            await RodarVerificacaoAsync(stoppingToken);
        }
    }

    private async Task RodarVerificacaoAsync(CancellationToken ct)
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SentinelaDbContext>();
        var consultaService = scope.ServiceProvider.GetRequiredService<IConsultaMultasService>();
        var analiseService = scope.ServiceProvider.GetRequiredService<ICtbAnaliseService>();
        var notificacaoService = scope.ServiceProvider.GetRequiredService<INotificacaoService>();

        var veiculos = await db.Veiculos
            .Include(v => v.Usuario)
            .Include(v => v.Multas)
            .Where(v => v.MonitoramentoAtivo)
            .ToListAsync(ct);

        _logger.LogInformation("Iniciando verificação diária D-1 para {Total} veículos", veiculos.Count);

        // Processa veículos com delay para não sobrecarregar a API
        foreach (var veiculo in veiculos)
        {
            if (veiculo.Usuario is null) continue;

            try
            {
                // Consulta todos os órgãos em paralelo
                var resultado = await consultaService.ConsultarAsync(veiculo.Placa, veiculo.Renavam, veiculo.Uf, ct);

                if (!resultado.Sucesso)
                {
                    _logger.LogError("Falha ao consultar {Placa}: {Erro}", veiculo.Placa, resultado.MensagemErro);
                    continue;
                }

                var multasPorNumero = veiculo.Multas.ToDictionary(m => m.NumeroAutoInfracao);
                var encontradasDeduplicadas = resultado.Multas
                    // Evita violar o índice único (VeiculoId, NumeroAutoInfracao) caso o
                    // provedor de consulta liste a mesma infração mais de uma vez.
                    .GroupBy(m => m.NumeroAutoInfracao)
                    .Select(g => g.First())
                    .ToList();

                var novas = encontradasDeduplicadas
                    .Where(m => !multasPorNumero.ContainsKey(m.NumeroAutoInfracao))
                    .ToList();

                // Reconcilia multas já existentes com dados incompletos (valor/pontos
                // zerados, artigo vazio, data caindo no fallback "agora") — mesma
                // lógica do endpoint "verificar agora" manual.
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

                    var analiseExistente = await analiseService.AnalisarAsync(encontrada, ct);
                    existente.CodigoInfracaoCtb = encontrada.CodigoInfracaoCtb;
                    existente.ArtigoCtb = analiseExistente.ArtigoCtb;
                    existente.Gravidade = analiseExistente.Gravidade;
                    existente.Valor = encontrada.Valor;
                    existente.Pontos = encontrada.Pontos;
                    existente.DataInfracao = encontrada.DataInfracao;
                    existente.PrazoDefesaPrevia = analiseExistente.PrazoEstimado;
                    existente.LocalInfracao = encontrada.Local;
                    existente.Municipio = encontrada.Municipio;
                    existente.AutuacaoPdfUrl ??= encontrada.AutuacaoPdfUrl;
                    existente.BoletoPdfUrl ??= encontrada.BoletoPdfUrl;
                    if (string.IsNullOrWhiteSpace(existente.AnaliseIa))
                        existente.AnaliseIa = analiseExistente.ExplicacaoSimples;
                }

                if (novas.Count == 0)
                {
                    _logger.LogInformation("Placa {Placa}: sem multas novas", veiculo.Placa);
                    await notificacaoService.NotificarSemMultasAsync(veiculo.Usuario, veiculo, ct);
                }
                else
                {
                    _logger.LogInformation("Placa {Placa}: {Count} multas novas encontradas", veiculo.Placa, novas.Count);

                    foreach (var encontrada in novas)
                    {
                        var analise = await analiseService.AnalisarAsync(encontrada, ct);

                        // Calcula prazos reais por órgão
                        var prazoDefesa = encontrada.DataInfracao.AddDays(30);
                        var prazoJari = prazoDefesa.AddDays(30);
                        var prazoCetran = prazoJari.AddDays(30);

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
                            PrazoDefesaPrevia = prazoDefesa,
                            PrazoRecursoJari = prazoJari,
                            PrazoRecursoCetran = prazoCetran,
                            Status = analise.RecursoRecomendado
                                ? StatusRecurso.RecursoViavel
                                : StatusRecurso.RecursoNaoRecomendado,
                            AnaliseIa = analise.ExplicacaoSimples,
                            FundamentacaoRecurso = analise.JustificativaRecurso,
                            ComoEvitarNoFuturo = analise.ComoEvitarNoFuturo,
                            LocalInfracao = encontrada.Local,
                            Municipio = encontrada.Municipio,
                            AutuacaoPdfUrl = encontrada.AutuacaoPdfUrl,
                            BoletoPdfUrl = encontrada.BoletoPdfUrl,
                            AnalisadaEm = DateTime.UtcNow,
                        };

                        // Campos extras do record estendido (se disponíveis)
                        if (analise is AnaliseCtbCompleta completa)
                        {
                            multa.ChanceRecursoPercent = completa.ChanceRecursoPercent;
                            multa.OndeRecorrer = completa.OndeRecorrer;
                            multa.OndeObterDesconto = completa.OndeObterDesconto;
                        }

                        db.Multas.Add(multa);

                        await notificacaoService.NotificarMultaEncontradaAsync(
                            veiculo.Usuario, veiculo, multa, analise, ct);
                    }
                }

                veiculo.UltimaVerificacaoEm = DateTime.UtcNow;
                await db.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro processando veículo {Placa}", veiculo.Placa);
            }

            // Pequeno delay entre veículos para não saturar a API externa
            await Task.Delay(TimeSpan.FromSeconds(2), ct);
        }

        _logger.LogInformation("Verificação diária D-1 concluída para {Total} veículos", veiculos.Count);
    }
}
