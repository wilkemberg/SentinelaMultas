using System.Globalization;
using System.Text.Json;

namespace Sentinela.Api.Services;

/// <summary>
/// Consulta o DETRAN/RJ/Nada Consta via Infosimples
/// (https://infosimples.com/consultas/detran-rj-nada-consta/) — segunda fonte de
/// multas, usada em conjunto com o SERPRO/RADAR (<see cref="SerproRadarConsultaService"/>).
///
/// Por que ter as duas: o RADAR lê o RENAINF (base nacional), mas um órgão
/// autuador só empurra o registro pra lá depois de concluir seu próprio trâmite
/// interno (defesa prévia julgada, etc. — até 60 dias pela Res. CONTRAN 918/2022).
/// Enquanto isso, a multa já pode aparecer no cadastro do DETRAN do estado onde o
/// veículo é emplacado, que conduz o processo administrativo do veículo
/// independentemente de onde a infração ocorreu. Consultar as duas fontes fecha
/// esse intervalo — e como bônus, esta consulta devolve valor e enquadramento CTB
/// já preenchidos (o SERPRO/RADAR não devolve esses campos).
///
/// Diferença de parâmetros: esta consulta usa CPF do proprietário + RENAVAM
/// (não usa placa/UF, ao contrário do SERPRO/RADAR).
/// </summary>
public interface IConsultaMultasDetranRjService
{
    Task<ResultadoConsulta> ConsultarAsync(string cpf, string renavam, CancellationToken ct = default);
}

public class DetranRjNadaConstaService : IConsultaMultasDetranRjService
{
    private const string Endpoint = "https://api.infosimples.com/api/v2/consultas/detran/rj/nada-consta";

    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<DetranRjNadaConstaService> _logger;

