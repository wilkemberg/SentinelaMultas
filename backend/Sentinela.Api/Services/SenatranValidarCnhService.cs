using System.Globalization;
using System.Text.Json;

namespace Sentinela.Api.Services;

/// <summary>
/// Dados devolvidos pela validação oficial da CNH na base RENACH (SENATRAN).
/// Note que NÃO há pontuação/histórico de infrações aqui — essa consulta só
/// confirma se o documento (nome, categoria, validade, situação) bate com a
/// base oficial. A pontuação do Sentinela continua vindo das multas reais
/// monitoradas via SERPRO/RADAR.
/// </summary>
public record CnhValidacaoDados(
    string? Nome,
    string? Mae,
    string? Cpf,
    string? Registro,
    string? Categoria,
    DateTime? EmissaoData,
    DateTime? ValidadeData,
    string? Situacao,
    string? CodigoSeguranca,
    bool? NomeCondutorIdenticoAoInformado,
    bool? NomeMaeIdenticoAoInformado
);

public record ResultadoValidacaoCnh(bool Sucesso, string? MensagemErro, CnhValidacaoDados? Dados);

public interface ICnhValidacaoService
{
    Task<ResultadoValidacaoCnh> ValidarAsync(
        string cpf, string registro, string codigoSeguranca, string nomeCondutor, string nomeMae, CancellationToken ct = default);
}

/// <summary>
/// Valida a CNH oficialmente na base RENACH (Registro Nacional de Condutores
/// Habilitados) via SENATRAN, usando a API da Infosimples
/// (https://infosimples.com/consultas/senatran-validar-cnh/).
///
/// Autenticação: optamos deliberadamente por usar SOMENTE o "código de
/// segurança" (impresso no espelho/QR da CNH digital) — a consulta também
/// aceita login/senha do gov.br ou certificado digital (pkcs12), mas isso
/// exigiria guardar ou processar credenciais sensíveis demais para este app.
/// O código de segurança é informado manualmente pelo usuário a cada validação.
///
/// Limite conhecido do site de origem: 5 consultas/dia por login — por isso
/// esta é uma ação manual (botão "Validar CNH"), nunca parte da varredura
/// diária automática.
/// </summary>
public class SenatranValidarCnhService : ICnhValidacaoService
{
    private const string Endpoint = "https://api.infosimples.com/api/v2/consultas/senatran/validar-cnh";

    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<SenatranValidarCnhService> _logger;

    public SenatranValidarCnhService(HttpClient http, IConfiguration config, ILogger<SenatranValidarCnhService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    public async Task<ResultadoValidacaoCnh> ValidarAsync(
        string cpf, string registro, string codigoSeguranca, string nomeCondutor, string nomeMae, CancellationToken ct = default)
    {
        var token = _config["Infosimples:Token"];
        if (string.IsNullOrWhiteSpace(token))
        {
            _logger.LogWarning("Infosimples:Token não configurado. Validação de CNH indisponível.");
            return new ResultadoValidacaoCnh(false, "Consulta indisponível: token da Infosimples não configurado.", null);
        }

        var form = new Dictionary<string, string>
        {
            ["token"] = token,
            ["cpf"] = cpf,
            ["registro"] = registro,
            ["codigo_seguranca"] = codigoSeguranca,
            ["nome_condutor"] = nomeCondutor,
            ["nome_mae"] = nomeMae,
            ["timeout"] = "300",
        };

        try
        {
            using var response = await _http.PostAsync(Endpoint, new FormUrlEncodedContent(form), ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("SENATRAN Validar CNH retornou HTTP {Status}", response.StatusCode);
                return new ResultadoValidacaoCnh(false, $"HTTP {response.StatusCode}", null);
            }

            _logger.LogInformation("SENATRAN Validar CNH RAW: {Json}", body);
            return ParsearResposta(body, _logger);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao validar CNH via SENATRAN");
            return new ResultadoValidacaoCnh(false, ex.Message, null);
        }
    }

    private static ResultadoValidacaoCnh ParsearResposta(string json, ILogger logger)
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

                var mensagem = $"SENATRAN code={code} ({codeMessage})" + (erros.Count > 0 ? ": " + string.Join("; ", erros) : "");
                logger.LogWarning("SENATRAN Validar CNH sem sucesso: {Mensagem}", mensagem);
                return new ResultadoValidacaoCnh(false, mensagem, null);
            }

