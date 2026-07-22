using Sentinela.Api.Models;
using Sentinela.Api.Services;
using Xunit;

namespace Sentinela.Api.Tests;

public class PontuacaoCnhCalculatorTests
{
    private static Multa NovaMulta(int pontos, GravidadeInfracao gravidade, DateTime dataInfracao) => new()
    {
        NumeroAutoInfracao = Guid.NewGuid().ToString(),
        OrgaoAutuador = "SERPRO/RADAR",
        CodigoInfracaoCtb = "000",
        ArtigoCtb = "Art. 000",
        DescricaoInfracao = "Infração de teste",
        Gravidade = gravidade,
        Pontos = pontos,
        DataInfracao = dataInfracao,
    };

    [Fact]
    public void SemAtividadeRemunerada_SemGravissimas_LimiteE40()
    {
        var multas = new[] { NovaMulta(5, GravidadeInfracao.Leve, DateTime.UtcNow.AddMonths(-1)) };

        var resultado = PontuacaoCnhCalculator.Calcular(multas, atividadeRemunerada: false);

        Assert.Equal(40, resultado.LimiteAplicavel);
        Assert.Equal(5, resultado.PontosAtuais);
        Assert.Equal(0, resultado.InfracoesGravissimasNoPeriodo);
    }

    [Fact]
    public void SemAtividadeRemunerada_UmaGravissima_LimiteE30()
    {
        var multas = new[] { NovaMulta(7, GravidadeInfracao.Gravissima, DateTime.UtcNow.AddMonths(-1)) };

        var resultado = PontuacaoCnhCalculator.Calcular(multas, atividadeRemunerada: false);

        Assert.Equal(30, resultado.LimiteAplicavel);
    }

    [Fact]
    public void SemAtividadeRemunerada_DuasOuMaisGravissimas_LimiteE20()
    {
        var multas = new[]
        {
            NovaMulta(7, GravidadeInfracao.Gravissima, DateTime.UtcNow.AddMonths(-1)),
            NovaMulta(7, GravidadeInfracao.Gravissima, DateTime.UtcNow.AddMonths(-2)),
        };

        var resultado = PontuacaoCnhCalculator.Calcular(multas, atividadeRemunerada: false);

        Assert.Equal(20, resultado.LimiteAplicavel);
    }

    [Fact]
    public void ComAtividadeRemunerada_LimiteSempre40_ReciclagemAos30Pontos()
    {
        var multas = new[]
        {
            NovaMulta(15, GravidadeInfracao.Gravissima, DateTime.UtcNow.AddMonths(-1)),
            NovaMulta(15, GravidadeInfracao.Gravissima, DateTime.UtcNow.AddMonths(-2)),
        };

        var resultado = PontuacaoCnhCalculator.Calcular(multas, atividadeRemunerada: true);

        Assert.Equal(40, resultado.LimiteAplicavel);
        Assert.True(resultado.ElegivelReciclagemPreventiva);
    }

    [Fact]
    public void MultaForaDaJanelaDeDozeMeses_NaoEntraNoCalculo()
    {
        var multas = new[] { NovaMulta(10, GravidadeInfracao.Media, DateTime.UtcNow.AddMonths(-13)) };

        var resultado = PontuacaoCnhCalculator.Calcular(multas, atividadeRemunerada: false);

        Assert.Equal(0, resultado.PontosAtuais);
        Assert.Empty(resultado.MultasConsideradas);
    }

    [Fact]
    public void AtingirOLimite_ResultaEmNivelRisco()
    {
        var multas = new[] { NovaMulta(40, GravidadeInfracao.Leve, DateTime.UtcNow.AddMonths(-1)) };

        var resultado = PontuacaoCnhCalculator.Calcular(multas, atividadeRemunerada: false);

        Assert.Equal("Risco", resultado.NivelStatus);
        Assert.Equal(0, resultado.PontosRestantesParaSuspensao);
    }
}
