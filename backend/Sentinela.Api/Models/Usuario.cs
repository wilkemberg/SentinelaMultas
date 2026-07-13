namespace Sentinela.Api.Models;

public class Usuario
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? WhatsAppNumero { get; set; } // formato E.164, ex: +5521999998888
    public string SenhaHash { get; set; } = string.Empty;

    // Preferências de notificação
    public bool NotificarEmail { get; set; } = true;
    public bool NotificarWhatsApp { get; set; } = false;

    // Autodeclaração: usada para aplicar a regra correta de limite de pontos da CNH
    // (Lei 14.071/2020, art. 261 e 261-A). Quem exerce atividade remunerada com o
    // veículo tem limite fixo de 40 pontos; quem não exerce tem limite escalonado
    // (20/30/40) conforme a quantidade de infrações gravíssimas no período.
    public bool AtividadeRemunerada { get; set; } = false;

    // Dados de identificação/CNH — usados para montar o cartão visual da carteira
    // e estimar o vencimento. Todos opcionais: o usuário preenche quando quiser.
    public string? Cpf { get; set; }                 // apenas dígitos, 11 chars
    public string? NumeroRegistroCnh { get; set; }
    public string? CategoriaCnh { get; set; }         // ex: "AB", "B", "D"
    public DateTime? DataNascimento { get; set; }
    public DateTime? DataExpedicaoCnh { get; set; }
    public string? NomeMae { get; set; }              // exigido pela validação oficial (SENATRAN)

    // Preenchidos pela validação oficial via SENATRAN/Validar CNH (Infosimples).
    // Diferente dos campos acima (autodeclarados), estes vêm direto da base
    // RENACH — por isso têm prioridade sobre a estimativa de validade calculada
    // localmente quando disponíveis.
    public string? SituacaoCnh { get; set; }          // ex: "Regular", "Suspensa", "Cassada"
    public DateTime? ValidadeCnhOficial { get; set; } // validade real, vinda do SENATRAN
    public DateTime? CnhValidadaEm { get; set; }      // quando a última validação oficial rodou

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime? UltimoLoginEm { get; set; }

    public List<Veiculo> Veiculos { get; set; } = new();
}
