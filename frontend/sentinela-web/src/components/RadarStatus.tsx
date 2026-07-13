"use client";

import { ShieldCheck, AlertTriangle, RefreshCw, CheckCircle, Clock } from "lucide-react";

// Componente visual RadarStatus — exibe o card animado na landing page
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
  orgaos = ["DETRAN-RJ", "CET-Rio", "PRF"],
}: RadarStatusProps) {
  const isOk = status === "sem-multa";
  const isPending = status === "verificando";
  
  // Usando as cores do tailwind.config
  const corHex = isOk ? "#00E573" : status === "com-multa" ? "#FF3355" : "#FFB900";
  const statusColorClass = isOk ? "text-verdeSinal" : status === "com-multa" ? "text-vermelhoSinal" : "text-ambarSinal";
  const bgGlowClass = isOk ? "bg-verdeSinal/10" : status === "com-multa" ? "bg-vermelhoSinal/10" : "bg-ambarSinal/10";
  const borderClass = isOk ? "border-verdeSinal/30" : status === "com-multa" ? "border-vermelhoSinal/30" : "border-ambarSinal/30";

  const label = isOk ? "SEM MULTAS" : status === "com-multa" ? "MULTA DETECTADA" : "VERIFICANDO...";
  const IconStatus = isOk ? ShieldCheck : status === "com-multa" ? AlertTriangle : RefreshCw;

  return (
    <div className={`relative w-full sm:w-80 glass-panel rounded-3xl p-6 overflow-hidden ${isPending ? 'animate-pulse' : ''}`}>
      {/* Background glow interno */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full pointer-events-none ${bgGlowClass}`} />

      {/* Header do card */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <p className="text-[10px] font-mono text-nevoa uppercase tracking-[0.2em] mb-1">Veículo Monitorado</p>
          <p className={`font-display text-2xl font-bold tracking-[0.12em] ${statusColorClass} ${isOk ? 'neon-text-verde' : status === 'com-multa' ? 'neon-text-vermelho' : 'neon-text-ambar'}`}>
            {placa}
          </p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${bgGlowClass} ${borderClass}`}>
          <IconStatus className={`h-6 w-6 ${statusColorClass} ${isPending ? 'animate-spin' : ''}`} />
        </div>
      </div>

      {/* Status principal */}
      <div className={`flex items-center justify-center rounded-xl py-3 mb-6 bg-black/40 border ${borderClass} relative z-10 shadow-inner`}>
        <span className={`font-mono text-xs font-bold tracking-widest ${statusColorClass}`}>
          {label}
        </span>
      </div>

      {/* Órgãos verificados */}
      <div className="space-y-2 relative z-10">
        <p className="text-[10px] font-mono text-nevoa uppercase tracking-[0.15em] mb-3">Conexões Ativas</p>
        {orgaos.map((o) => (
          <div
            key={o}
            className="flex items-center justify-between rounded-lg bg-black/30 border border-white/5 px-3 py-2.5"
          >
            <span className="text-xs font-mono text-nevoaClara">{o}</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle className={`h-3 w-3 ${statusColorClass}`} />
              <span className={`text-[10px] font-bold ${statusColorClass}`}>
                {isOk ? "SYNC OK" : "PENDENTE"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Última verificação */}
      {ultimaVerificacao && (
        <div className="mt-6 flex items-center justify-center gap-2 pt-4 border-t border-white/10 relative z-10">
          <Clock className="w-3 h-3 text-nevoa" />
          <p className="text-center text-[10px] font-mono text-nevoa">
            Último ping: {ultimaVerificacao}
          </p>
        </div>
      )}
      
      {/* Scanline Overlay */}
      <div className="scanlines absolute inset-0 opacity-20 pointer-events-none rounded-3xl" />
    </div>
  );
}
