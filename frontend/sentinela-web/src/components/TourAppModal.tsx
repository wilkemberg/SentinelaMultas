"use client";

import { useState } from "react";
import {
  PartyPopper,
  CarFront,
  FileWarning,
  IdCard,
  Bell,
  UserRound,
  X,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface Props {
  nome?: string;
  onFechar: () => void;
}

// Classes Tailwind precisam existir como strings literais completas no
// código-fonte para o scanner do Tailwind conseguir gerar o CSS — por isso um
// mapa fixo em vez de montar `bg-${cor}/10` dinamicamente (isso não seria
// detectado e a cor simplesmente não apareceria no build).
const CORES: Record<string, { bg: string; text: string }> = {
  verdeSinal: { bg: "bg-verdeSinal/10", text: "text-verdeSinal" },
  azulMercosul: { bg: "bg-azulMercosul/10", text: "text-azulMercosul" },
  ambarSinal: { bg: "bg-ambarSinal/10", text: "text-ambarSinal" },
  roxoPremium: { bg: "bg-roxoPremium/10", text: "text-roxoPremium" },
  vermelhoSinal: { bg: "bg-vermelhoSinal/10", text: "text-vermelhoSinal" },
  cyanReal: { bg: "bg-cyanReal/10", text: "text-cyanReal" },
};

const PASSOS = [
  {
    icon: PartyPopper,
    cor: "verdeSinal",
    titulo: "Perfil pronto!",
    corpo:
      "Você acabou de configurar o Sentinela — ótima escolha começar monitorando sua frota logo de cara. Aqui vai um tour rápido de 30 segundos pelo que preparamos para você.",
  },
  {
    icon: CarFront,
    cor: "azulMercosul",
    titulo: "Frota",
    corpo:
      "Cadastre carros e motos por placa e RENAVAM. A varredura roda sozinha todos os dias às 10:00 — você não precisa ficar consultando nada manualmente.",
  },
  {
    icon: FileWarning,
    cor: "ambarSinal",
    titulo: "Infrações",
    corpo:
      "Toda multa encontrada já vem com a análise da nossa IA: chance real de recurso, prazo de defesa e até o texto de defesa pronto para usar.",
  },
  {
    icon: IdCard,
    cor: "roxoPremium",
    titulo: "CNH",
    corpo:
      "Acompanhe sua pontuação e o risco de suspensão em tempo real, já aplicando a regra de 20/30/40 pontos da Lei 14.071/2020.",
  },
  {
    icon: Bell,
    cor: "vermelhoSinal",
    titulo: "Notificações",
    corpo:
      "Alertas automáticos por e-mail (com PDF detalhado em anexo) e WhatsApp assim que uma nova multa é detectada.",
  },
  {
    icon: UserRound,
    cor: "cyanReal",
    titulo: "Minha Conta",
    corpo:
      "Seus dados — nome, CPF, WhatsApp — ficam guardados ali no avatar, no rodapé do menu. Clique nele sempre que precisar atualizar algo.",
  },
] as const;

export default function TourAppModal({ nome, onFechar }: Props) {
  const [passo, setPasso] = useState(0);
  const ultimo = passo === PASSOS.length - 1;
  const atual = PASSOS[passo];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 drawer-overlay animate-fade-in" onClick={onFechar} />

      <div className="relative z-10 w-full max-w-md card !rounded-3xl p-7 shadow-2xl animate-scale-in">
        <button
          onClick={onFechar}
          className="absolute top-5 right-5 text-nevoaClara hover:text-vermelhoSinal transition-colors bg-asfalto hover:bg-vermelhoSinal/10 p-1.5 rounded-lg"
          aria-label="Fechar tour"
        >
          <X className="w-4 h-4" />
        </button>

        <div className={`w-14 h-14 rounded-2xl ${CORES[atual.cor].bg} flex items-center justify-center mb-5`}>
          <atual.icon className={`w-7 h-7 ${CORES[atual.cor].text}`} />
        </div>

        {passo === 0 && nome && (
          <p className="text-sm text-nevoa mb-1">Olá, {nome.split(" ")[0]}</p>
        )}
        <h2 className="font-display text-xl font-bold text-texto leading-tight mb-3">{atual.titulo}</h2>
        <p className="text-sm text-nevoa leading-relaxed mb-7">{atual.corpo}</p>

        {/* Indicador de progresso (pontos) */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {PASSOS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === passo ? "w-6 bg-verdeSinal" : "w-1.5 bg-borda"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          {passo > 0 && (
            <button
              onClick={() => setPasso((p) => p - 1)}
              className="rounded-xl border border-borda px-5 py-3 text-sm text-nevoa hover:text-texto transition-all"
            >
              Voltar
            </button>
          )}
          <button
            onClick={() => (ultimo ? onFechar() : setPasso((p) => p + 1))}
            className="flex-1 rounded-xl bg-verdeSinal py-3 text-sm font-semibold text-white hover:bg-verdeSinal/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {ultimo ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Começar a usar
              </>
            ) : (
              <>
                Próximo <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {!ultimo && (
          <button
            onClick={onFechar}
            className="w-full text-center text-xs text-nevoaClara hover:text-nevoa transition-colors mt-4"
          >
            Pular tour
          </button>
        )}
      </div>
    </div>
  );
}
