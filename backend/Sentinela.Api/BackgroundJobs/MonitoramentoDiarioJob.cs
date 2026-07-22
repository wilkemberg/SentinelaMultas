using Microsoft.EntityFrameworkCore;
using Sentinela.Api.Data;
using Sentinela.Api.Models;
using Sentinela.Api.Services;

namespace Sentinela.Api.BackgroundJobs;

/// <summary>
/// Roda 1x/dia às 10:00. Para cada veículo com monitoramento ativo:
/// - Consulta SERPRO/RADAR (base nacional RENAINF) — fonte única de multas
/// - Cria registros de Multa para o que for novo
/// - Manda para análise completa da IA (CTB + defesa)
/// - Dispara notificação por e-mail e/ou WhatsApp
/// </summary>
public class MonitoramentoDiarioJob : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<MonitoramentoDiarioJob> _logger;
    private static readonly TimeSpan HorarioExecucao = new(10, 0, 0); // 10:00 diariamente

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

            // Falha por veículo já é tratada dentro de RodarVerificacaoAsync (um
            // veículo com erro não derruba os demais). Este try/catch cobre uma
            // falha catastrófica do ciclo inteiro (ex.: banco de dados fora do
            // ar) — sem isso, o BackgroundService simplesmente encerrava a task
            // silenciosamente e o monitoramento parava até o container reiniciar,
            // sem log nem aviso nenhum.
            try
            {
                await RodarVerificacaoAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogCritical(ex, "Falha catastrófica na verificação diária — o ciclo de hoje não foi concluído.");
                await AlertarFalhaCriticaAsync(ex, stoppingToken);
            }
        }
    }

    /// <summary>
    /// Best-effort: avisa o admin (Resend:EmailAdmin) que o ciclo diário falhou
    /// por completo. Nunca deixa uma falha aqui derrubar o loop principal —
    /// o pior cenário é só não ter recebido o alerta, e o erro já está no log.
    /// </summary>
    private async Task AlertarFalhaCriticaAsync(Exception ex, CancellationToken ct)
    {
        try
        {
            using var scope = _services.CreateScope();
            var notificacaoService = scope.ServiceProvider.GetRequiredService<INotificacaoService>();
            await notificacaoService.EnviarAlertaOperacionalAsync(
                "Verificação diária falhou",
                $"O ciclo de verificação diária de multas falhou por completo às {DateTime.Now:dd/MM/yyyy HH:mm}.\n\nErro: {ex.Message}",
                ct);
        }
        catch (Exception alertaEx)
        {
            _logger.LogError(alertaEx, "Falha ao enviar alerta operacional de falha do job diário.");
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
                // Consulta a fonte única (SERPRO/RADAR — base nacional RENAINF)
                var resultado = await consultaService.ConsultarAsync(veiculo.Placa, veiculo.Renavam, veiculo.Uf, ct);
                if (!resultado.Sucesso)
                {
                    _logger.LogError("Falha ao consultar SERPRO/RADAR para {Placa}: {Erro}", veiculo.Placa, resultado.MensagemErro);
                    continue;
                }

                var multasPorNumero = veiculo.Multas.ToDictionary(m => m.NumeroAutoInfracao);
                var encontradasDeduplicadas = MultasMerge.Combinar(resultado.Multas);

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

                    // Sempre atualiza as fontes que confirmaram esta multa, mesmo
                    // quando nada mais precisa mudar (evita chamar a IA à toa).
                    existente.FontesConfirmacao = MultasMerge.CombinarFontes(existente.FontesConfirmacao, encontrada.Fonte);

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
                            FontesConfirmacao = encontrada.Fonte,
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
