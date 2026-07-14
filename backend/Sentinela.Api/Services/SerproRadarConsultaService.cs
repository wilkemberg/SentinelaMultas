using System.Globalization;
using System.Text.Json;

namespace Sentinela.Api.Services;

/// <summary>
/// Consulta o SERPRO/RADAR/Veículo via Infosimples (https://infosimples.com/consultas/serpro-radar-veiculo/).
/// Essa consulta lê o RENAINF (Registro Nacional de Infrações de Trânsito) — o
/// cadastro nacional unificado onde DETRANs, prefeituras (ex.: CET-Rio) e a PRF
/// registram infrações para validade em todo o território nacional (pontuação
/// de CNH, por exemplo). Por isso, um único cadastro de placa + RENAVAM tende a
/// cobrir todos os órgãos autuadores, ao contrário do MultiOrgaoConsultaService
/// anterior, que precisava consultar cada órgão separadamente.
///
/// IMPORTANTE: os nomes de campo abaixo (ait, autuacao, descricao, data, hora,
/// situacao, autuacao_pdf_url, boleto_pdf_url) refletem a documentação pública
/// da Infosimples para este produto. Essa documentação não lista campos de
/// valor/pontos/enquadramento CTB, e testes reais confirmaram que eles não vêm
/// preenchidos — por isso, quando ausentes, são complementados via
/// <see cref="CtbTabelaReferencia"/> (valores fixados por lei, identificados
/// pelo texto da descrição). Ajuste as chaves em GetDecimal/GetInt/GetStr se uma
/// consulta real mostrar nomes de campo diferentes dos documentados.
/// </summary>
public class SerproRadarConsultaService : IConsultaMultasService
{
    private const string Endpoint = "https://api.infosimples.com/api/v2/consultas/serpro/radar/veiculo";

    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<SerproRadarConsultaService> _logger;

    public SerproRadarConsultaService(HttpClient http, IConfiguration config, ILogger<SerproRadarConsultaService> logger)
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

        var form = new Dictionary<string, string>
        {
            ["token"] = token,
            ["placa"] = placa,
            ["renavam"] = renavam,
            ["timeout"] = "300",
        };

