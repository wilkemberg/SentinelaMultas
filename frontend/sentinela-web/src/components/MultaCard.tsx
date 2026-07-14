"use client";

import { useState } from "react";
import { Multa, StatusRecurso, apiMultas } from "@/lib/api";
import { gerarDefesaLocal } from "@/lib/defesaTemplate";
import Spotlight from "@/components/Spotlight";
import { Scale, CheckCircle2, XCircle, FileWarning, Search, Landmark, CarFront, Navigation, ChevronDown, Activity, FileText, Check, ShieldAlert, ShieldCheck, Sparkles, FileImage, Receipt, ExternalLink, CalendarClock, Radar } from "lucide-react";

const GRAVIDADE_MAP: Record<string, { label: string; cor: string; bg: string }> = {
  Leve: { label: "Leve", cor: "#16A34A", bg: "rgba(22, 163, 74, 0.1)" },
  Media: { label: "Média", cor: "#D97706", bg: "rgba(217, 119, 6, 0.1)" },
  Grave: { label: "Grave", cor: "#EA580C", bg: "rgba(234, 88, 12, 0.1)" },
  Gravissima: { label: "Gravíssima", cor: "#DC2626", bg: "rgba(220, 38, 38, 0.1)" },
};

const STATUS_MAP: Record<StatusRecurso, { label: string; bg: string; text: string; icon: any }> = {
  NaoAvaliado: { label: "Não avaliado", bg: "rgba(100,116,139,0.1)", text: "#64748B", icon: Search },
  RecursoViavel: { label: "Recurso viável", bg: "rgba(217,119,6,0.12)", text: "#D97706", icon: Scale },
  RecursoNaoRecomendado: { label: "Sem recurso", bg: "rgba(100,116,139,0.1)", text: "#64748B", icon: XCircle },
  DefesaGerada: { label: "Defesa pronta", bg: "rgba(22,163,74,0.12)", text: "#16A34A", icon: FileText },
  Protocolado: { label: "Protocolado", bg: "rgba(22,163,74,0.1)", text: "#16A34A", icon: Activity },
  Deferido: { label: "Deferido", bg: "rgba(22,163,74,0.15)", text: "#16A34A", icon: CheckCircle2 },
  Indeferido: { label: "Indeferido", bg: "rgba(220,38,38,0.12)", text: "#DC2626", icon: XCircle },
};

const ORGAO_MAP: Record<string, any> = {
  "DETRAN-RJ": Landmark,
  "CET-RIO": Navigation,
  "PRF": CarFront,
};

interface Props {
  multa: Multa;
  expanded?: boolean;
  onUpdate?: () => void;
}

