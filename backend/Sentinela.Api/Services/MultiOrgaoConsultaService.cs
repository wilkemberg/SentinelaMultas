using System.Text.Json;
using Sentinela.Api.Services;

namespace Sentinela.Api.Services;

/// <summary>
/// Consulta em paralelo DETRAN-RJ, CET-Rio e PRF via Infosimples.
/// Agrega e deduplica os resultados, retornando uma lista unificada de multas.
/// Um único cadastro (placa + RENAVAM) cobre todos os órgãos.
/// </summary>
public class MultiOrgaoConsultaService : IConsultaMultasService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<MultiOrgaoConsultaService> _logger;

    // Endpoints da Infosimples por órgão (confirme no painel da conta)
    private static readonly Dictionary<string, string> EndpointsPorOrgao = new()
    {
        ["DETRAN-RJ"] = "https://api.infosimples.com/api/v2/consultas/detran/rj/multas",
        ["CET-RIO"] = "https://api.infosimples.com/api/v2/consultas/prefeitura/rj/rio-de-janeiro/multas",
        ["PRF"] = "https://api.infosimples.com/api/v2/consultas/dprf/multas",
    };

    public MultiOrgaoConsultaService(HttpClient http, IConfiguration config, ILogger<MultiOrgaoConsultaService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    public async Task<ResultadoConsulta> ConsultarAsync(string placa, string renavam, string uf, CancellationToken ct = default)
    {
        var token = _config["Infosimples:Token"];
        if (string.IsNullOrWhiteSpace(token))
        {
            _logger.LogWarning("Infosimples:Token não configurado. Retornando modo simulação (sem multas).");
            return new ResultadoConsulta(true, null, Array.Empty<MultaEncontrada>());
        }

        // Fan-out paralelo para todos os órgãos
        var tarefas = EndpointsPorOrgao.Select(kvp =>
            ConsultarOrgaoAsync(kvp.Key, kvp.Value, placa, renavam, token, ct)).ToList();

        MultaEncontrada[][] resultados;
        try
        {
            resultados = await Task.WhenAll(tarefas);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha crítica no fan-out multi-órgão para placa {Placa}", placa);
            return new ResultadoConsulta(false, ex.Message, Array.Empty<MultaEncontrada>());
        }

        // Agrega e deduplica por NumeroAutoInfracao
        var todasMultas = resultados
            .SelectMany(r => r)
            .GroupBy(m => m.NumeroAutoInfracao)
            .Select(g => g.First())
            .ToList();

        _logger.LogInformation("Fan-out {Placa}: {Total} multas encontradas ({Orgaos} órgãos consultados)",
            placa, todasMultas.Count, EndpointsPorOrgao.Count);

        return new ResultadoConsulta(true, null, todasMultas);
    }

    private async Task<MultaEncontrada[]> ConsultarOrgaoAsync(
        string nomeOrgao, string url, string placa, string renavam, string token, CancellationToken ct)
    {
        var form = new Dictionary<string, string>
        {
            ["token"] = token,
            ["placa"] = placa,
            ["renavam"] = renavam,
            ["timeout"] = "300"
        };

        try
        {
            using var response = await _http.PostAsync(url, new FormUrlEncodedContent(form), ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("{Orgao} retornou {Status} para {Placa}", nomeOrgao, response.StatusCode, placa);
                return Array.Empty<MultaEncontrada>();
            }

            return ParsearMultasInfosimples(body, nomeOrgao);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao consultar {Orgao} para {Placa}", nomeOrgao, placa);
            return Array.Empty<MultaEncontrada>();
        }
    }

    private static MultaEncontrada[] ParsearMultasInfosimples(string json, string orgaoFallback)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (!root.TryGetProperty("data", out var dataEl)
                || dataEl.ValueKind != JsonValueKind.Array
                || dataEl.GetArrayLength() == 0)
                return Array.Empty<MultaEncontrada>();

            var registro = dataEl[0];
            if (!registro.TryGetProperty("multas", out var multasEl)
                || multasEl.ValueKind != JsonValueKind.Array)
                return Array.Empty<MultaEncontrada>();

            var lista = new List<MultaEncontrada>();
            foreach (var m in multasEl.EnumerateArray())
            {
                // O campo "orgao" pode vir da resposta ou usamos o nome do endpoint
                var orgao = m.TryGetProperty("orgao", out var o) ? o.GetString() ?? orgaoFallback : orgaoFallback;

                lista.Add(new MultaEncontrada(
                    NumeroAutoInfracao: GetStr(m, "auto", "auto", "numero_auto"),
                    OrgaoAutuador: orgao,
                    CodigoInfracaoCtb: GetStr(m, "codigo_infracao", "codigo"),
                    DescricaoInfracao: GetStr(m, "descricao", "desc"),
                    Valor: GetDecimal(m, "valor", "valor_multa"),
                    Pontos: GetInt(m, "pontos"),
                    DataInfracao: GetDate(m, "data", "data_infracao"),
                    Local: GetStr(m, "local", "endereco", "logradouro"),
                    Municipio: GetStr(m, "municipio", "cidade")
                ));
            }

            return lista.ToArray();
        }
        catch
        {
            return Array.Empty<MultaEncontrada>();
        }
    }

    // Helpers de extração tolerantes a chave ausente
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
            if (el.TryGetProperty(k, out var v) && v.TryGetDecimal(out var d))
                return d;
        return 0m;
    }

    private static int GetInt(JsonElement el, params string[] keys)
    {
        foreach (var k in keys)
            if (el.TryGetProperty(k, out var v) && v.TryGetInt32(out var i))
                return i;
        return 0;
    }

    private static DateTime GetDate(JsonElement el, params string[] keys)
    {
        foreach (var k in keys)
            if (el.TryGetProperty(k, out var v) && DateTime.TryParse(v.GetString(), out var dt))
                return dt;
        return DateTime.UtcNow;
    }
}
