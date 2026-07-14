namespace Sentinela.Api.Models;

public enum GravidadeInfracao
{
    Leve,
    Media,
    Grave,
    Gravissima
}

public enum StatusRecurso
{
    NaoAvaliado,               // recém detectada, IA ainda não analisou
    RecursoViavel,             // IA identificou chance real de recurso
    RecursoNaoRecomendado,     // IA avaliou: baixa chance de êxito
    DefesaGerada,              // texto de defesa pronto para o usuário
    Protocolado,               // usuário marcou como enviado
    Deferido,
    Indeferido
}

public class Multa
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid VeiculoId { get; set; }
    public Veiculo? Veiculo { get; set; }

    // Dados do auto de infração
    public string NumeroAutoInfracao { get; set; } = string.Empty;
    public string OrgaoAutuador { get; set; } = string.Empty; // DETRAN-RJ, CET-RIO, PRF
    public string CodigoInfracaoCtb { get; set; } = string.Empty;
    public string ArtigoCtb { get; set; } = string.Empty;
    public string DescricaoInfracao { get; set; } = string.Empty;
    public GravidadeInfracao Gravidade { get; set; }
    public decimal Valor { get; set; }
    public int Pontos { get; set; }

    // Datas e prazos
    public DateTime DataInfracao { get; set; }
    public DateTime? PrazoDefesaPrevia { get; set; }   // 30 dias da notificação (Art. 281)
    public DateTime? PrazoRecursoJari { get; set; }    // 30 dias após indeferimento defesa
    public DateTime? PrazoRecursoCetran { get; set; }  // 30 dias após indeferimento JARI

    // Status do processo de recurso
    public StatusRecurso Status { get; set; } = StatusRecurso.NaoAvaliado;

    // Análise da IA (preenchida pelo AnthropicCtbAnaliseService)
    public string? AnaliseIa { get; set; }             // explicação em linguagem simples
    public string? FundamentacaoRecurso { get; set; }  // justificativa legal para recorrer
    public string? TextoDefesa { get; set; }           // texto completo da defesa gerado
    public string? ComoEvitarNoFuturo { get; set; }    // orientação preventiva
    public double? ChanceRecursoPercent { get; set; }  // 0-100, estimativa da IA
    public string? OndeRecorrer { get; set; }          // JARI → CETRAN → Judiciário (passos)
    public string? OndeObterDesconto { get; set; }     // PagTesouro, Refis, parcelamento

    // Localização da infração
    public string? LocalInfracao { get; set; }
    public string? Municipio { get; set; }

    // Links para os documentos originais do órgão autuador (quando disponíveis).
    // Preenchidos pela consulta ao SERPRO/RADAR/Veículo (via Infosimples).
    public string? AutuacaoPdfUrl { get; set; }
    public string? BoletoPdfUrl { get; set; }

    // Quais fontes de consulta confirmaram esta multa nesta verificação (ex.:
    // "DETRAN-RJ", "SERPRO/RADAR" ou "DETRAN-RJ,SERPRO/RADAR" quando as duas
    // bateram). Usado na UI para mostrar o selo "confirmado em 2 fontes".
    // Preenchido/atualizado em VeiculosController.VerificarAgora e
    // MonitoramentoDiarioJob via MultasMerge.CombinarFontes.
    public string FontesConfirmacao { get; set; } = string.Empty;

    public DateTime DetectadaEm { get; set; } = DateTime.UtcNow;
    public DateTime? AnalisadaEm { get; set; }
}