export default function MultaCard({ multa, expanded = false, onUpdate }: Props) {
  const [aberta, setAberta] = useState(expanded);
  const [gerandoDefesa, setGerandoDefesa] = useState(false);
  const [textoDefesa, setTextoDefesa] = useState(multa.textoDefesa ?? null);
  const [copiado, setCopiado] = useState(false);

  const grav = GRAVIDADE_MAP[multa.gravidade] ?? { label: multa.gravidade, cor: "#64748B", bg: "rgba(100,116,139,0.1)" };
  const status = STATUS_MAP[multa.status] ?? STATUS_MAP.NaoAvaliado;
  const OrgaoIcon = ORGAO_MAP[multa.orgaoAutuador] ?? FileWarning;
  const StatusIcon = status.icon;
  const prazo = multa.diasParaPrazo;
  const vencida = prazo !== null && prazo !== undefined && prazo < 0;
  const prazoUrgente = !vencida && prazo !== null && prazo !== undefined && prazo <= 7;

  // Quais fontes (SERPRO/RADAR, DETRAN-RJ) confirmaram esta multa nesta
  // verificação. Multas antigas (antes desse campo existir) vêm sem essa
  // informação — nesse caso simplesmente não mostramos o selo.
  const fontes = (multa.fontesConfirmacao ?? "").split(",").map((f) => f.trim()).filter(Boolean);
  const confirmadaEmDuasFontes = fontes.length >= 2;

  const formatData = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

  const gerarDefesa = async () => {
    setGerandoDefesa(true);
    try {
      // Infrações de demonstração (sem registro real no backend) usam o
      // gerador local, com os mesmos dados da infração e a mesma estrutura
      // formal (Preâmbulo / Dos Fatos / Do Direito / Do Pedido) do motor de IA.
      if (multa.id.startsWith("mock-")) {
        await new Promise((resolve) => setTimeout(resolve, 900));
        setTextoDefesa(gerarDefesaLocal(multa));
      } else {
        const res: any = await apiMultas.gerarDefesa(multa.id);
        setTextoDefesa(res.textoDefesa ?? "");
        onUpdate?.();
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setGerandoDefesa(false);
    }
  };

  const copiarDefesa = () => {
    if (!textoDefesa) return;
    navigator.clipboard.writeText(textoDefesa);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <Spotlight
      className={`relative rounded-2xl card overflow-hidden ${aberta ? "" : "card-hover"}`}
      style={{ ["--glow-color" as any]: `${grav.cor}40` }}
    >
      {/* Faixa de severidade lateral */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: grav.cor }} />

      {/* Mancha de cor sutil no canto — dá identidade própria ao card, ligada à gravidade */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-[0.14] pointer-events-none"
        style={{ backgroundColor: grav.cor }}
      />

      {/* Header do card */}
      <button onClick={() => setAberta((a) => !a)} className="w-full pl-6 pr-5 py-5 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-asfalto shrink-0">
              <OrgaoIcon className="w-5 h-5 text-nevoa" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold leading-tight line-clamp-2 text-texto">
                {multa.descricaoInfracao}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-nevoa">
                <span>{multa.orgaoAutuador}</span>
                <span className="text-borda">|</span>
                <span>{formatData(multa.dataInfracao)}</span>
                {multa.placaVeiculo && (
                  <>
                    <span className="text-borda">|</span>
                    <span className="font-mono text-[11px] text-verdeSinal bg-verdeSinal/10 px-1.5 rounded">{multa.placaVeiculo}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!aberta && vencida && (
              <span className="font-display text-[11px] font-bold rounded-full px-2 py-1 bg-vermelhoSinal/12 text-vermelhoSinal">
                Vencida
              </span>
            )}
            {!aberta && multa.chanceRecursoPercent !== null && multa.chanceRecursoPercent !== undefined && (
              <span
                className="font-display text-[11px] font-bold rounded-full px-2 py-1"
                style={{
                  color: multa.chanceRecursoPercent >= 60 ? "#16A34A" : multa.chanceRecursoPercent >= 30 ? "#D97706" : "#DC2626",
                  background: multa.chanceRecursoPercent >= 60 ? "rgba(22,163,74,0.1)" : multa.chanceRecursoPercent >= 30 ? "rgba(217,119,6,0.1)" : "rgba(220,38,38,0.1)",
                }}
                title="Probabilidade de sucesso no recurso"
              >
                {multa.chanceRecursoPercent.toFixed(0)}%
              </span>
            )}
            <ChevronDown className="w-4 h-4 text-nevoaClara transition-transform duration-300" style={{ transform: aberta ? "rotate(180deg)" : "rotate(0deg)" }} />
          </div>
        </div>

        {/* Pills de status */}
        <div className="flex flex-wrap items-center gap-2 mt-4 ml-12 pl-1">
          <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: grav.bg, color: grav.cor }}>
            {grav.label}
          </span>
          <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: status.bg, color: status.text }}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
          {vencida && (
            <span className="flex items-center gap-1 rounded-full bg-vermelhoSinal/12 px-2.5 py-1 text-[11px] font-semibold text-vermelhoSinal">
              <ShieldAlert className="w-3 h-3" />
              Prazo expirado
            </span>
          )}
          {prazoUrgente && (
            <span className="flex items-center gap-1 rounded-full bg-vermelhoSinal/12 px-2.5 py-1 text-[11px] font-semibold text-vermelhoSinal">
              <ShieldAlert className="w-3 h-3" />
              {prazo}d restantes
            </span>
          )}
          {fontes.length > 0 && (
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                confirmadaEmDuasFontes
                  ? "bg-verdeSinal/12 text-verdeSinal"
                  : "bg-azulMercosul/10 text-azulMercosul"
              }`}
              title={`Encontrada em: ${fontes.join(", ")}`}
            >
              <Radar className="w-3 h-3" />
              {confirmadaEmDuasFontes ? "Confirmada em 2 fontes" : `Só no ${fontes[0]}`}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 ml-12 pl-1">
          <span className="font-display text-lg font-bold tracking-tight" style={{ color: grav.cor }}>
            R$ {multa.valor.toFixed(2)}
          </span>
          <span className="text-xs text-nevoa">{multa.pontos} ponto{multa.pontos !== 1 ? "s" : ""}</span>
        </div>
      </button>

      {/* Detalhe expandido */}
      <div className={`transition-all duration-300 ease-in-out origin-top overflow-hidden ${aberta ? "max-h-[1500px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="border-t border-borda px-6 pb-6 pt-4 space-y-5">
          {/* Artigo e auto */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-asfalto p-3">
              <p className="text-[11px] text-nevoa">Número do auto</p>
              <p className="font-mono text-xs text-texto mt-1">{multa.numeroAutoInfracao}</p>
            </div>
            <div className="rounded-xl bg-asfalto p-3">
              <p className="text-[11px] text-nevoa">Enquadramento CTB</p>
              <p className="font-mono text-xs text-texto mt-1">{multa.artigoCtb || multa.codigoInfracaoCtb || "—"}</p>
            </div>
          </div>

          {/* Data real da infração x data em que o Sentinela encontrou a multa.
              São propositalmente separadas: a infração pode ter ocorrido dias
              antes de aparecer no RENAINF, então o condutor precisa distinguir
              "quando aconteceu" de "quando o app descobriu". */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-asfalto p-3">
              <p className="text-[11px] text-nevoa">Data da infração</p>
              <p className="text-xs text-texto mt-1">{formatData(multa.dataInfracao)}</p>
            </div>
            <div className="rounded-xl bg-asfalto p-3">
              <p className="text-[11px] text-nevoa flex items-center gap-1">
                <CalendarClock className="w-3 h-3" /> Encontrada pelo Sentinela em
              </p>
              <p className="text-xs text-texto mt-1">{formatData(multa.detectadaEm)}</p>
            </div>
          </div>

          {/* Análise da IA */}
          {multa.analiseIa && (
            <div className="rounded-xl bg-verdeSinal/[0.05] border border-verdeSinal/20 p-4">
              <p className="text-xs font-semibold text-verdeSinal mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Análise do Sentinela AI
              </p>
              <p className="text-[13px] leading-relaxed text-texto/80 whitespace-pre-wrap">{multa.analiseIa}</p>
            </div>
          )}

          {/* Chance de recurso */}
          {multa.chanceRecursoPercent !== null && multa.chanceRecursoPercent !== undefined && (
            <div className="bg-asfalto rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-nevoa">Probabilidade de sucesso</p>
                <span
                  className="font-display text-lg font-bold"
                  style={{ color: multa.chanceRecursoPercent >= 60 ? "#16A34A" : multa.chanceRecursoPercent >= 30 ? "#D97706" : "#DC2626" }}
                >
                  {multa.chanceRecursoPercent.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-borda overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${multa.chanceRecursoPercent}%`,
                    background:
                      multa.chanceRecursoPercent >= 60 ? "linear-gradient(90deg, #16A34A, #15803D)" :
                      multa.chanceRecursoPercent >= 30 ? "linear-gradient(90deg, #D97706, #B45309)" : "linear-gradient(90deg, #DC2626, #B91C1C)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Documentos originais (quando a consulta retorna os links) */}
          {(multa.autuacaoPdfUrl || multa.boletoPdfUrl) && (
            <div className="flex flex-wrap gap-2">
              {multa.autuacaoPdfUrl && (
                <a
                  href={multa.autuacaoPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-asfalto px-3 py-2 text-xs font-medium text-texto hover:text-verdeSinal transition-colors"
                >
                  <FileImage className="w-3.5 h-3.5" /> Ver auto de infração <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}
              {multa.boletoPdfUrl && (
                <a
                  href={multa.boletoPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-asfalto px-3 py-2 text-xs font-medium text-texto hover:text-verdeSinal transition-colors"
                >
                  <Receipt className="w-3.5 h-3.5" /> Ver boleto <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}
            </div>
          )}

          {/* Onde recorrer */}
          {multa.ondeRecorrer && (
            <div>
              <p className="text-xs font-semibold text-nevoa mb-1.5 flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5" /> Instruções de recurso</p>
              <p className="text-sm text-nevoa leading-relaxed pl-5 border-l-2 border-borda">{multa.ondeRecorrer}</p>
            </div>
          )}

          {/* Prazo */}
          {multa.prazoDefesaPrevia && (
            <div className="rounded-xl bg-asfalto px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-nevoa">Prazo limite (defesa prévia)</p>
              <p className={`text-sm font-semibold ${prazoUrgente || vencida ? "text-vermelhoSinal" : "text-texto"}`}>
                {formatData(multa.prazoDefesaPrevia)}
                {vencida && <span className="ml-1 opacity-70 font-normal">(vencido há {Math.abs(prazo!)}d)</span>}
                {!vencida && prazo !== null && prazo !== undefined && <span className="ml-1 opacity-70 font-normal">({prazo}d)</span>}
              </p>
            </div>
          )}

          {/* Prazo vencido: recurso não é mais possível, só resta pagamento */}
          {vencida ? (
            <div className="rounded-xl border border-vermelhoSinal/25 bg-vermelhoSinal/[0.06] p-4">
              <p className="text-xs font-semibold text-vermelhoSinal mb-1.5 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> Prazo de defesa prévia expirado
              </p>
              <p className="text-sm text-nevoa leading-relaxed">
                Não é mais possível apresentar defesa prévia para esta infração — o prazo já venceu. Restam apenas o
                pagamento (com desconto, se elegível) ou, quando aplicável, as fases seguintes de recurso (JARI/CETRAN).
              </p>
            </div>
          ) : (
            /* Botão gerar defesa */
            multa.status !== "RecursoNaoRecomendado" && !textoDefesa && (
              <button
                onClick={gerarDefesa}
                disabled={gerandoDefesa}
                className="w-full rounded-xl bg-verdeSinal/10 border border-verdeSinal/25 py-3.5 text-sm font-semibold text-verdeSinal hover:bg-gradient-to-b hover:from-verdeSinal hover:to-verdeSinal/90 hover:text-white hover:border-transparent hover:shadow-[0_10px_28px_-8px_rgba(22,163,74,0.55)] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {gerandoDefesa ? (
                  <><Activity className="w-4 h-4 animate-pulse" /> Gerando defesa...</>
                ) : (
                  <><FileText className="w-4 h-4" /> Gerar defesa com Sentinela AI</>
                )}
              </button>
            )
          )}

          {/* Texto da defesa */}
          {textoDefesa && (
            <div className="rounded-xl border border-verdeSinal/20 bg-verdeSinal/[0.04] p-4">
              <div className="flex items-center justify-between mb-3 border-b border-verdeSinal/15 pb-3">
                <p className="text-xs font-semibold text-verdeSinal flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Defesa gerada
                </p>
                <button
                  onClick={copiarDefesa}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    copiado ? "bg-verdeSinal text-white" : "bg-texto/10 text-texto hover:bg-texto/15"
                  }`}
                >
                  {copiado ? <Check className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                  {copiado ? "Copiado!" : "Copiar texto"}
                </button>
              </div>
              <pre className="text-[13px] text-texto/80 leading-relaxed whitespace-pre-wrap font-body max-h-60 overflow-y-auto pr-2">
                {textoDefesa}
              </pre>
            </div>
          )}

          {/* Onde obter desconto */}
          {multa.ondeObterDesconto && (
            <div className="rounded-xl bg-ambarSinal/[0.06] border border-ambarSinal/20 p-4">
              <p className="text-xs font-semibold text-ambarSinal mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Opção de pagamento com desconto
              </p>
              <p className="text-sm text-nevoa leading-relaxed pl-5 border-l-2 border-ambarSinal/25">{multa.ondeObterDesconto}</p>
            </div>
          )}

          {/* Como evitar */}
          {multa.comoEvitarNoFuturo && (
            <div className="border-l-2 border-verdeSinal/25 pl-3 pt-1">
              <p className="text-xs font-semibold text-nevoa mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-verdeSinal" /> Como evitar no futuro
              </p>
              <p className="text-sm text-nevoa leading-relaxed">{multa.comoEvitarNoFuturo}</p>
            </div>
          )}
        </div>
      </div>
    </Spotlight>
  );
}
