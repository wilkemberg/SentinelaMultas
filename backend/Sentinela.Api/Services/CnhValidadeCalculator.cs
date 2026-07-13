namespace Sentinela.Api.Services;

/// <summary>
/// Resultado do cálculo de validade da CNH a partir da data de expedição e da
/// idade do condutor.
/// </summary>
public record CnhValidadeResultado(
    DateTime DataValidade,
    int AnosValidade,
    int DiasParaVencer,
    string NivelStatus); // "Regular" | "Atencao" | "Vencida"

/// <summary>
/// Calcula a validade estimada da CNH conforme a regra geral do CTB (art. 159,
/// com a redação dada pela Lei 14.071/2020): 10 anos para condutores com menos
/// de 50 anos na data de expedição/renovação; 5 anos entre 50 e 70 anos; 3 anos
/// para condutores com mais de 70 anos.
///
/// Importante: isso é uma estimativa com base na regra geral. O exame médico
/// pode fixar prazo menor em casos específicos — o prazo real é sempre o
/// impresso no documento físico/digital.
/// </summary>
public static class CnhValidadeCalculator
{
    public static CnhValidadeResultado? Calcular(DateTime? dataNascimento, DateTime? dataExpedicao)
    {
        if (dataExpedicao is null) return null;

        var expedicao = dataExpedicao.Value;
        int anos;

        if (dataNascimento is null)
        {
            // Sem data de nascimento, assume a regra padrão (10 anos) — a mais comum.
            anos = 10;
        }
        else
        {
            var idadeNaExpedicao = CalcularIdade(dataNascimento.Value, expedicao);
            anos = idadeNaExpedicao switch
            {
                >= 70 => 3,
                >= 50 => 5,
                _ => 10
            };
        }

        var validade = expedicao.AddYears(anos);
        var diasParaVencer = (validade.Date - DateTime.UtcNow.Date).Days;

        var nivel = diasParaVencer < 0
            ? "Vencida"
            : diasParaVencer <= 90
                ? "Atencao"
                : "Regular";

        return new CnhValidadeResultado(validade, anos, diasParaVencer, nivel);
    }

    /// <summary>
    /// Constrói o resultado a partir da validade OFICIAL, vinda da validação
    /// junto ao SENATRAN (base RENACH) — usada com prioridade sobre a
    /// estimativa de <see cref="Calcular"/> sempre que disponível, já que é o
    /// dado real e não uma projeção baseada na regra geral do CTB.
    /// </summary>
    public static CnhValidadeResultado ComOficial(DateTime validadeOficial)
    {
        var diasParaVencer = (validadeOficial.Date - DateTime.UtcNow.Date).Days;

        var nivel = diasParaVencer < 0
            ? "Vencida"
            : diasParaVencer <= 90
                ? "Atencao"
                : "Regular";

        // AnosValidade não se aplica aqui — a validade já é o dado oficial,
        // não uma estimativa calculada a partir de anos de vigência.
        return new CnhValidadeResultado(validadeOficial, 0, diasParaVencer, nivel);
    }

    private static int CalcularIdade(DateTime nascimento, DateTime referencia)
    {
        var idade = referencia.Year - nascimento.Year;
        if (referencia.Date < nascimento.Date.AddYears(idade)) idade--;
        return idade;
    }
}
