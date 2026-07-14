namespace Sentinela.Api.Services;

/// <summary>
/// Combina os resultados de duas (ou mais) fontes de consulta de multas —
/// hoje SERPRO/RADAR (nacional, via RENAINF) e DETRAN/RJ/Nada-Consta (cadastro
/// do estado do veículo) — casando por <see cref="MultaEncontrada.NumeroAutoInfracao"/>.
///
/// Regra de mesclagem: quando a mesma multa aparece nas duas fontes, uma serve
/// só de confirmação; os campos que a primeira fonte já trouxe preenchidos têm
/// prioridade, e só usamos a segunda fonte para completar o que estiver vazio ou
/// zerado (ex.: o SERPRO/RADAR não devolve valor/enquadramento, mas o DETRAN-RJ
/// devolve — nesse caso a mesclagem pega o valor real do DETRAN-RJ).
/// </summary>
public static class MultasMerge
{
    public static List<MultaEncontrada> Combinar(params IReadOnlyList<MultaEncontrada>[] fontes)
    {
        var porNumero = new Dictionary<string, MultaEncontrada>();

        foreach (var fonte in fontes)
        {
            foreach (var m in fonte)
            {
                if (porNumero.TryGetValue(m.NumeroAutoInfracao, out var existente))
                {
                    porNumero[m.NumeroAutoInfracao] = existente with
                    {
                        Valor = existente.Valor > 0 ? existente.Valor : m.Valor,
                        Pontos = existente.Pontos > 0 ? existente.Pontos : m.Pontos,
                        CodigoInfracaoCtb = string.IsNullOrWhiteSpace(existente.CodigoInfracaoCtb) ? m.CodigoInfracaoCtb : existente.CodigoInfracaoCtb,
                        DescricaoInfracao = string.IsNullOrWhiteSpace(existente.DescricaoInfracao) ? m.DescricaoInfracao : existente.DescricaoInfracao,
                        Local = existente.Local ?? m.Local,
                        Municipio = existente.Municipio ?? m.Municipio,
                        AutuacaoPdfUrl = existente.AutuacaoPdfUrl ?? m.AutuacaoPdfUrl,
                        BoletoPdfUrl = existente.BoletoPdfUrl ?? m.BoletoPdfUrl,
                        Fonte = CombinarFontes(existente.Fonte, m.Fonte),
                    };
                }
                else
                {
                    porNumero[m.NumeroAutoInfracao] = m;
                }
            }
        }

        return porNumero.Values.ToList();
    }

    /// <summary>
    /// Junta o(s) nome(s) de fonte de duas multas equivalentes numa única string
    /// separada por vírgula, sem duplicar e em ordem alfabética estável (ex.:
    /// "DETRAN-RJ" + "SERPRO/RADAR" → "DETRAN-RJ,SERPRO/RADAR"). Também usado
    /// diretamente pelos controllers para atualizar Multa.FontesConfirmacao ao
    /// reconciliar registros já existentes, sem precisar rechamar a IA.
    /// </summary>
    public static string CombinarFontes(string? a, string? b)
    {
        var fontes = new[] { a, b }
            .Where(f => !string.IsNullOrWhiteSpace(f))
            .SelectMany(f => f!.Split(',', StringSplitOptions.RemoveEmptyEntries))
            .Select(f => f.Trim())
            .Where(f => f.Length > 0)
            .Distinct()
            .OrderBy(f => f, StringComparer.Ordinal)
            .ToList();

        return string.Join(",", fontes);
    }
}
