using Sentinela.Api.Services;
using Xunit;

namespace Sentinela.Api.Tests;

public class MultasMergeTests
{
    private static MultaEncontrada NovaMulta(
        string numeroAuto, decimal valor = 0m, int pontos = 0, string codigoCtb = "", string fonte = "") => new(
        NumeroAutoInfracao: numeroAuto,
        OrgaoAutuador: "DETRAN-RJ",
        CodigoInfracaoCtb: codigoCtb,
        DescricaoInfracao: "Infração de teste",
        Valor: valor,
        Pontos: pontos,
        DataInfracao: DateTime.UtcNow,
        Fonte: fonte);

    [Fact]
    public void Combinar_UmaUnicaFonte_RetornaTodasAsMultasSemAlteracao()
    {
        var fonte = new[] { NovaMulta("AUTO-1", valor: 100m, pontos: 5, fonte: "SERPRO/RADAR") };

        var resultado = MultasMerge.Combinar(fonte);

        Assert.Single(resultado);
        Assert.Equal("AUTO-1", resultado[0].NumeroAutoInfracao);
        Assert.Equal("SERPRO/RADAR", resultado[0].Fonte);
    }

    [Fact]
    public void Combinar_MesmaMultaEmDuasFontes_PreenchePrimeiraComDadosDaSegunda()
    {
        var fonteA = new[] { NovaMulta("AUTO-1", valor: 0m, pontos: 0, fonte: "SERPRO/RADAR") };
        var fonteB = new[] { NovaMulta("AUTO-1", valor: 293.47m, pontos: 5, codigoCtb: "60501", fonte: "DETRAN-RJ") };

        var resultado = MultasMerge.Combinar(fonteA, fonteB);

        Assert.Single(resultado);
        var combinada = resultado[0];
        // A primeira fonte não tinha valor/pontos/código — a mesclagem completa
        // com o que a segunda fonte trouxe.
        Assert.Equal(293.47m, combinada.Valor);
        Assert.Equal(5, combinada.Pontos);
        Assert.Equal("60501", combinada.CodigoInfracaoCtb);
        Assert.Equal("DETRAN-RJ,SERPRO/RADAR", combinada.Fonte);
    }

    [Fact]
    public void Combinar_MesmaMultaComDadosNasDuasFontes_PrimeiraFontePrevalece()
    {
        var fonteA = new[] { NovaMulta("AUTO-1", valor: 100m, pontos: 3, fonte: "SERPRO/RADAR") };
        var fonteB = new[] { NovaMulta("AUTO-1", valor: 999m, pontos: 9, fonte: "DETRAN-RJ") };

        var resultado = MultasMerge.Combinar(fonteA, fonteB);

        Assert.Equal(100m, resultado[0].Valor);
        Assert.Equal(3, resultado[0].Pontos);
    }

    [Fact]
    public void CombinarFontes_JuntaSemDuplicarEEmOrdemAlfabetica()
    {
        var resultado = MultasMerge.CombinarFontes("SERPRO/RADAR", "DETRAN-RJ");
        Assert.Equal("DETRAN-RJ,SERPRO/RADAR", resultado);

        var resultadoIdempotente = MultasMerge.CombinarFontes(resultado, "SERPRO/RADAR");
        Assert.Equal("DETRAN-RJ,SERPRO/RADAR", resultadoIdempotente);
    }

    [Fact]
    public void CombinarFontes_ComValoresVazios_NaoQuebra()
    {
        Assert.Equal("", MultasMerge.CombinarFontes(null, ""));
        Assert.Equal("SERPRO/RADAR", MultasMerge.CombinarFontes("SERPRO/RADAR", null));
    }
}
