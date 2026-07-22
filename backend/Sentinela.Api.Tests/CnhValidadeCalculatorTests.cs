using Sentinela.Api.Services;
using Xunit;

namespace Sentinela.Api.Tests;

public class CnhValidadeCalculatorTests
{
    [Fact]
    public void SemDataDeExpedicao_RetornaNulo()
    {
        var resultado = CnhValidadeCalculator.Calcular(DateTime.UtcNow.AddYears(-30), null);
        Assert.Null(resultado);
    }

    [Fact]
    public void CondutorComMenosDe50Anos_ValidadeDe10Anos()
    {
        var nascimento = new DateTime(1990, 1, 1);
        var expedicao = new DateTime(2020, 1, 1); // 30 anos na expedição

        var resultado = CnhValidadeCalculator.Calcular(nascimento, expedicao);

        Assert.NotNull(resultado);
        Assert.Equal(10, resultado!.AnosValidade);
        Assert.Equal(new DateTime(2030, 1, 1), resultado.DataValidade);
    }

    [Fact]
    public void CondutorEntre50E70Anos_ValidadeDe5Anos()
    {
        var nascimento = new DateTime(1960, 1, 1);
        var expedicao = new DateTime(2015, 1, 1); // 55 anos na expedição

        var resultado = CnhValidadeCalculator.Calcular(nascimento, expedicao);

        Assert.NotNull(resultado);
        Assert.Equal(5, resultado!.AnosValidade);
    }

    [Fact]
    public void CondutorAcimaDe70Anos_ValidadeDe3Anos()
    {
        var nascimento = new DateTime(1940, 1, 1);
        var expedicao = new DateTime(2015, 1, 1); // 75 anos na expedição

        var resultado = CnhValidadeCalculator.Calcular(nascimento, expedicao);

        Assert.NotNull(resultado);
        Assert.Equal(3, resultado!.AnosValidade);
    }

    [Fact]
    public void ValidadeJaVencida_NivelStatusVencida()
    {
        var resultado = CnhValidadeCalculator.Calcular(new DateTime(1980, 1, 1), new DateTime(2000, 1, 1));

        Assert.NotNull(resultado);
        Assert.Equal("Vencida", resultado!.NivelStatus);
    }

    [Fact]
    public void ComOficial_UsaValidadeInformadaDiretamente()
    {
        var validadeOficial = DateTime.UtcNow.AddYears(2);
        var resultado = CnhValidadeCalculator.ComOficial(validadeOficial);

        Assert.Equal(validadeOficial, resultado.DataValidade);
        Assert.Equal("Regular", resultado.NivelStatus);
    }
}
