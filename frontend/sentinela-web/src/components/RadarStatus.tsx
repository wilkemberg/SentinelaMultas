"use client";

import { ShieldCheck, AlertTriangle, RefreshCw, CheckCircle2, Clock, Mail } from "lucide-react";

// Mockup do produto exibido no hero da landing page — espelha o visual real
// do painel (cards claros, glassmorphism, cores verdeSinal/vermelhoSinal),
// não um terminal escuro. Antes deste componente assumia um fundo preto
// (bg-black/40 etc.), que ficava quebrado desde que o tema padrão do app
// virou o claro "SaaS premium" — por isso a reescrita completa.
type Status = "sem-multa" | "com-multa" | "verificando";

interface RadarStatusProps {
  placa: string;
  status: Status;
  ultimaVerificacao?: string;
  orgaos?: string[];
}

export default function RadarStatus({
  placa,
  status,
  ultimaVerificacao,
  orgaos = ["SERPRO/RADAR"],
}: RadarStatusProps) {
  const isOk = status === "sem-multa";
  const isPending = status === "verificando";

  const corTexto = isOk ? "text-verdeSinal" : status === "com-multa" ? "text-vermelhoSinal" : "text-ambarSinal";
  const corBg = isOk ? "bg-verdeSinal/10" : status === "com-multa" ? "bg-vermelhoSinal/10" : "bg-ambarSinal/10";
  const corBorda = isOk ? "border-verdeSinal/25" : status === "com-multa" ? "border-vermelhoSinal/25" : "border-ambarSinal/25";
  const corBar = isOk ? "bg-verdeSinal" : status === "com-multa" ? "bg-vermelhoSinal" : "bg-ambarSinal";

  const label = isOk ? "Nenhuma multa encontrada" : status === "com-multa" ? "1 multa detectada" : "Verificando agora...";
  const IconStatus = isOk ? ShieldCheck : status === "com-multa" ? AlertTriangle : RefreshCw;

  return (
    <div className="relative w-full sm:w-[360px]">
      <div className="card rounded-3xl p-6 overflow-hidden">
        <div className={`absolute top-0 left-0 right-0 h-[3px] ${corBar}`} />

        {/* Cabeçalho: placa monitorada */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-mono text-nevoa uppercase tracking-[0.2em] mb-1.5">
              Veículo monitorado
            </p>
            <p className="font-display text-2xl font-bold tracking-[0.1em] text-texto">{placa}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${corBg} ${corBorda}`}>
            <IconStatus className={`h-5 w-5 ${corTexto} ${isPending ? "animate-spin" : ""}`} />
          </div>
        </div>

        {/* Status principal */}
        <div className={`flex items-center gap-2.5 justify-center rounded-xl py-3 mb-5 border ${corBg} ${corBorda}`}>
          <IconStatus className={`h-4 w-4 ${corTexto} ${isPending ? "animate-spin" : ""}`} />
          <span className={`text-sm font-semibold ${corTexto}`}>{label}</span>
        </div>

        {/* Fontes verificadas */}
        <div className="space-y-2 mb-5">
          <p className="text-[10px] font-mono text-nevoa uppercase tracking-[0.15em] mb-2.5">
            Fontes verificadas hoje
          </p>
          {orgaos.map((o) => (
            <div key={o} className="flex items-center justify-between rounded-lg bg-asfalto px-3 py-2.5">
              <span className="text-xs font-medium text-texto">{o}</span>
              <div className="flex items-center gap-1.5 text-verdeSinal">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="text-[11px] font-semibold">Consultado</span>
              </div>
            </div>
          ))}
        </div>

        {/* Última verificação */}
        {ultimaVerificacao && (
          <div className="flex items-center justify-center gap-2 pt-4 border-t border-borda">
            <Clock className="w-3.5 h-3.5 text-nevoaClara" />
            <p className="text-center text-[11px] text-nevoa">Última verificação: {ultimaVerificacao}</p>
          </div>
        )}
      </div>

      {/* Toast flutuante — reforça a notificação por e-mail/WhatsApp sem
          poluir o card principal, um recurso comum em landing pages premium. */}
      <div className="hidden sm:flex absolute -bottom-6 -left-8 items-center gap-3 card rounded-2xl px-4 py-3 shadow-lg animate-float">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-azulMercosul/10 text-azulMercosul shrink-0">
          <Mail className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-semibold text-texto">E-mail enviado</p>
          <p className="text-[11px] text-nevoa">com PDF detalhado em anexo</p>
        </div>
      </div>
    </div>
  );
}
