// ─────────────────────────────────────────────────────────────────────────────
// Gerador local de defesa prévia — usado como respaldo quando a infração ainda
// é um registro de demonstração (sem multa real persistida no backend) ou
// quando o motor de IA do servidor está indisponível. O texto é montado com
// os dados reais da infração (auto, órgão, artigo, data, valor, pontos, local)
// e segue a mesma estrutura formal usada pelo motor de IA do Sentinela
// (Preâmbulo, Dos Fatos, Do Direito, Do Pedido), garantindo pequenas variações
// de redação a cada geração para não repetir o texto duas vezes.
// ─────────────────────────────────────────────────────────────────────────────

import { Multa } from "./api";

function destinoJari(orgao: string): string {
  const o = (orgao ?? "").toUpperCase();
  if (o.includes("PRF")) return "JARI/PRF — Polícia Rodoviária Federal";
  if (o.includes("CET")) return "JARI Municipal — CET-Rio / Prefeitura do Rio de Janeiro";
  return "JARI — DETRAN-RJ";
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function escolher<T>(lista: T[]): T {
  return lista[Math.floor(Math.random() * lista.length)];
}

const ABERTURAS: Array<(auto: string) => string> = [
  (auto) =>
    `Vem o(a) requerente, condutor(a) devidamente identificado(a) nos autos, apresentar, respeitosamente, DEFESA PRÉVIA em face do Auto de Infração nº ${auto}, pelos fatos e fundamentos a seguir expostos.`,
  (auto) =>
    `O(A) condutor(a) autuado(a) no Auto de Infração nº ${auto} vem, tempestivamente, apresentar sua DEFESA PRÉVIA, requerendo a reavaliação do referido auto com base nos elementos abaixo.`,
  (auto) =>
    `Na qualidade de condutor(a) identificado(a) no Auto de Infração nº ${auto}, apresenta-se a presente DEFESA PRÉVIA, requerendo-se seu integral cancelamento pelas razões que seguem.`,
];

const FUNDAMENTOS_GERAIS: string[] = [
  "Nos termos do art. 280 e seguintes do Código de Trânsito Brasileiro, a validade do auto de infração está condicionada à regularidade formal e material do procedimento administrativo, cabendo à Administração o ônus de comprovar sua correção.",
  "Conforme disposto no CTB e nas Resoluções do CONTRAN aplicáveis, a autuação somente subsiste quando observados rigorosamente os requisitos de identificação do condutor/veículo, aferição do equipamento (quando houver) e prazos de notificação.",
  "A teor do art. 281 do CTB, a ausência de qualquer requisito formal do auto de infração é causa de nulidade, devendo o processo administrativo ser arquivado em favor do autuado.",
];

const PEDIDOS: string[] = [
  "Ante o exposto, requer-se o CONHECIMENTO e PROVIMENTO da presente defesa, com o consequente CANCELAMENTO do Auto de Infração em epígrafe, arquivando-se o processo administrativo correspondente.",
  "Diante do exposto, pugna-se pelo ACOLHIMENTO da presente defesa prévia, com o CANCELAMENTO integral da autuação e baixa definitiva no prontuário do(a) condutor(a).",
  "Por todo o exposto, requer-se seja julgada PROCEDENTE a presente defesa, determinando-se o CANCELAMENTO do auto de infração ora impugnado, com as demais consequências de direito.",
];

export function gerarDefesaLocal(multa: Multa): string {
  const jari = destinoJari(multa.orgaoAutuador);
  const artigo = multa.artigoCtb || multa.codigoInfracaoCtb;
  const abertura = escolher(ABERTURAS)(multa.numeroAutoInfracao);
  const fundamento = escolher(FUNDAMENTOS_GERAIS);
  const pedido = escolher(PEDIDOS);
  const hoje = new Date().toLocaleDateString("pt-BR");
  const local = multa.localInfracao ? `, no local ${multa.localInfracao},` : ",";

  return `DEFESA PRÉVIA — AUTO DE INFRAÇÃO Nº ${multa.numeroAutoInfracao}
Destinatário: ${jari}
Data: ${hoje}

I. PREÂMBULO

${abertura}

II. DOS FATOS

Em ${formatarData(multa.dataInfracao)}${local} foi lavrado o Auto de Infração nº ${multa.numeroAutoInfracao} pelo(a) ${multa.orgaoAutuador}, imputando-se ao veículo a conduta tipificada como "${multa.descricaoInfracao}" (${artigo}), com atribuição de ${multa.pontos} ponto(s) na CNH e multa no valor de R$ ${multa.valor.toFixed(2)}.

III. DO DIREITO

${multa.analiseIa ? multa.analiseIa : fundamento} ${fundamento}

IV. DO PEDIDO

${pedido}

Nestes termos, pede deferimento.

${hoje}
_____________________________________
Assinatura do(a) condutor(a)

--
Documento gerado automaticamente pelo Sentinela.AI com base nos dados da infração. Recomenda-se revisão antes do protocolo.`;
}
