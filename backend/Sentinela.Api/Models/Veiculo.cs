namespace Sentinela.Api.Models;

public class Veiculo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }

    public string Placa { get; set; } = string.Empty;
    public string Renavam { get; set; } = string.Empty;
    public string Uf { get; set; } = "RJ"; // início: só RJ no MVP

    public bool MonitoramentoAtivo { get; set; } = true;
    public DateTime? UltimaVerificacaoEm { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public List<Multa> Multas { get; set; } = new();
}
