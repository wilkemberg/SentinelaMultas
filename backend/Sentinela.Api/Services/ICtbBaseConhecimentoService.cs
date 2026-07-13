namespace Sentinela.Api.Services;

/// <summary>
/// Busca trechos relevantes do CTB, Resoluções CONTRAN e súmulas de
/// JARI/CETRAN para fundamentar a análise da IA. Implementação real deve
/// usar pgvector (embeddings) sobre uma tabela `ctb_chunks`.
/// </summary>
public interface ICtbBaseConhecimentoService
{
    Task<IReadOnlyList<string>> BuscarTrechosRelevantesAsync(string consulta, int topK = 5, CancellationToken ct = default);
}

/// <summary>
/// Implementação inicial "burra": guarda um punhado de artigos-chave do CTB
/// hardcoded para destravar o desenvolvimento antes de montar o pipeline de
/// ingestão + embeddings. Trocar por PgVectorCtbBaseConhecimentoService assim
/// que a base estiver populada (ver docs/ingestao-ctb.md).
/// </summary>
public class StubCtbBaseConhecimentoService : ICtbBaseConhecimentoService
{
    private static readonly string[] TrechosSemente =
    {
        "Art. 218, CTB - Transitar em velocidade superior à máxima permitida para o local: I - quando a velocidade for excedida em até 20%: infração média; II - quando excedida acima de 20% até 50%: infração grave; III - quando excedida acima de 50%: infração gravíssima.",
        "Art. 280, CTB - Ocorrendo infração cuja penalidade seja de multa, o agente da autoridade de trânsito, no exercício de suas funções, lavrará auto de infração, com a identificação do infrator, no local, no dia e horário verificados, e o notificará no prazo máximo de 30 dias.",
        "Art. 281, CTB - A autoridade de trânsito, na esfera da competência estabelecida, julgará a consistência do auto de infração e, se for o caso, aplicará a penalidade, notificando o infrator para apresentação de defesa da autuação.",
        "Art. 282, CTB - A penalidade de multa será imposta mediante a notificação da autuação... prazo para interposição de recurso de trinta dias, contados da notificação da penalidade.",
        "Resolução CONTRAN 619/2016 - Estabelece os procedimentos para aplicação de multas por excesso de velocidade e as condições de aferição/aferição de equipamentos (radares), inclusive quanto à necessidade de aferição metrológica válida do INMETRO."
    };

    public Task<IReadOnlyList<string>> BuscarTrechosRelevantesAsync(string consulta, int topK = 5, CancellationToken ct = default)
    {
        // MVP: retorna a base semente inteira (poucos artigos). Quando a base
        // de embeddings estiver pronta, isso vira uma busca vetorial real.
        return Task.FromResult((IReadOnlyList<string>)TrechosSemente.Take(topK).ToList());
    }
}