            if (!root.TryGetProperty("data", out var dataEl))
                return new ResultadoValidacaoCnh(false, "Resposta sem dados", null);

            JsonElement registro;
            if (dataEl.ValueKind == JsonValueKind.Array)
            {
                if (dataEl.GetArrayLength() == 0)
                    return new ResultadoValidacaoCnh(false, "CNH não encontrada na base do SENATRAN — confira os dados informados.", null);
                registro = dataEl[0];
            }
            else if (dataEl.ValueKind == JsonValueKind.Object)
            {
                registro = dataEl;
            }
            else
            {
                return new ResultadoValidacaoCnh(false, "Formato de resposta inesperado", null);
            }

            var dados = new CnhValidacaoDados(
                Nome: NullIfEmpty(GetStr(registro, "nome")),
                Mae: NullIfEmpty(GetStr(registro, "mae")),
                Cpf: NullIfEmpty(GetStr(registro, "cpf")),
                Registro: NullIfEmpty(GetStr(registro, "registro")),
                Categoria: NullIfEmpty(GetStr(registro, "categoria")),
                EmissaoData: GetData(registro, "emissao_data"),
                ValidadeData: GetData(registro, "validade_data"),
                Situacao: NullIfEmpty(GetStr(registro, "situacao")),
                CodigoSeguranca: NullIfEmpty(GetStr(registro, "codigo_seguranca")),
                NomeCondutorIdenticoAoInformado: GetBool(registro, "nome_condutor_identico_ao_informado"),
                NomeMaeIdenticoAoInformado: GetBool(registro, "nome_mae_identico_ao_informado")
            );

            return new ResultadoValidacaoCnh(true, null, dados);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Falha ao interpretar resposta do SENATRAN Validar CNH. JSON bruto: {Json}", json);
            return new ResultadoValidacaoCnh(false, "Resposta em formato inesperado", null);
        }
    }

    private static string? NullIfEmpty(string s) => string.IsNullOrWhiteSpace(s) ? null : s;

    // Mesma estratégia de parsing de data usada no SerproRadarConsultaService:
    // tenta formatos brasileiros explícitos (dd/MM/yyyy) antes de qualquer parse
    // genérico, sempre com cultura invariante explícita. Duplicado aqui de
    // propósito (em vez de compartilhar código com o serviço de multas) para não
    // arriscar mexer num arquivo que já está confirmado funcionando em produção.
    private static readonly string[] FormatosData =
    {
        "dd/MM/yyyy HH:mm:ss",
        "dd/MM/yyyy HH:mm",
        "dd/MM/yyyy",
        "yyyy-MM-dd HH:mm:ss",
        "yyyy-MM-ddTHH:mm:ss",
        "yyyy-MM-dd",
    };

    private static DateTime? GetData(JsonElement el, params string[] keys)
    {
        var texto = GetStr(el, keys);
        if (string.IsNullOrWhiteSpace(texto)) return null;

        texto = texto.Trim();
        if (DateTime.TryParseExact(texto, FormatosData, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
            return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
        if (DateTime.TryParse(texto, CultureInfo.InvariantCulture, DateTimeStyles.None, out dt))
            return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
        return null;
    }

    private static string GetStr(JsonElement el, params string[] keys)
    {
        foreach (var k in keys)
            if (el.TryGetProperty(k, out var v) && v.ValueKind == JsonValueKind.String)
                return v.GetString() ?? "";
        return "";
    }

    private static bool? GetBool(JsonElement el, params string[] keys)
    {
        foreach (var k in keys)
        {
            if (!el.TryGetProperty(k, out var v)) continue;
            if (v.ValueKind == JsonValueKind.True) return true;
            if (v.ValueKind == JsonValueKind.False) return false;
            if (v.ValueKind == JsonValueKind.String && bool.TryParse(v.GetString(), out var b)) return b;
        }
        return null;
    }
}
