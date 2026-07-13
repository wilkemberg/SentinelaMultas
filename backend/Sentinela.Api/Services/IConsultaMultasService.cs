using Sentinela.Api.Models;

namespace Sentinela.Api.Services;

/// <summary>
/// Resultado bruto de uma consulta a um veículo, antes de virar registros de Multa.
/// </summary>
public record MultaEncontrada(
    string NumeroAutoInfracao,
    string OrgaoAutuador,
    string CodigoInfracaoCtb,
    string DescricaoInfracao,
    decimal Valor,
    int Pontos,
    DateTime DataInfracao,
    string? Local = null,
    string? Municipio = null,
    // Links para os documentos originais (quando o provedor de consulta os retorna).
    // Preenchidos hoje pelo SerproRadarConsultaService (SERPRO/RADAR/Veículo).
    string? AutuacaoPdfUrl = null,
    string? BoletoPdfUrl = null
);

public record ResultadoConsulta(
    bool Sucesso,
    string? MensagemErro,
    IReadOnlyList<MultaEncontrada> Multas
);

/// <summary>
/// Abstrai o provedor de consulta de multas.
/// Implementação atual: SerproRadarConsultaService (Infosimples → SERPRO/RADAR/Veículo),
/// que consulta o RENAINF (registro nacional de infrações) com um único
/// cadastro de placa + RENAVAM, cobrindo DETRAN, prefeituras e PRF.
/// Implementação anterior (MultiOrgaoConsultaService, 3 endpoints separados)
/// permanece disponível caso seja necessário combinar fontes no futuro.
/// </summary>
public interface IConsultaMultasService
{
    Task<ResultadoConsulta> ConsultarAsync(string placa, string renavam, string uf, CancellationToken ct = default);
}
