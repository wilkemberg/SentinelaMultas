"use client";

import { User, QrCode, ShieldCheck, BadgeCheck } from "lucide-react";
import { CnhValidadeInfo } from "@/lib/api";

interface Props {
  nome?: string;
  cpf?: string | null;
  numeroRegistroCnh?: string | null;
  categoriaCnh?: string | null;
  dataExpedicaoCnh?: string | null;
  validade?: CnhValidadeInfo | null;
  situacaoCnh?: string | null;
  cnhValidadaEm?: string | null;
}

function formatCpf(cpf?: string | null) {
  if (!cpf) return "•••.•••.•••-••";
  const d = cpf.replace(/\D/g, "");
  if (d.length < 11) return "•••.•••.•••-••";
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

function formatData(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

const STATUS_MAP: Record<string, { label: string; cor: string }> = {
  Regular: { label: "Válida", cor: "#00e573" },
  Atencao: { label: "Vence em breve", cor: "#ffb900" },
  Vencida: { label: "Vencida", cor: "#ff3355" },
};

export default function CnhDocumentVisual({
  nome,
  cpf,
  numeroRegistroCnh,
  categoriaCnh,
  dataExpedicaoCnh,
  validade,
  situacaoCnh,
  cnhValidadaEm,
}: Props) {
  const statusInfo = validade ? STATUS_MAP[validade.nivelStatus] : null;
  const situacaoIrregular = !!situacaoCnh && situacaoCnh.toLowerCase() !== "regular";

  return (
    <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.55)] border border-white/10">
      {/* Fundo estilo documento oficial (teal/azul, evocando o modelo Renach) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b3d3a] via-[#0c3050] to-[#081a2e]" />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 9px)",
        }}
      />
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-verdeSinal/25 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full bg-azulMercosul/30 blur-3xl pointer-events-none" />
      {/* Faixa verde-amarela discreta, referência à bandeira nos documentos oficiais */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-verdeSinal via-ambarSinal to-azulMercosul" />

      <div className="relative z-10 p-6">
        {/* Topo */}
        <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-4">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-white/60 uppercase">República Federativa do Brasil</p>
            <p className="font-display text-base font-bold text-white tracking-wide mt-1">
              Carteira Nacional de Habilitação
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <ShieldCheck className="w-7 h-7 text-verdeSinal" />
            {cnhValidadaEm && (
              <span className="inline-flex items-center gap-1 rounded-full bg-verdeSinal/15 border border-verdeSinal/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-verdeSinal whitespace-nowrap">
                <BadgeCheck className="w-3 h-3" /> Verificado SENATRAN
              </span>
            )}
          </div>
        </div>

        {situacaoIrregular && (
          <div className="mb-4 -mt-1 rounded-lg bg-[#ff3355]/15 border border-[#ff3355]/30 px-3 py-2 text-xs font-semibold text-[#ff3355]">
            Situação junto ao SENATRAN: {situacaoCnh}
          </div>
        )}

        <div className="grid grid-cols-[auto_1fr] gap-4">
          {/* Foto */}
          <div className="w-20 h-24 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
            <User className="w-10 h-10 text-white/40" />
          </div>

          <div className="space-y-3 min-w-0">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/50">Nome</p>
              <p className="text-base font-semibold text-white truncate">{nome || "—"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-white/50">CPF</p>
                <p className="text-sm font-mono text-white">{formatCpf(cpf)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-white/50">Categoria</p>
                <p className="text-sm font-mono text-white">{categoriaCnh || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/15">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-white/50">Nº Registro</p>
            <p className="text-sm font-mono text-white">{numeroRegistroCnh || "—"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-white/50">Expedição</p>
            <p className="text-sm font-mono text-white">{formatData(dataExpedicaoCnh)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-white/50">Validade</p>
            <p className="text-sm font-mono font-bold" style={{ color: statusInfo?.cor ?? "#fff" }}>
              {validade ? formatData(validade.dataValidade) : "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-5 pt-3 border-t border-white/10">
          <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest">
            {cnhValidadaEm
              ? `Verificado em ${formatData(cnhValidadaEm)}`
              : "Sentinela.AI · documento ilustrativo"}
          </span>
          <QrCode className="w-6 h-6 text-white/30" />
        </div>
      </div>
    </div>
  );
}
