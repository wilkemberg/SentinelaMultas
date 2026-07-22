using Microsoft.Extensions.Configuration;
using Sentinela.Api.Services;
using Xunit;

namespace Sentinela.Api.Tests;

public class JwtServiceTests
{
    // HashSenha/VerificarSenha/GerarTokenAleatorio não usam IConfiguration —
    // uma configuração vazia é suficiente para testar esses métodos.
    private static JwtService NovoServico() => new(new ConfigurationBuilder().Build());

    [Fact]
    public void HashSenha_SenhaCorreta_VerificaComSucesso()
    {
        var jwt = NovoServico();
        var hash = jwt.HashSenha("minhaSenhaSegura123");

        Assert.True(jwt.VerificarSenha("minhaSenhaSegura123", hash));
    }

    [Fact]
    public void HashSenha_SenhaIncorreta_FalhaNaVerificacao()
    {
        var jwt = NovoServico();
        var hash = jwt.HashSenha("minhaSenhaSegura123");

        Assert.False(jwt.VerificarSenha("senhaErrada", hash));
    }

    [Fact]
    public void HashSenha_MesmaSenhaDuasVezes_GeraHashesDiferentes()
    {
        // Salt aleatório por chamada — mesmo a mesma senha nunca deve produzir
        // o mesmo hash duas vezes (evita ataques de tabela arco-íris).
        var jwt = NovoServico();
        var hash1 = jwt.HashSenha("senha123");
        var hash2 = jwt.HashSenha("senha123");

        Assert.NotEqual(hash1, hash2);
        Assert.True(jwt.VerificarSenha("senha123", hash1));
        Assert.True(jwt.VerificarSenha("senha123", hash2));
    }

    [Fact]
    public void VerificarSenha_HashEmFormatoInvalido_RetornaFalseSemLancarExcecao()
    {
        var jwt = NovoServico();
        Assert.False(jwt.VerificarSenha("qualquer", "hash-sem-o-separador-esperado"));
    }

    [Fact]
    public void GerarTokenAleatorio_GeraTokensUnicosESemCaracteresDeUrlInseguros()
    {
        var jwt = NovoServico();
        var token1 = jwt.GerarTokenAleatorio();
        var token2 = jwt.GerarTokenAleatorio();

        Assert.NotEqual(token1, token2);
        Assert.DoesNotContain('+', token1);
        Assert.DoesNotContain('/', token1);
        Assert.DoesNotContain('=', token1);
    }
}
