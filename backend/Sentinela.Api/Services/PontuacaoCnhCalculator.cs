using Sentinela.Api.Models;

namespace Sentinela.Api.Services;

/// <summary>
/// Item de multa que compõe a pontuação atual, com a data em que o ponto
/// "expira" (sai da janela móvel de 12 meses contados da infração).
/// </summary>
public record MultaPontuacaoItem(
    Guid MultaId,
    string DescricaoInfracao,
    string ArtigoCtb,
    GravidadeInfracao Gravidade,
    int Pontos,
    DateTime DataInfracao,
    DateTime DataExpiracao);

/// <summary>
/// Resultado do cálculo de risco de suspensão da CNH por pontuação, conforme
/// Lei 14.071/2020 (art. 261 e 261-A do CTB).
/// </summary>
public record PontuacaoCnhResultado(
    bool AtividadeRemunerada,
    int PontosAtuais,
    int LimiteAplicavel,
    int InfracoesGravissimasNoPeriodo,
    int PontosRestantesParaSuspensao,
    double PercentualDoLimite,
    string NivelStatus, // "Regular" | "Atencao" | "Risco"
    bool ElegivelReciclagemPreventiva,
    List<MultaPontuacaoItem> MultasConsideradas);

/// <summary>
/// Cálculo puro (sem I/O) da pontuação de CNH. Regra real da Lei 14.071/2020:
///
/// Condutor SEM atividade remunerada — suspensão ao atingir, em 12 meses:
///   • 20 pontos, se houver 2+ infrações gravíssimas no período
///   • 30 pontos, se houver exatamente 1 infração gravíssima no período
///   • 40 pontos, se não houver nenhuma infração gravíssima no período
///
/// Condutor COM atividade remunerada — suspensão fixa em 40 pontos,
/// independentemente da gravidade, com curso de reciclagem preventivo
/// facultativo ao atingir 30 pontos.
///
/// Importante: este cálculo considera apenas as multas monitoradas pelo
/// Sentinela (veículos cadastrados pelo usuário). Não substitui o extrato
/// oficial de pontos do condutor (que é vinculado ao CPF/CNH e pode incluir
/// infrações em outros veículos/estados não cadastrados aqui).
/// </summary>
public static class PontuacaoCnhCalculator
{
    private const int JanelaMeses = 12;

    public static PontuacaoCnhResultado Calcular(IEnumerable<Multa> todasAsMultas, bool atividadeRemunerada)
    {
        var agora = DateTime.UtcNow;
        var inicioJanela = agora.AddMonths(-JanelaMeses);

        var multasNaJanela = todasAsMultas
            .Where(m => m.Pontos > 0 && m.DataInfracao >= inicioJanela)
            .OrderByDescending(m => m.DataInfracao)
            .ToList();

        var pontosAtuais = multasNaJanela.Sum(m => m.Pontos);
        var qtdGravissimas = multasNaJanela.Count(m => m.Gravidade == GravidadeInfracao.Gravissima);

        int limite;
        bool elegivelReciclagem;

        if (atividadeRemunerada)
        {
            limite = 40;
            elegivelReciclagem = pontosAtuais >= 30;
        }
        else
        {
            limite = qtdGravissimas switch
            {
                >= 2 => 20,
                1 => 30,
                _ => 40
            };
            elegivelReciclagem = false; // reciclagem preventiva facultativa é regra específica do condutor remunerado
        }

        var restantes = Math.Max(limite - pontosAtuais, 0);
        var percentual = limite == 0 ? 0 : Math.Min(100.0, Math.Round(pontosAtuais * 100.0 / limite, 1));

        var nivel = pontosAtuais >= limite
            ? "Risco"
            : percentual >= 75
                ? "Atencao"
                : "Regular";

        var itens = multasNaJanela
            .Select(m => new MultaPontuacaoItem(
                m.Id,
                m.DescricaoInfracao,
                m.ArtigoCtb,
                m.Gravidade,
                m.Pontos,
                m.DataInfracao,
                m.DataInfracao.AddMonths(JanelaMeses)))
            .ToList();

        return new PontuacaoCnhResultado(
            AtividadeRemunerada: atividadeRemunerada,
            PontosAtuais: pontosAtuais,
            LimiteAplicavel: limite,
            InfracoesGravissimasNoPeriodo: qtdGravissimas,
            PontosRestantesParaSuspensao: restantes,
            PercentualDoLimite: percentual,
            NivelStatus: nivel,
            ElegivelReciclagemPreventiva: elegivelReciclagem,
            MultasConsideradas: itens);
    }
}