        try
        {
            using var response = await _http.PostAsync(Endpoint, new FormUrlEncodedContent(form), ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("SERPRO Radar retornou HTTP {Status} para {Placa}", response.StatusCode, placa);
                return new ResultadoConsulta(false, $"HTTP {response.StatusCode}", Array.Empty<MultaEncontrada>());
            }

            return ParsearResposta(body, placa, _logger);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao consultar SERPRO Radar para {Placa}", placa);
            return new ResultadoConsulta(false, ex.Message, Array.Empty<MultaEncontrada>());
        }
    }

    private static ResultadoConsulta ParsearResposta(string json, string placa, ILogger logger)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var code = root.TryGetProperty("code", out var codeEl) && codeEl.TryGetInt32(out var c) ? c : 0;

            if (code != 200)
            {
                var codeMessage = root.TryGetProperty("code_message", out var cm) ? cm.GetString() : "erro desconhecido";
                var erros = new List<string>();
                if (root.TryGetProperty("errors", out var errorsEl) && errorsEl.ValueKind == JsonValueKind.Array)
                    foreach (var e in errorsEl.EnumerateArray())
                        if (e.GetString() is { } s) erros.Add(s);

                // A Infosimples usa um código de "erro" (ex.: 612) até para o caso
                // mais comum de todos: placa sem nenhuma infração no RENAINF. Isso
                // NÃO é uma falha de consulta — é um resultado válido (zero multas).
                // Sem esse tratamento, uma placa "limpa" no RADAR derrubava a
                // verificação inteira com 502 antes mesmo de tentar o DETRAN-RJ (a
                // segunda fonte), que é justamente o cenário real que motivou essa
                // segunda fonte existir (multa já visível no DETRAN-RJ mas ainda
                // não sincronizada com o RENAINF nacional).
                var semResultados = erros.Any(e => e.Contains("Não existem infrações", StringComparison.OrdinalIgnoreCase))
                    || (codeMessage?.Contains("não retornou dados", StringComparison.OrdinalIgnoreCase) ?? false);

                if (semResultados)
                {
                    logger.LogInformation("SERPRO Radar {Placa}: nenhuma infração no RENAINF (code={Code})", placa, code);
                    return new ResultadoConsulta(true, null, Array.Empty<MultaEncontrada>());
                }

                var mensagem = $"Infosimples code={code} ({codeMessage})" + (erros.Count > 0 ? ": " + string.Join("; ", erros) : "");
                logger.LogWarning("SERPRO Radar sem sucesso para {Placa}: {Mensagem}", placa, mensagem);
                return new ResultadoConsulta(false, mensagem, Array.Empty<MultaEncontrada>());
            }

            if (!root.TryGetProperty("data", out var dataEl))
                return new ResultadoConsulta(true, null, Array.Empty<MultaEncontrada>());

            // A Infosimples costuma retornar "data" como array com um registro
            // (o veículo consultado), mas alguns produtos retornam objeto único.
            // Tratamos os dois formatos defensivamente.
            JsonElement registro;
            if (dataEl.ValueKind == JsonValueKind.Array)
            {
                if (dataEl.GetArrayLength() == 0)
                    return new ResultadoConsulta(true, null, Array.Empty<MultaEncontrada>());
                registro = dataEl[0];
            }
            else if (dataEl.ValueKind == JsonValueKind.Object)
            {
                registro = dataEl;
            }
            else
            {
                return new ResultadoConsulta(true, null, Array.Empty<MultaEncontrada>());
            }

            if (!registro.TryGetProperty("infracoes", out var infracoesEl) || infracoesEl.ValueKind != JsonValueKind.Array)
                return new ResultadoConsulta(true, null, Array.Empty<MultaEncontrada>());

            var lista = new List<MultaEncontrada>();
            foreach (var inf in infracoesEl.EnumerateArray())
            {
                var numeroAuto = GetStr(inf, "ait", "auto", "numero_auto");
                if (string.IsNullOrWhiteSpace(numeroAuto))
                    continue; // sem identificador único, não dá para deduplicar depois — ignora

                var descricao = GetStr(inf, "descricao", "autuacao");
                var codigoCtb = GetStr(inf, "codigo_infracao", "codigo", "enquadramento");
                var valor = GetDecimal(inf, "valor", "valor_multa", "valor_ait");
                var pontos = GetInt(inf, "pontos", "pontuacao");
                var dataHoraExtraida = GetDataHora(inf);

                // DIAGNÓSTICO TEMPORÁRIO: loga o JSON bruto de cada infração e o que
                // foi extraído dela. Fica em nível Information (aparece em `docker
                // compose logs backend`) para conseguirmos confirmar os nomes reais
                // de campo da Infosimples sem precisar adivinhar — remover depois
                // que o formato estiver 100% confirmado com dados reais.
                logger.LogInformation(
                    "SERPRO Radar RAW infração {Ait}: {Json}",
                    numeroAuto, inf.GetRawText());
                logger.LogInformation(
                    "SERPRO Radar extraído {Ait}: descricao='{Descricao}' codigoCtb='{Codigo}' valor={Valor} pontos={Pontos} data={Data}",
                    numeroAuto, descricao, codigoCtb, valor, pontos, dataHoraExtraida);

                // A Infosimples não devolve valor/pontos/enquadramento para este
                // produto (confirmado com consultas reais) — usamos a tabela de
                // referência do CTB (valores fixados por lei) como fallback,
                // identificando a infração pelo texto da descrição. Se um dia a
                // API passar a devolver esses campos, eles continuam prioritários.
                if (valor <= 0 || pontos <= 0 || string.IsNullOrWhiteSpace(codigoCtb))
                {
                    var infoTabela = CtbTabelaReferencia.Buscar(descricao);
                    logger.LogInformation(
                        "SERPRO Radar tabela CTB {Ait}: {Resultado}",
                        numeroAuto, infoTabela is null ? "SEM MATCH" : $"{infoTabela.Artigo} / {infoTabela.Gravidade} / {infoTabela.Pontos}pts / R${infoTabela.Valor}");
                    if (infoTabela is not null)
                    {
                        if (valor <= 0) valor = infoTabela.Valor;
                        if (pontos <= 0) pontos = infoTabela.Pontos;
                        if (string.IsNullOrWhiteSpace(codigoCtb)) codigoCtb = infoTabela.Artigo;
                    }
                }

                lista.Add(new MultaEncontrada(
                    NumeroAutoInfracao: numeroAuto,
                    OrgaoAutuador: GetStr(inf, "orgao", "orgao_autuador") is { Length: > 0 } orgao ? orgao : "RENAINF",
                    CodigoInfracaoCtb: codigoCtb,
                    DescricaoInfracao: descricao,
                    Valor: valor,
                    Pontos: pontos,
                    DataInfracao: dataHoraExtraida,
                    Local: GetStr(inf, "local", "logradouro"),
                    Municipio: GetStr(inf, "municipio", "cidade"),
                    AutuacaoPdfUrl: NullIfEmpty(GetStr(inf, "autuacao_pdf_url")),
                    BoletoPdfUrl: NullIfEmpty(GetStr(inf, "boleto_pdf_url")),
                    Fonte: "SERPRO/RADAR"
                ));
            }

            // Deduplica por NumeroAutoInfracao — o RENAINF costuma listar a mesma
            // infração mais de uma vez (ex.: notificação de autuação e de
            // penalidade separadamente), e o banco tem restrição de unicidade
            // (VeiculoId, NumeroAutoInfracao) que rejeitaria a segunda cópia.
            var deduplicada = lista
                .GroupBy(m => m.NumeroAutoInfracao)
                .Select(g => g.First())
                .ToList();

            logger.LogInformation(
                "SERPRO Radar {Placa}: {Total} infrações encontradas ({Bruto} antes de deduplicar)",
                placa, deduplicada.Count, lista.Count);
            return new ResultadoConsulta(true, null, deduplicada);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Falha ao interpretar resposta do SERPRO Radar para {Placa}. JSON bruto: {Json}", placa, json);
            return new ResultadoConsulta(false, "Resposta em formato inesperado", Array.Empty<MultaEncontrada>());
        }
    }

    private static string? NullIfEmpty(string s) => string.IsNullOrWhiteSpace(s) ? null : s;

    // Formatos possíveis retornados pelo site da Serpro/RADAR — testados nesta ordem.
    // O bug original: DateTime.TryParse(texto) sem cultura explícita usa a cultura
    // invariante (en-US, MM/dd/yyyy) rodando no container Linux. Uma data brasileira
    // como "12/07/2026" ainda "parseia" (mês 12, dia 07 — silenciosamente errada), mas
    // uma como "25/06/2026" falha (mês 25 não existe) e cai no fallback UtcNow — foi
    // por isso que TODAS as infrações apareciam com a data de hoje.
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
        // Tenta "data_hora" combinado primeiro; senão combina "data" + "hora" separados.
        var dataHora = GetStr(el, "data_hora");
        if (!string.IsNullOrWhiteSpace(dataHora) && TentarParsearData(dataHora, out var dtCombinado))
            return ComoUtc(dtCombinado);

        var data = GetStr(el, "data", "data_infracao");
        var hora = GetStr(el, "hora");
        if (!string.IsNullOrWhiteSpace(data))
        {
            var texto = string.IsNullOrWhiteSpace(hora) ? data : $"{data} {hora}";
            if (TentarParsearData(texto, out var dt))
                return ComoUtc(dt);
        }

        return DateTime.UtcNow;
    }

    // Tenta os formatos brasileiros conhecidos primeiro (dd/MM/yyyy) com cultura
    // explícita — nunca depende da cultura atual da thread/container — e só então
    // cai para um parse genérico (ISO 8601, etc.) como última tentativa.
    private static bool TentarParsearData(string texto, out DateTime resultado)
    {
        texto = texto.Trim();
        if (DateTime.TryParseExact(texto, FormatosData, CultureInfo.InvariantCulture, DateTimeStyles.None, out resultado))
            return true;
        return DateTime.TryParse(texto, CultureInfo.InvariantCulture, DateTimeStyles.None, out resultado);
    }

    // DateTime.TryParse devolve Kind=Unspecified quando a string não traz fuso
    // horário explícito (o caso do SERPRO Radar). O Npgsql 6+ rejeita gravar
    // DateTime Unspecified em coluna "timestamp with time zone" — só aceita UTC.
    // Como não há fuso na resposta, tratamos o valor como já sendo a data/hora
    // "de fato" e apenas marcamos o Kind como Utc (sem converter o relógio).
    private static DateTime ComoUtc(DateTime dt) =>
        dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);

    // Helpers de extração tolerantes a chave ausente (mesmo padrão do MultiOrgaoConsultaService)
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

    private static int GetInt(JsonElement el, params string[] keys)
    {
        foreach (var k in keys)
        {
            if (!el.TryGetProperty(k, out var v)) continue;
            if (v.ValueKind == JsonValueKind.Number && v.TryGetInt32(out var i)) return i;
            if (v.ValueKind == JsonValueKind.String && int.TryParse(v.GetString(), out var iv)) return iv;
        }
        return 0;
    }
}
