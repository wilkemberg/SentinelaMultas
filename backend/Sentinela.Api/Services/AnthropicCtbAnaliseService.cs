using System.Text;
using System.Text.Json;
using Sentinela.Api.Models;

namespace Sentinela.Api.Services;

/// <summary>
/// Usa a API da Anthropic (Claude) com os trechos do CTB recuperados via busca
/// por relevância para:
///  1. Explicar a multa em linguagem simples
///  2. Decidir se vale recurso (com % estimada de sucesso)
///  3. Orientar onde e como recorrer (JARI → CETRAN → Judiciário)
///  4. Indicar onde obter desconto se não recorrer
///  5. Gerar o texto completo da defesa
/// Requer Anthropic:ApiKey configurada em appsettings.
/// </summary>
public class AnthropicCtbAnaliseService : ICtbAnaliseService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ICtbBaseConhecimentoService _baseConhecimento;
    private readonly ILogger<AnthropicCtbAnaliseService> _logger;

    public AnthropicCtbAnaliseService(
        HttpClient http,
        IConfiguration config,
        ICtbBaseConhecimentoService baseConhecimento,
        ILogger<AnthropicCtbAnaliseService> logger)
    {
        _http = http;
        _config = config;
        _baseConhecimento = baseConhecimento;
        _logger = logger;
    }

    public async Task<AnaliseCtb> AnalisarAsync(MultaEncontrada multa, CancellationToken ct = default)
    {
        // Fallback quando a chave da Anthropic não está configurada. Mesmo sem IA,
        // usamos a tabela de referência do CTB (valores fixados por lei) para que
        // ao menos artigo/gravidade fiquem corretos — antes disso, TODA infração
        // caía aqui como "Média" hardcoded, mesmo sendo Gravíssima na prática.
        var apiKey = _config["Anthropic:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("Anthropic:ApiKey não configurada. Retornando análise padrão.");
            var infoTabela = CtbTabelaReferencia.Buscar(multa.DescricaoInfracao);
            var artigo = !string.IsNullOrWhiteSpace(multa.CodigoInfracaoCtb) ? multa.CodigoInfracaoCtb : infoTabela?.Artigo ?? "";
            var gravidade = infoTabela?.Gravidade ?? GravidadeInfracao.Media;
            return new AnaliseCtb(
                ExplicacaoSimples: $"Infração registrada pelo {multa.OrgaoAutuador}: {multa.DescricaoInfracao}. Configure a chave da IA para uma análise jurídica detalhada e personalizada.",
                ArtigoCtb: artigo,
                Gravidade: gravidade,
                RecursoRecomendado: false,
                JustificativaRecurso: "Análise de IA indisponível — configure Anthropic:ApiKey para uma avaliação real de chance de recurso.",
                PrazoEstimado: multa.DataInfracao.AddDays(30),
                ComoEvitarNoFuturo: "Consulte o CTB para detalhes sobre a infração."
            );
        }

        var trechos = await _baseConhecimento.BuscarTrechosRelevantesAsync(
            $"{multa.CodigoInfracaoCtb} {multa.DescricaoInfracao} {multa.OrgaoAutuador}", topK: 8, ct: ct);

        var contexto = string.Join("\n---\n", trechos);

        var systemPromptTemplate = """
            Você é o motor de análise jurídica do Sentinela, um serviço brasileiro que ajuda
            motoristas a entender multas de trânsito e decidir como agir. Sua missão é:
            1. Explicar a multa em linguagem simples e direta (sem juridiquês)
            2. Avaliar honestamente se vale a pena recorrer
            3. Orientar onde e como recorrer, com prazos reais
            4. Indicar onde conseguir desconto se não recorrer
            5. Dizer o que o motorista deve fazer AGORA

            Use SOMENTE os trechos do CTB fornecidos abaixo. Nunca invente artigo ou prazo.
            Seja direto, útil e empático. O usuário está com medo de perder o prazo.

            TRECHOS DO CTB / CONTRAN / PROCEDIMENTOS:
            __CONTEXTO__

            Responda SOMENTE em JSON válido, sem markdown, no formato exato:
            {
              "explicacao_simples": "string — o que aconteceu, por que gerou multa, em 2-3 frases simples",
              "artigo_ctb": "string — ex: Art. 218, III, CTB",
              "gravidade": "Leve|Media|Grave|Gravissima",
              "recurso_recomendado": true|false,
              "chance_recurso_percent": 0-100,
              "justificativa_recurso": "string — argumento legal concreto para recorrer, ou por que não vale",
              "onde_recorrer": "string — JARI do órgão + prazo + portal online se houver",
              "o_que_fazer_agora": "string — passo a passo em 3-4 bullets do que o motorista faz hoje",
              "onde_obter_desconto": "string — PagTesouro, portal do órgão, parcelamento, condições",
              "como_evitar_no_futuro": "string — 1 frase prática"
            }
            """;

        var systemPrompt = systemPromptTemplate.Replace("__CONTEXTO__", contexto);

        var userPrompt = $"""
            Auto de infração: {multa.NumeroAutoInfracao}
            Órgão autuador: {multa.OrgaoAutuador}
            Código da infração CTB: {multa.CodigoInfracaoCtb}
            Descrição: {multa.DescricaoInfracao}
            Valor: R$ {multa.Valor:F2}
            Pontos: {multa.Pontos}
            Data da infração: {multa.DataInfracao:dd/MM/yyyy}
            Local: {multa.Local ?? "não informado"}
            """;

        var respostaJson = await ChamarClaudeAsync(systemPrompt, userPrompt, ct);

        try
        {
            using var doc = JsonDocument.Parse(respostaJson);
            var root = doc.RootElement;

            Enum.TryParse<GravidadeInfracao>(root.GetProperty("gravidade").GetString(), out var gravidade);
            var chancePercent = root.TryGetProperty("chance_recurso_percent", out var cp) && cp.TryGetDouble(out var d) ? d : 0d;

            return new AnaliseCtbCompleta(
                ExplicacaoSimples: root.GetProperty("explicacao_simples").GetString() ?? "",
                ArtigoCtb: root.GetProperty("artigo_ctb").GetString() ?? "",
                Gravidade: gravidade,
                RecursoRecomendado: root.GetProperty("recurso_recomendado").GetBoolean(),
                ChanceRecursoPercent: chancePercent,
                JustificativaRecurso: root.GetProperty("justificativa_recurso").GetString() ?? "",
                OndeRecorrer: root.TryGetProperty("onde_recorrer", out var or) ? or.GetString() ?? "" : "",
                OQueFazerAgora: root.TryGetProperty("o_que_fazer_agora", out var of) ? of.GetString() ?? "" : "",
                OndeObterDesconto: root.TryGetProperty("onde_obter_desconto", out var od) ? od.GetString() ?? "" : "",
                PrazoEstimado: multa.DataInfracao.AddDays(30),
                ComoEvitarNoFuturo: root.GetProperty("como_evitar_no_futuro").GetString() ?? ""
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao parsear resposta da análise da IA: {Json}", respostaJson);
            throw;
        }
    }

    public async Task<string> GerarTextoDefesaAsync(Multa multa, AnaliseCtb analise, CancellationToken ct = default)
    {
        var apiKey = _config["Anthropic:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return $"""
                DEFESA PRÉVIA — AUTO DE INFRAÇÃO Nº {multa.NumeroAutoInfracao}

                [Configure a chave Anthropic:ApiKey para gerar o texto completo da defesa automaticamente]

                Órgão: {multa.OrgaoAutuador}
                Infração: {multa.DescricaoInfracao}
                Data: {multa.DataInfracao:dd/MM/yyyy}
                Artigo: {analise.ArtigoCtb}
                """;
        }

        var dataAtual = DateTime.Now.ToString("dd/MM/yyyy");
        var orgao = multa.OrgaoAutuador;
        var jari = orgao switch
        {
            var o when o.Contains("PRF") => "JARI/PRF — Polícia Rodoviária Federal",
            var o when o.Contains("CET") => "JARI Municipal — CET-Rio / Prefeitura do Rio de Janeiro",
            _ => "JARI — DETRAN-RJ"
        };

        var systemPrompt = """
            Você é especialista em defesas administrativas de trânsito brasileiras.
            Redija uma defesa prévia formal, objetiva e bem fundamentada em português brasileiro.
            Use linguagem jurídica mas acessível. Estruture com: (1) Preâmbulo, (2) Dos Fatos,
            (3) Do Direito, (4) Do Pedido. Seja preciso, sem retórica vazia.
            Retorne apenas o texto da defesa, pronto para protocolar.
            """;

        var userPrompt = $"""
            Redija uma defesa prévia para o seguinte auto de infração:

            Auto nº: {multa.NumeroAutoInfracao}
            Órgão autuador: {orgao}
            Artigo violado segundo auto: {analise.ArtigoCtb}
            Descrição da infração: {multa.DescricaoInfracao}
            Data da infração: {multa.DataInfracao:dd/MM/yyyy}
            Valor da multa: R$ {multa.Valor:F2}
            Pontos na CNH: {multa.Pontos}
            Órgão de recurso: {jari}
            Data de hoje: {dataAtual}

            Fundamentação técnica (use como base jurídica da defesa):
            {analise.JustificativaRecurso}

            A defesa deve pedir o cancelamento do auto de infração com base nos argumentos acima.
            """;

        return await ChamarClaudeAsync(systemPrompt, userPrompt, ct);
    }

    private async Task<string> ChamarClaudeAsync(string systemPrompt, string userPrompt, CancellationToken ct)
    {
        var apiKey = _config["Anthropic:ApiKey"];
        var model = _config["Anthropic:Model"] ?? "claude-sonnet-4-6";

        var payload = new
        {
            model,
            max_tokens = 2000,
            system = systemPrompt,
            messages = new[] { new { role = "user", content = userPrompt } }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages");
        request.Headers.Add("x-api-key", apiKey);
        request.Headers.Add("anthropic-version", "2023-06-01");
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        using var response = await _http.SendAsync(request, ct);
        var body = await response.Content.ReadAsStringAsync(ct);
        response.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(body);
        return doc.RootElement
            .GetProperty("content")[0]
            .GetProperty("text")
            .GetString() ?? "";
    }
}

// Record estendido com campos adicionais da análise completa
public record AnaliseCtbCompleta(
    string ExplicacaoSimples,
    string ArtigoCtb,
    GravidadeInfracao Gravidade,
    bool RecursoRecomendado,
    double ChanceRecursoPercent,
    string JustificativaRecurso,
    string OndeRecorrer,
    string OQueFazerAgora,
    string OndeObterDesconto,
    DateTime? PrazoEstimado,
    string ComoEvitarNoFuturo
) : AnaliseCtb(ExplicacaoSimples, ArtigoCtb, Gravidade, RecursoRecomendado, JustificativaRecurso, PrazoEstimado, ComoEvitarNoFuturo);