    public DetranRjNadaConstaService(HttpClient http, IConfiguration config, ILogger<DetranRjNadaConstaService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    public async Task<ResultadoConsulta> ConsultarAsync(string cpf, string renavam, CancellationToken ct = default)
    {
        var token = _config["Infosimples:Token"];
        if (string.IsNullOrWhiteSpace(token))
        {
            _logger.LogWarning("Infosimples:Token não configurado. DETRAN-RJ Nada Consta indisponível (modo simulação).");
            return new ResultadoConsulta(true, null, Array.Empty<MultaEncontrada>());
        }

        if (string.IsNullOrWhiteSpace(cpf))
        {
            // CPF é obrigatório nesta consulta (diferente do SERPRO/RADAR, que usa
            // placa). Sem ele, simplesmente pulamos essa fonte — o SERPRO/RADAR
            // continua funcionando normalmente como fonte principal.
            _logger.LogInformation("DETRAN-RJ Nada Consta pulado para RENAVAM {Renavam}: usuário sem CPF cadastrado.", renavam);
            return new ResultadoConsulta(true, null, Array.Empty<MultaEncontrada>());
        }

        var form = new Dictionary<string, string>
        {
            ["token"] = token,
            ["cpf"] = cpf,
            ["renavam"] = renavam,
            ["timeout"] = "300",
        };

        try
        {
            using var response = await _http.PostAsync(Endpoint, new FormUrlEncodedContent(form), ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("DETRAN-RJ Nada Consta retornou HTTP {Status} para RENAVAM {Renavam}", response.StatusCode, renavam);
                return new ResultadoConsulta(false, $"HTTP {response.StatusCode}", Array.Empty<MultaEncontrada>());
            }

            return ParsearResposta(body, renavam, _logger);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao consultar DETRAN-RJ Nada Consta para RENAVAM {Renavam}", renavam);
            return new ResultadoConsulta(false, ex.Message, Array.Empty<MultaEncontrada>());
        }
    }

    private static ResultadoConsulta ParsearResposta(string json, string renavam, ILogger logger)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            // DIAGNÓSTICO TEMPORÁRIO: loga a resposta bruta da Infosimples (igual
            // ao SerproRadarConsultaService) para conseguirmos confirmar, com dados
            // reais, se um retorno "vazio" é de fato zero multas ou uma falha
            // silenciosa (ex.: CPF que não corresponde ao proprietário cadastrado
            // para esse RENAVAM no DETRAN-RJ — essa consulta reprova o cruzamento
            // CPF+RENAVAM mesmo que o RENAVAM tenha multas reais). Remover depois
            // que o comportamento estiver 100% confirmado com casos reais.
            logger.LogInformation("DETRAN-RJ Nada Consta RAW para RENAVAM {Renavam}: {Json}", renavam, json);

            var code = root.TryGetProperty("code", out var codeEl) && codeEl.TryGetInt32(out var c) ? c : 0;
            if (code != 200)
            {
                var codeMessage = root.TryGetProperty("code_message", out var cm) ? cm.GetString() : "erro desconhecido";
                var erros = new List<string>();
                if (root.TryGetProperty("errors", out var errorsEl) && errorsEl.ValueKind == JsonValueKind.Array)
                    foreach (var e in errorsEl.EnumerateArray())
                        if (e.GetString() is { } s) erros.Add(s);

                // Mesmo tratamento do SerproRadarConsultaService: a Infosimples usa
                // códigos de "erro" (ex.: 612) até para o resultado mais comum de
                // todos — RENAVAM sem nenhuma infração. Isso não é falha de
                // consulta, é zero multas.
                var semResultados = erros.Any(e => e.Contains("Não existem infrações", StringComparison.OrdinalIgnoreCase))
                    || (codeMessage?.Contains("não retornou dados", StringComparison.OrdinalIgnoreCase) ?? false);

                if (semResultados)
                {
                    logger.LogInformation("DETRAN-RJ Nada Consta RENAVAM {Renavam}: nenhuma infração encontrada (code={Code})", renavam, code);
                    return new ResultadoConsulta(true, null, Array.Empty<MultaEncontrada>());
                }

                var mensagem = $"DETRAN-RJ code={code} ({codeMessage})" + (erros.Count > 0 ? ": " + string.Join("; ", erros) : "");
                logger.LogWarning("DETRAN-RJ Nada Consta sem sucesso para RENAVAM {Renavam}: {Mensagem}", renavam, mensagem);
                return new ResultadoConsulta(false, mensagem, Array.Empty<MultaEncontrada>());
            }

            if (!root.TryGetProperty("data", out var dataEl) || dataEl.ValueKind != JsonValueKind.Array || dataEl.GetArrayLength() == 0)
                return new ResultadoConsulta(true, null, Array.Empty<MultaEncontrada>());

            var registro = dataEl[0];
            if (!registro.TryGetProperty("multas", out var multasEl) || multasEl.ValueKind != JsonValueKind.Array)
                return new ResultadoConsulta(true, null, Array.Empty<MultaEncontrada>());

            var lista = new List<MultaEncontrada>();
            foreach (var m in multasEl.EnumerateArray())
            {
                var numeroAuto = GetStr(m, "auto_de_infracao");
                if (string.IsNullOrWhiteSpace(numeroAuto))
                    continue; // sem identificador único, não dá pra deduplicar/mesclar depois

                var descricao = GetStr(m, "descricao");
                var codigoCtb = GetStr(m, "enquadramento_da_infracao");
                var valor = GetDecimal(m, "valor_a_ser_pago", "valor_original");
                var pontos = 0; // este produto não devolve pontuação — preenchido via CtbTabelaReferencia abaixo
                var dataInfracao = GetDataHora(m);
                var orgao = GetStr(m, "orgao_emissor", "agente_emissor") is { Length: > 0 } o ? o : "DETRAN-RJ";

                if (valor <= 0 || pontos <= 0 || string.IsNullOrWhiteSpace(codigoCtb))
                {
                    var infoTabela = CtbTabelaReferencia.Buscar(descricao);
                    if (infoTabela is not null)
                    {
                        if (valor <= 0) valor = infoTabela.Valor;
                        if (pontos <= 0) pontos = infoTabela.Pontos;
                        if (string.IsNullOrWhiteSpace(codigoCtb)) codigoCtb = infoTabela.Artigo;
                    }
                }

                lista.Add(new MultaEncontrada(
                    NumeroAutoInfracao: numeroAuto,
                    OrgaoAutuador: orgao,
                    CodigoInfracaoCtb: codigoCtb,
                    DescricaoInfracao: descricao,
                    Valor: valor,
                    Pontos: pontos,
                    DataInfracao: dataInfracao,
                    Local: NullIfEmpty(GetStr(m, "local_da_infracao")),
                    Fonte: "DETRAN-RJ"
                ));
            }

            var deduplicada = lista
                .GroupBy(m => m.NumeroAutoInfracao)
                .Select(g => g.First())
                .ToList();

            logger.LogInformation(
                "DETRAN-RJ Nada Consta RENAVAM {Renavam}: {Total} infrações encontradas ({Bruto} antes de deduplicar)",
                renavam, deduplicada.Count, lista.Count);
            return new ResultadoConsulta(true, null, deduplicada);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Falha ao interpretar resposta do DETRAN-RJ Nada Consta para RENAVAM {Renavam}. JSON bruto: {Json}", renavam, json);
            return new ResultadoConsulta(false, "Resposta em formato inesperado", Array.Empty<MultaEncontrada>());
        }
    }

    private static string? NullIfEmpty(string s) => string.IsNullOrWhiteSpace(s) ? null : s;

    // Mesma estratégia de parsing de data do SerproRadarConsultaService — duplicada
    // de propósito (em vez de compartilhar código) para não arriscar mexer num
    // arquivo já confirmado funcionando em produção.
    private static readonly string[] FormatosData =
    {
        "dd/MM/yyyy HH:mm:ss",
        "dd/MM/yyyy HH:mm",
        "dd/MM/yyyy",
        "yyyy-MM-dd HH:mm:ss",
        "yyyy-MM-ddTHH:mm:ss",
        "yyyy-MM-dd",
    };

    private static DateTime GetDataHora(JsonElement el)
    {
        var data = GetStr(el, "normalizado_data_infracao", "data_infracao");
        var hora = GetStr(el, "hora");
        if (!string.IsNullOrWhiteSpace(data))
        {
            var texto = string.IsNullOrWhiteSpace(hora) ? data : $"{data} {hora}";
            if (TentarParsearData(texto, out var dt))
                return ComoUtc(dt);
        }
        return DateTime.UtcNow;
    }

    private static bool TentarParsearData(string texto, out DateTime resultado)
    {
        texto = texto.Trim();
        if (DateTime.TryParseExact(texto, FormatosData, CultureInfo.InvariantCulture, DateTimeStyles.None, out resultado))
            return true;
        return DateTime.TryParse(texto, CultureInfo.InvariantCulture, DateTimeStyles.None, out resultado);
    }

    private static DateTime ComoUtc(DateTime dt) =>
        dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);

    private static string GetStr(JsonElement el, params string[] keys)
    {
        foreach (var k in keys)
            if (el.TryGetProperty(k, out var v) && v.ValueKind == JsonValueKind.String)
                return v.GetString() ?? "";
        return "";
    }

    private static decimal GetDecimal(JsonElement el, params string[] keys)
    {
        foreach (var k in keys)
        {
            if (!el.TryGetProperty(k, out var v)) continue;
            if (v.ValueKind == JsonValueKind.Number && v.TryGetDecimal(out var d)) return d;
            if (v.ValueKind == JsonValueKind.String && decimal.TryParse(v.GetString(), out var ds)) return ds;
        }
        return 0m;
    }
}
