namespace Sentinela.Api.Models;

public enum TipoVeiculo
{
    Carro,
    Moto
}

public class Veiculo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }

    public string Placa { get; set; } = string.Empty;
    public string Renavam { get; set; } = string.Empty;
    public string Uf { get; set; } = "RJ"; // início: só RJ no MVP
    public TipoVeiculo Tipo { get; set; } = TipoVeiculo.Carro;

    // CPF do proprietário deste veículo específico, usado na consulta ao
    // DETRAN-RJ/Nada-Consta (que exige CPF+RENAVAM do dono cadastrado, não
    // necessariamente o dono da conta Sentinela). Opcional: quando em branco,
    // cai no CPF do próprio Usuario (caso comum de quem só monitora o próprio
    // carro). Preencher aqui é útil para carro de terceiro/empresa/financiado.
    public string? CpfProprietario { get; set; }

    public bool MonitoramentoAtivo { get; set; } = true;
    public DateTime? UltimaVerificacaoEm { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public List<Multa> Multas { get; set; } = new();
}
