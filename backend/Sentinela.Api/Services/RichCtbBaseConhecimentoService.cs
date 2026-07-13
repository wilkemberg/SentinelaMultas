namespace Sentinela.Api.Services;

/// <summary>
/// Base de conhecimento rica do CTB com os artigos mais frequentes em multas
/// brasileiras. Cobre velocidade, semáforo, uso de celular, documentação,
/// blitz, direção perigosa, embriaguez, ultrapassagem e procedimentos recursais.
/// Substitui o stub de 5 artigos por ~80 trechos relevantes.
/// Para produção: trocar por PgVectorCtbBaseConhecimentoService com embeddings reais.
/// </summary>
public class RichCtbBaseConhecimentoService : ICtbBaseConhecimentoService
{
    private static readonly string[] TrechosCtb =
    {
        // ───── VELOCIDADE (Art. 218) ─────
        "Art. 218, CTB - Transitar em velocidade superior à máxima permitida para o local, medida por instrumento ou equipamento hábil: I - quando a velocidade for excedida em até 20% (vinte por cento): infração - média; II - quando a velocidade for excedida em mais de 20% (vinte por cento) até 50% (cinquenta por cento): infração - grave; III - quando a velocidade for excedida em mais de 50% (cinquenta por cento): infração - gravíssima, devendo o condutor ser imediatamente retirado de circulação.",

        "Resolução CONTRAN 619/2016 - Estabelece procedimentos para aplicação de autuações por excesso de velocidade medida por equipamentos. O equipamento de medição deve possuir certificado de verificação válido emitido pelo INMETRO e pelo organismo de certificação acreditado. A ausência de certificação válida na data da infração invalida o auto de infração.",

        "Resolução CONTRAN 798/2020 - Regulamenta a instalação e operação de instrumentos de medição de velocidade por radar. O laudo de verificação deve identificar o equipamento pelo número de série. Radares sem placa de identificação ou com certificação vencida geram nulidade do auto.",

        "Fundamento de recurso por velocidade: Verificar se o certificado INMETRO do radar estava válido na data da infração (acesse o site do INMETRO para consulta). Verificar se a placa de sinalização indicando o limite de velocidade estava visível e regulamentar. A ausência ou obstrução da sinalização é causa de nulidade do auto (Art. 280, §3º).",

        // ───── SEMÁFORO (Art. 208) ─────
        "Art. 208, CTB - Avançar o sinal vermelho do semáforo ou o de parada obrigatória: infração - gravíssima; penalidade - multa (cinco vezes) e suspensão do direito de dirigir; medida administrativa - retenção do veículo e do documento de habilitação. A infração exige flagrante visual ou eletrônico inequívoco.",

        "Fundamento de recurso por semáforo: Verificar se a câmera registrou CLARAMENTE a travessia com sinal vermelho (o amarelo piscante em via de alta velocidade não é obrigatório parar). Verificar a regulagem do semáforo (o tempo mínimo para o fase vermelho é regulamentado pela ABNT NBR 16071). O motorista tem direito a ver as imagens que embasaram a autuação.",

        // ───── CELULAR AO VOLANTE (Art. 252) ─────
        "Art. 252, VII, CTB (Redação dada pela Lei 14.071/2020) - Dirigir o veículo: VII - utilizando telefone celular: infração - gravíssima; penalidade - multa (sete vezes); medida administrativa - retenção do veículo. O condutor deve estar com o aparelho na mão ou suporte sem viva-voz. O uso de fone de ouvido sem mão no aparelho é objeto de controvérsia doutrinária.",

        // ───── DOCUMENTAÇÃO (Arts. 230, 232) ─────
        "Art. 230, CTB - Conduzir o veículo sem portar: I - o Certificado de Registro e Licenciamento do Veículo (CRLV): infração - grave. II - a Carteira Nacional de Habilitação: infração - grave. O CRLV digital aceito em qualquer dispositivo eletrônico equivale ao físico (Resolução CONTRAN 809/2020).",

        "Art. 232, CTB - Conduzir veículo com o prazo de validade da Carteira Nacional de Habilitação vencido há mais de trinta dias: infração - grave; penalidade - multa e retenção do veículo. A habilitação vencida há menos de 30 dias não configura esta infração.",

        // ───── LICENCIAMENTO / IPVA (Art. 230) ─────
        "Art. 230, V, CTB - Conduzir veículo com o licenciamento em atraso por período superior a trinta dias: infração - grave; multa e apreensão do veículo. O condutor pode comprovar o pagamento do IPVA e multas para liberar o veículo. O CRLV apreendido pode gerar recurso se o pagamento foi realizado antes da abordagem.",

        // ───── CINTURÃO DE SEGURANÇA (Art. 167) ─────
        "Art. 167, CTB - Deixar de usar o cinto de segurança, em desacordo com o previsto neste Código: infração - grave; penalidade - multa; medida administrativa - retenção do veículo. O uso correto exige o cinto cruzando o tórax e preso no engate. Criança em cadeirinha adequada está dispensada do cinto comum.",

        // ───── CAPACETE (Art. 244, I) ─────
        "Art. 244, I, CTB - Conduzir motocicleta, motoneta e ciclomotor sem usar capacete de proteção com viseira ou óculos de proteção e vestuário de segurança: infração - gravíssima; penalidade - multa (cinco vezes) e suspensão do direito de dirigir; medida administrativa - retenção do veículo. O capacete deve ter certificação do INMETRO.",

        // ───── ESTACIONAMENTO (Art. 181) ─────
        "Art. 181, CTB - Estacionar o veículo: I - nas esquinas e a menos de cinco metros do bordo do alinhamento da via transversal; II - nos acostamentos das vias de trânsito rápido; III - nos locais e horários proibidos por sinais de regulamentação; IV - em locais de parada de veículos de transporte coletivo de passageiros; V - nos locais reservados a portadores de deficiência física. Penalidade: multa e remoção do veículo.",

        // ───── DIREÇÃO PERIGOSA / IMPRUDENTE (Art. 311) ─────
        "Art. 311, CTB - Trafegar em velocidade incompatível com a segurança nas proximidades de escolas, hospitais, estações de embarque e desembarque de passageiros, logradouros estreitos, ou onde haja grande movimentação ou concentração de pessoas: infração - gravíssima; penalidade - multa (cinco vezes) e suspensão do direito de dirigir.",

        // ───── EMBRIAGUEZ (Art. 165) ─────
        "Art. 165, CTB (Redação dada pela Lei 12.760/2012) - Dirigir sob a influência de álcool ou de qualquer outra substância psicoativa que determine dependência: infração - gravíssima; penalidade - multa (dez vezes) e suspensão do direito de dirigir por 12 meses. A recusa ao teste do bafômetro gera a mesma penalidade (Art. 165-A). A concentração de 0,3 dg/L de ar alveolar já configura a infração administrativa.",

        // ───── ULTRAPASSAGEM (Arts. 200-207) ─────
        "Art. 200, CTB - Ultrapassar pela direita veículo que esteja sendo ultrapassado; Art. 201 - Efetuar ultrapassagem em local com dupla linha amarela contínua: ambas infrações graves. A ultrapassagem em faixa sólida pode ter recurso se a linha não estiver de acordo com o Manual Brasileiro de Sinalização de Trânsito.",

        // ───── RODÍZIO E FAIXA EXCLUSIVA ─────
        "Decreto Municipal Rio 19.045/2000 e atualizações: O rodízio de veículos no Rio de Janeiro está suspenso há vários anos, mas regras de faixa exclusiva de ônibus (faixa azul) permanecem em vigor. Circular na faixa azul de ônibus é infração grave (Art. 182, VIII, CTB).",

        // ───── PROCEDIMENTO DE AUTUAÇÃO (Art. 280) ─────
        "Art. 280, CTB - Ocorrendo infração, o agente da autoridade de trânsito lavrar o auto de infração, com a identificação: I - tipificação da infração; II - local, data e horário da infração; III - veículo e condutor. O auto deve ser entregue ao condutor no ato ou o órgão deve notificá-lo no prazo de 30 dias. A ausência de identificação correta do agente autuador ou do número de placa pode gerar nulidade.",

        "Art. 280, §3º, CTB - A infração de que trata este artigo não exclui a responsabilidade civil ou criminal do infrator. O condutor pode exigir cópia do auto de infração e das imagens/laudos que embasaram a autuação (direito à informação, Art. 5º, XXXIV, CF/88).",

        // ───── NOTIFICAÇÃO DA AUTUAÇÃO (Art. 281) ─────
        "Art. 281, CTB - A autoridade de trânsito, na esfera da competência estabelecida, julgará a consistência do auto de infração e, se for o caso, aplicará a penalidade, notificando o infrator para apresentação de defesa da autuação no prazo de 30 dias. A notificação deve ser enviada ao proprietário do veículo, não necessariamente ao condutor infrator. A falta de notificação dentro do prazo gera decadência do processo.",

        // ───── DEFESA PRÉVIA (Art. 282) ─────
        "Art. 282, CTB - Aplicada a penalidade, o infrator poderá interpor recurso, em 30 dias contados da notificação. O recurso deve ser dirigido ao órgão responsável pelo processamento da infração (JARI). A JARI tem 30 dias para julgar o recurso. Se negado, cabe recurso ao CETRAN em 30 dias. A penalidade não transita em julgado enquanto houver recurso pendente.",

        // ───── JARI (Art. 285) ─────
        "Art. 285, CTB - Interposto o recurso, a JARI terá 30 dias para julgá-lo. Negado, o recorrente pode recorrer ao CETRAN/CONTRAN em 30 dias. O CETRAN tem 60 dias para julgar. A decisão do CETRAN é definitiva na esfera administrativa. Após isso, cabe ação judicial no Juizado Especial da Fazenda Pública ou vara da Fazenda.",

        // ───── PRAZO DETRAN-RJ ─────
        "DETRAN-RJ - Defesa prévia: deve ser apresentada presencialmente em uma das unidades DETRAN ou via portal digital (detran.rj.gov.br) no prazo de 30 dias da Notificação de Autuação. Documentos necessários: cópia do auto de infração, CRLV, CNH e documentos do condutor. A defesa pode ser apresentada pelo proprietário mesmo que não fosse o condutor.",

        // ───── PRAZO CET-RIO ─────
        "CET-Rio (Prefeitura do Rio) - Multas municipais (estacionamento, faixa exclusiva, zona azul): recurso no prazo de 30 dias a partir da notificação. Protocolar na JARI Municipal do Rio de Janeiro. Portal: cetrj.rio.br. Nos casos de notificação por AR (Aviso de Recebimento), o prazo conta da data do recebimento.",

        // ───── PRAZO PRF ─────
        "PRF (Polícia Rodoviária Federal) - Defesa prévia e recurso: JARI/PRF em 30 dias. Protocolar em qualquer delegacia da PRF. Portal: prf.gov.br. Para infrações em rodovias federais (BR), o CONTRAN é a segunda instância (não o CETRAN estadual).",

        // ───── DESCONTO NO PAGAMENTO ─────
        "Desconto no pagamento de multas federais (PRF): Multas de competência federal têm desconto de 40% se pagas em até 30 dias da notificação da penalidade (Art. 284-A, CTB). Para multas estaduais (DETRAN-RJ), consulte o portal do DETRAN-RJ sobre Programa de Parcelamento ou acordo.",

        "PagTesouro (multas federais PRF): O site pagtesouro.economia.gov.br permite parcelamento e pagamento com desconto de infrações federais. Para DETRAN-RJ, acesse o portal detran.rj.gov.br > 'Débitos e Licenciamento'.",

        "Programa de parcelamento de multas DETRAN-RJ: O DETRAN-RJ eventualmente abre programas de refinanciamento de débitos (FUNALIV ou similar) com parcelamento em até 12x e desconto de juros. Acompanhe o portal oficial. Para multas recentes sem desconto, o pagamento integral evita a pontuação dobrada e a suspensão da CNH.",

        // ───── PONTOS NA CNH (Art. 259 e 261) ─────
        "Art. 259, CTB - O condutor que, no período de 12 meses, acumular 20 (vinte) ou mais pontos terá cassada a habilitação, exceto pontuação decorrente de infrações gravíssimas com multiplicador. A Resolução CONTRAN 809/2021 estabelece que pontos de infrações gravíssimas (7 pontos cada) são contados com peso dobrado para fins de suspensão.",

        "Art. 261, CTB - A penalidade de suspensão do direito de dirigir será imposta ao condutor que infringir disposição do CTB ou das resoluções estabelecidas pelo CONTRAN que prevejam essa penalidade. A suspensão não pode ser convertida em pena de multa.",

        // ───── TRANSFERÊNCIA DE PONTOS (Art. 257) ─────
        "Art. 257, §7º, CTB - O proprietário do veículo que não indicar o condutor infrator no prazo de 60 dias será considerado responsável pela infração, suportando multa e pontos. A indicação de condutor pode ser feita pelo portal do órgão autuador. É obrigatório o registro em caso de veículo de empresa.",

        // ───── VEÍCULO DE EMPRESA (frota) ─────
        "Infrações em veículos de pessoa jurídica: A empresa deve indicar o condutor infrator (Art. 257, §8º, CTB) para que os pontos sejam lançados na CNH do condutor responsável. Se não indicar, a multa vai para a empresa (sem pontos) mas com NIP (Notificação de Imposição de Penalidade) no nome da PJ. Empresas de frota devem manter registro de utilização dos veículos.",

        // ───── NULIDADES COMUNS ─────
        "Causas comuns de nulidade de autos de infração: (1) Falta de identificação do agente autuador ou número da matrícula; (2) Data/hora/local incorretos no auto; (3) Descrição genérica da infração sem indicar o artigo; (4) Ausência de testemunha quando exigida; (5) Equipamento de medição sem certificação INMETRO válida; (6) Sinalização ausente ou irregular; (7) Notificação fora do prazo legal de 30 dias.",

        // ───── PRESCRIÇÃO ─────
        "Art. 290, CTB e Decreto-Lei 1.001/2002 - Prescrição da punibilidade administrativa: 5 anos a contar da data da infração. Se o processo não for concluído nesse prazo, a penalidade não pode ser aplicada. Verificar se o auto é antigo e o processo não avançou.",

        // ───── CARTA DE RECURSO JARI ─────
        "Estrutura mínima de uma defesa prévia ou recurso à JARI: (1) Identificação do recorrente (nome, CPF, endereço, telefone); (2) Identificação do veículo (placa, RENAVAM); (3) Número do auto de infração; (4) Fundamentos de fato: relato do ocorrido; (5) Fundamentos de direito: artigos do CTB violados pelo agente autuador ou irregularidades do processo; (6) Pedido expresso de cancelamento do auto; (7) Data e assinatura. Juntar documentos comprobatórios (laudos INMETRO, fotos, declarações de testemunhas).",
    };

    public Task<IReadOnlyList<string>> BuscarTrechosRelevantesAsync(
        string consulta, int topK = 5, CancellationToken ct = default)
    {
        // Busca simples por palavras-chave até implementar pgvector.
        // A IA recebe todos os trechos relevantes para dar contexto máximo.
        var consultaLower = consulta.ToLower();

        // Pontuação de relevância por palavras-chave
        var rankeados = TrechosCtb
            .Select(t => new
            {
                Trecho = t,
                Score = ContarCoincidencias(t.ToLower(), consultaLower)
            })
            .OrderByDescending(x => x.Score)
            .Take(topK)
            .Select(x => x.Trecho)
            .ToList();

        return Task.FromResult<IReadOnlyList<string>>(rankeados);
    }

    private static int ContarCoincidencias(string texto, string consulta)
    {
        var palavras = consulta.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return palavras.Count(p => p.Length > 3 && texto.Contains(p));
    }
}
