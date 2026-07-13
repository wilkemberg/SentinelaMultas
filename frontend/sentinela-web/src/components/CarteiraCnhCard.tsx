"use client";

import { useState } from "react";
import { PontuacaoCnh, apiUsuarios } from "@/lib/api";
import { IdCard, ShieldCheck, ShieldAlert, AlertTriangle, Briefcase, GraduationCap, Info, CalendarClock } from "lucide-react";

const NIVEL_MAP: Record<string, { label: string; cor: string; icon: any }> = {
  Regular: { label: "Regular", cor: "#16A34A", icon: ShieldCheck },
  Atencao: { label: "Atenção", cor: "#D97706", icon: AlertTriangle },
  Risco: { label: "Risco de Suspensão", cor: "#DC2626", icon: ShieldAlert },
};

const GRAVIDADE_COR: Record<string, string> = {
  Leve: "#16A34A",
  Media: "#D97706",
  Grave: "#EA580C",
  Gravissima: "#DC2626",
};

interface Props {
  pontuacao: PontuacaoCnh;
  nomeCondutor?: string;
  onUpdate?: () => void;
}

export default function CarteiraCnhCard({ pontuacao, nomeCondutor, onUpdate }: Props) {
  const [salvando, setSalvando] = useState(false);

  const nivel = NIVEL_MAP[pontuacao.nivelStatus] ?? NIVEL_MAP.Regular;
  const NivelIcon = nivel.icon;

  const raio = 70;
  const circunferencia = 2 * Math.PI * raio;
  const progresso = Math.min(pontuacao.percentualDoLimite, 100) / 100;
  const offset = circunferencia * (1 - progresso);

  const alternarAtividadeRemunerada = async () => {
    setSalvando(true);
    try {
      await apiUsuarios.atualizar({ atividadeRemunerada: !pontuacao.atividadeRemunerada });
      onUpdate?.();
    } catch (e: any) {
      alert(e.message ?? "Erro ao atualizar");
    } finally {
      setSalvando(false);
    }
  };

  const formatData = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="rounded-3xl card relative overflow-hidden">
      <div
        className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ backgroundColor: nivel.cor }}
      />

      {/* Header estilo carteira */}
      <div className="relative z-10 p-6 md:p-8 border-b border-borda flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-azulMercosul/10">
            <IdCard className="w-7 h-7 text-azulMercosul" />
          </div>
          <div>
            <p className="text-xs text-nevoa">Carteira Nacional de Habilitação</p>
            <h2 className="font-display text-2xl font-bold text-texto mt-1">{nomeCondutor ?? "Condutor"}</h2>
          </div>
        </div>

        {/* Toggle atividade remunerada */}
        <button
          onClick={alternarAtividadeRemunerada}
          disabled={salvando}
          className={`flex w-full md:w-auto items-center gap-3 rounded-2xl border px-4 py-3 transition-all disabled:opacity-50 ${
            pontuacao.atividadeRemunerada
              ? "bg-cyanReal/10 border-cyanReal/40 text-cyanReal"
              : "bg-surface border-borda text-nevoa hover:border-nevoaClara"
          }`}
        >
          <Briefcase className="w-4 h-4 flex-shrink-0" />
          <span className="text-left">
            <span className="block text-[11px] opacity-70">Atividade remunerada</span>
            <span className="block text-sm font-bold">
              {pontuacao.atividadeRemunerada ? "Sim — limite 40 pts" : "Não — toque para marcar"}
            </span>
          </span>
          <span
            className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
              pontuacao.atividadeRemunerada ? "bg-cyanReal" : "bg-borda"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                pontuacao.atividadeRemunerada ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </span>
        </button>
      </div>

      {/* Corpo: gauge + status */}
      <div className="relative z-10 p-6 md:p-8 grid md:grid-cols-[auto_1fr] gap-8 items-center">
        {/* Gauge circular */}
        <div className="relative w-44 h-44 mx-auto flex-shrink-0">
          <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
            <circle cx="80" cy="80" r={raio} fill="none" stroke="currentColor" strokeWidth="12" className="text-borda" />
            <circle
              cx="80"
              cy="80"
              r={raio}
              fill="none"
              stroke={nivel.cor}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circunferencia}
              strokeDashoffset={offset}
              style={{
                transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-4xl font-bold text-texto">{pontuacao.pontosAtuais}</span>
            <span className="text-xs text-nevoa">de {pontuacao.limiteAplicavel} pts</span>
          </div>
        </div>

        {/* Status + detalhes */}
        <div>
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold mb-4"
            style={{ color: nivel.cor, background: `${nivel.cor}1A` }}
          >
            <NivelIcon className="w-4 h-4" /> {nivel.label}
          </div>

          <p className="text-sm text-nevoaClara mb-6 max-w-md">
            {pontuacao.nivelStatus === "Risco"
              ? "O limite de pontos foi atingido. Há risco de suspensão do direito de dirigir — procure orientação sobre o processo administrativo."
              : `Faltam ${pontuacao.pontosRestantesParaSuspensao} pontos para atingir o limite de suspensão nos próximos 12 meses.`}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-xl bg-asfalto px-4 py-3">
              <p className="text-[11px] text-nevoaClara mb-1">Infrações gravíssimas</p>
              <p className="font-display text-lg font-bold text-texto">{pontuacao.infracoesGravissimasNoPeriodo}</p>
            </div>
            <div className="rounded-xl bg-asfalto px-4 py-3">
              <p className="text-[11px] text-nevoaClara mb-1">Limite aplicável</p>
              <p className="font-display text-lg font-bold text-texto">{pontuacao.limiteAplicavel} pts</p>
            </div>
          </div>

          {pontuacao.elegivelReciclagemPreventiva && (
            <div className="flex items-start gap-3 rounded-xl bg-ambarSinal/10 border border-ambarSinal/30 px-4 py-3 mb-4">
              <GraduationCap className="w-5 h-5 text-ambarSinal flex-shrink-0 mt-0.5" />
              <p className="text-xs text-texto/80">
                Você atingiu 30+ pontos. Por exercer atividade remunerada, pode fazer o <strong>curso preventivo de reciclagem</strong>{" "}
                para neutralizar o excesso antes da suspensão (facultativo).
              </p>
            </div>
          )}

          <div className="flex items-start gap-2 text-[11px] text-nevoa">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              Baseado apenas nas multas com pontuação monitoradas pelo Sentinela nos veículos cadastrados. Não substitui o
              extrato oficial de pontos vinculado ao seu CPF/CNH.
            </span>
          </div>
        </div>
      </div>

      {/* Lista de multas que compõem a pontuação */}
      <div className="relative z-10 border-t border-borda">
        <div className="px-6 md:px-8 py-4">
          <h3 className="font-display text-sm font-bold text-texto flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-nevoa" /> Pontos na janela de 12 meses
          </h3>
        </div>
        {pontuacao.multasConsideradas.length === 0 ? (
          <p className="px-6 md:px-8 pb-6 text-sm text-nevoaClara">Nenhuma multa com pontos na janela atual. Pontuação zerada.</p>
        ) : (
          <div className="divide-y divide-borda">
            {pontuacao.multasConsideradas.map((m) => (
              <div key={m.multaId} className="px-6 md:px-8 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-texto/90 truncate">{m.descricaoInfracao}</p>
                  <p className="text-[11px] text-nevoa mt-1">
                    {m.artigoCtb} · Expira em {formatData(m.dataExpiracao)}
                  </p>
                </div>
                <span
                  className="flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    background: `${GRAVIDADE_COR[m.gravidade] ?? "#939fb2"}1A`,
                    color: GRAVIDADE_COR[m.gravidade] ?? "#939fb2",
                  }}
                >
                  +{m.pontos} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
