using System.Text.Json;

namespace Sentinela.Api.Services;

/// <summary>
/// Implementação usando a API da Infosimples (https://infosimples.com), que já
/// automatiza a consulta nos portais dos DETRANs (evita você ter que fazer
/// scraping/CAPTCHA próprio no MVP). Requer token de conta Infosimples em
/// appsettings/variável de ambiente: Infosimples:Token.
///
/// IMPORTANTE: os endpoints variam por UF/órgão. Ajuste a rota conforme o
/// contrato/documentação vigente da Infosimples para "DETRAN / RJ / Multas"
/// no momento da integração — o formato abaixo é o esqueleto de chamada,
/// não uma cópia literal do endpoint deles.
/// </summary>
public class InfosimplesConsultaMultasService : IConsultaMultasService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<InfosimplesConsultaMultasService> _logger;

    public InfosimplesConsultaMultasService(
        HttpClient http,
        IConfiguration config,
        ILogger<InfosimplesConsultaMultasService> logger)
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
            _logger.LogWarning("Infosimples:Token não configurado. Retornando resultado vazio (modo dev).");
            return new ResultadoConsulta(true, null, Array.Empty<MultaEncontrada>());
        }

        // TODO: ajustar a URL exata para a consulta "DETRAN / {UF} / Multas" no
        // momento de integrar de verdade — confirme no painel da Infosimples.
        var url = $"https://api.infosimples.com/api/v2/consultas/detran/{uf.ToLower()}/multas";

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
                _logger.LogError("Infosimples retornou {Status}: {Body}", response.StatusCode, body);
                return new ResultadoConsulta(false, $"Falha na consulta ({response.StatusCode})", Array.Empty<MultaEncontrada>());
            }

            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            // Estrutura típica da Infosimples: { "code": 200, "data": [ { ...multas... } ] }
            if (!root.TryGetProperty("data", out var dataEl) || dataEl.ValueKind != JsonValueKind.Array || dataEl.GetArrayLength() == 0)
            {
                return new ResultadoConsulta(true, null, Array.Empty<MultaEncontrada>());
            }

            var multas = new List<MultaEncontrada>();
            var registro = dataEl[0];

            if (registro.TryGetProperty("multas", out var multasEl) && multasEl.ValueKind == JsonValueKind.Array)
            {
                foreach (var m in multasEl.EnumerateArray())
                {
                    multas.Add(new MultaEncontrada(
                        NumeroAutoInfracao: m.TryGetProperty("auto", out var auto) ? auto.GetString() ?? "" : "",
                        OrgaoAutuador: m.TryGetProperty("orgao", out var orgao) ? orgao.GetString() ?? uf : uf,
                        CodigoInfracaoCtb: m.TryGetProperty("codigo_infracao", out var cod) ? cod.GetString() ?? "" : "",
                        DescricaoInfracao: m.TryGetProperty("descricao", out var desc) ? desc.GetString() ?? "" : "",
                        Valor: m.TryGetProperty("valor", out var val) && val.TryGetDecimal(out var valDec) ? valDec : 0m,
                        Pontos: m.TryGetProperty("pontos", out var pts) && pts.TryGetInt32(out var ptsInt) ? ptsInt : 0,
                        DataInfracao: m.TryGetProperty("data", out var dt) && DateTime.TryParse(dt.GetString(), out var dtParsed) ? dtParsed : DateTime.UtcNow
                    ));
                }
            }

            return new ResultadoConsulta(true, null, multas);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro consultando Infosimples para placa {Placa}", placa);
            return new ResultadoConsulta(false, ex.Message, Array.Empty<MultaEncontrada>());
        }
    }
}
