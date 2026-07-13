using Sentinela.Api.Models;

namespace Sentinela.Api.Services;

public record AnaliseCtb(
    string ExplicacaoSimples,     // por que essa multa aconteceu, em linguagem clara
    string ArtigoCtb,
    GravidadeInfracao Gravidade,
    bool RecursoRecomendado,
    string JustificativaRecurso,
    DateTime? PrazoEstimado,
    string ComoEvitarNoFuturo
);

/// <summary>
/// Analisa uma multa recém detectada contra a base de conhecimento do CTB
/// (RAG) e decide se vale a pena recorrer, com qual fundamentação.
/// </summary>
public interface ICtbAnaliseService
{
    Task<AnaliseCtb> AnalisarAsync(MultaEncontrada multa, CancellationToken ct = default);
    Task<string> GerarTextoDefesaAsync(Multa multa, AnaliseCtb analise, CancellationToken ct = default);
}
