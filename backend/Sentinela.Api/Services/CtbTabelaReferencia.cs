using System.Globalization;
using System.Text;
using Sentinela.Api.Models;

namespace Sentinela.Api.Services;

/// <summary>
/// Tabela de referência com os valores oficiais (artigo do CTB, gravidade, pontos na
/// CNH e valor da multa) das infrações de trânsito mais comuns detectadas por
/// fiscalização eletrônica (radar de velocidade, sinal vermelho, etc.).
///
/// Por quê isso existe: a consulta ao SERPRO/RADAR/Veículo (via Infosimples) só
/// devolve o texto livre da "descricao" e o número do AIT — não devolve valor,
/// pontos ou o enquadramento no CTB (confirmado consultando a documentação pública
/// da Infosimples e testando com dados reais). Só que esses três dados são fixados
/// por lei (CTB, Lei 9.503/1997 + Resolução CONTRAN/tabela de multas) e não variam
/// de uma ocorrência para outra do mesmo tipo de infração — então dá para preencher
/// com confiança a partir do texto da descrição, sem depender da IA.
///
/// Valores conferidos em fontes públicas (jusbrasil, doutormultas, ctbdigital) em
/// jul/2026, para a tabela vigente desde a atualização de valores de 2024/2025.
/// Se a Infosimples passar a devolver valor/pontos/código diretamente no futuro,
/// esses dados têm prioridade — esta tabela só entra quando o que veio da consulta
/// está zerado/vazio.
/// </summary>
public static class CtbTabelaReferencia
{
    public record InfoCtb(string Artigo, GravidadeInfracao Gravidade, int Pontos, decimal Valor);

    // Pontuação padrão por gravidade (Art. 259, §1º do CTB)
    private const int PontosLeve = 3;
    private const int PontosMedia = 4;
    private const int PontosGrave = 5;
    private const int PontosGravissima = 7;

    // Cada entrada casa por TODAS as palavras-chave estarem presentes na descrição
    // (case-insensitive, sem acento não é tratado — comparação simples e direta).
    private static readonly (string[] Palavras, InfoCtb Info)[] Tabela =
    {
        (new[] { "velocidade superior", "até 20%" },
            new InfoCtb("Art. 218, I", GravidadeInfracao.Media, PontosMedia, 130.16m)),
        (new[] { "velocidade superior", "20%", "50%" },
            new InfoCtb("Art. 218, II", GravidadeInfracao.Grave, PontosGrave, 195.23m)),
        (new[] { "velocidade superior", "superior a 50%" },
            new InfoCtb("Art. 218, III", GravidadeInfracao.Gravissima, PontosGravissima, 880.41m)),
        (new[] { "avançar", "sinal vermelho" },
            new InfoCtb("Art. 208", GravidadeInfracao.Gravissima, PontosGravissima, 293.47m)),
        (new[] { "avançar", "parada obrigat" },
            new InfoCtb("Art. 208", GravidadeInfracao.Gravissima, PontosGravissima, 293.47m)),
        (new[] { "canteiro", "divisor" },
            new InfoCtb("Art. 193", GravidadeInfracao.Gravissima, PontosGravissima, 880.41m)),
        (new[] { "calçada", "passeio" },
            new InfoCtb("Art. 193", GravidadeInfracao.Gravissima, PontosGravissima, 293.47m)),
        (new[] { "cinto de segurança" },
            new InfoCtb("Art. 167", GravidadeInfracao.Grave, PontosGrave, 195.23m)),
        (new[] { "manusear", "celular" },
            new InfoCtb("Art. 252, V", GravidadeInfracao.Gravissima, PontosGravissima, 293.47m)),
        (new[] { "fones", "celular" },
            new InfoCtb("Art. 252, VI", GravidadeInfracao.Media, PontosMedia, 130.16m)),
    };

    /// <summary>
    /// Tenta identificar artigo/gravidade/pontos/valor a partir do texto da descrição
    /// da infração. Retorna null se nenhum padrão conhecido bater — nesse caso o
    /// chamador deve manter o que já tinha (ou zero, se ainda não configurado).
    /// </summary>
    public static InfoCtb? Buscar(string? descricao)
    {
        if (string.IsNullOrWhiteSpace(descricao)) return null;
        var texto = RemoverAcentos(descricao);
        foreach (var (palavras, info) in Tabela)
        {
            if (Array.TrueForAll(palavras, p => texto.Contains(RemoverAcentos(p), StringComparison.OrdinalIgnoreCase)))
                return info;
        }
        return null;
    }

    // Compara ignorando acentuação — o texto real da Infosimples pode chegar com
    // acentos em forma decomposta (NFD, ex.: "a" + acento combinante) em vez da
    // forma composta (NFC, "á" como um único caractere) usada no código-fonte.
    // Nesse caso, um simples ToLowerInvariant()+Contains() falha silenciosamente
    // mesmo quando o texto "parece" igual visualmente — foi exatamente isso que
    // impediu a tabela de casar "à máxima" / "até 20%" em multas reais.
    private static string RemoverAcentos(string texto)
    {
        var normalizado = texto.ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(normalizado.Length);
        foreach (var c in normalizado)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }
        return sb.ToString().Normalize(NormalizationForm.FormC);
    }
}
