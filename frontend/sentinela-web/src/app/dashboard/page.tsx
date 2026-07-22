"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { auth, apiVeiculos, apiMultas, Veiculo, Multa, PontuacaoCnh, PerfilUsuario, swrKeys } from "@/lib/api";
import MultaCard from "@/components/MultaCard";
import VeiculoCard from "@/components/VeiculoCard";
import AdicionarVeiculoModal from "@/components/AdicionarVeiculoModal";
import CarteiraCnhCard from "@/components/CarteiraCnhCard";
import CnhDocumentVisual from "@/components/CnhDocumentVisual";
import PerfilCnhForm from "@/components/PerfilCnhForm";
import MinhaContaForm from "@/components/MinhaContaForm";
import OnboardingBoasVindasModal from "@/components/OnboardingBoasVindasModal";
import TourAppModal from "@/components/TourAppModal";
import ValidarCnhCard from "@/components/ValidarCnhCard";
import Spotlight from "@/components/Spotlight";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ShieldCheck,
  LogOut,
  LayoutDashboard,
  CarFront,
  FileWarning,
  AlertTriangle,
  Clock,
  Activity,
  Plus,
  CheckCircle2,
  Bell,
  MessageCircle,
  Mail,
  Smartphone,
  CheckCircle,
  XCircle,
  Eye,
  IdCard,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Search,
} from "lucide-react";

const fetcher = (url: string) => {
  const token = auth.getToken();
  return fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => {
    if (!r.ok) throw new Error("Erro ao buscar dados");
    return r.json();
  });
};

const NOTIFICACOES_MOCKADAS = [
  {
    id: "not-3",
    tipo: "app",
    status: "lido",
    destinatario: "Dispositivo Principal (Sentinela App)",
    titulo: "Prazo Crítico Expirando",
    mensagem: "A defesa da multa RJ123456789 (ABC-1234) vence em 5 dias. Acesse o painel para gerar a defesa com IA.",
    dataEnvio: new Date(new Date().getTime() - 1000 * 60 * 30).toISOString(),
    referencia: "ABC-1234"
  },
  {
    id: "not-1",
    tipo: "whatsapp",
    status: "enviado",
    destinatario: "+55 21 99999-9999",
    titulo: "Alerta de Nova Infração",
    mensagem: "O Sentinela identificou uma nova infração para o veículo ABC-1234. Acesse o painel para mais detalhes.",
    dataEnvio: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    referencia: "ABC-1234"
  },
  {
    id: "not-2",
    tipo: "email",
    status: "lido",
    destinatario: "admin@frota.com.br",
    titulo: "Sentinela: Relatório Semanal de Frota",
    mensagem: "Confira o resumo da sua frota monitorada. Você possui 2 infrações que exigem atenção imediata.",
    dataEnvio: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
  },
  {
    id: "not-4",
    tipo: "whatsapp",
    status: "falha",
    destinatario: "+55 21 99999-9999",
    titulo: "Alerta de Nova Infração",
    mensagem: "O Sentinela identificou uma nova infração para o veículo XYZ-9876.",
    dataEnvio: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(),
    referencia: "XYZ-9876"
  }
];

const NAV_ITEMS = [
  { id: "resumo", label: "Início", icon: LayoutDashboard },
  { id: "veiculos", label: "Frota", icon: CarFront },
  { id: "multas", label: "Infrações", icon: FileWarning },
  { id: "cnh", label: "CNH", icon: IdCard },
  { id: "notificacoes", label: "Notificações", icon: Bell },
] as const;

// "conta" não aparece na lista de navegação principal — só é acessada
// clicando no avatar/nome no rodapé da sidebar (ver SidebarContent abaixo).
type AbaId = (typeof NAV_ITEMS)[number]["id"] | "conta";

const PAGE_TITLES: Record<string, string> = {
  resumo: "Visão geral",
  veiculos: "Frota cadastrada",
  multas: "Histórico de infrações",
  cnh: "Minha CNH",
  conta: "Minha conta",
  notificacoes: "Central de notificações",
};

// ─────────────────────────────────────────────────────────────────────────
// Sidebar — conteúdo compartilhado entre a versão fixa (desktop) e o drawer
// deslizante (mobile). Mantém seu próprio indicador animado, medido via
// refs, que desliza suavemente para o item ativo (padrão "Linear/Vercel").
// ─────────────────────────────────────────────────────────────────────────
function SidebarContent({
  abaAtiva,
  setAbaAtiva,
  multasAbertasCount,
  userNome,
  onLogout,
  onNavigate,
  colapsada = false,
}: {
  abaAtiva: AbaId;
  setAbaAtiva: (a: AbaId) => void;
  multasAbertasCount: number;
  userNome?: string;
  onLogout: () => void;
  onNavigate?: () => void;
  colapsada?: boolean;
}) {
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState({ top: 0, height: 0, ready: false });

  useLayoutEffect(() => {
    const el = navRefs.current[abaAtiva];
    if (el) setIndicator({ top: el.offsetTop, height: el.offsetHeight, ready: true });
  }, [abaAtiva, colapsada]);

  return (
    <>
      <div className={`flex items-center gap-3 py-6 border-b border-borda transition-all duration-300 ${colapsada ? "px-0 justify-center" : "px-6"}`}>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-verdeSinal/25 to-verdeSinal/5 border border-verdeSinal/20 shrink-0">
          <ShieldCheck className="text-verdeSinal w-5 h-5" />
        </div>
        {!colapsada && (
          <span className="font-display text-lg font-bold tracking-tight text-gradient whitespace-nowrap">
            Sentinela.AI
          </span>
        )}
      </div>

      <nav className={`relative flex-1 py-5 space-y-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ${colapsada ? "px-2" : "px-3"}`}>
        {indicator.ready && (
          <div
            className={`absolute rounded-xl bg-gradient-to-r from-verdeSinal/[0.16] to-verdeSinal/[0.04] border border-verdeSinal/30 shadow-[0_4px_20px_-4px_rgba(34,197,94,0.45)] transition-[top,height,left,right] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${colapsada ? "left-2 right-2" : "left-3 right-3"}`}
            style={{ top: indicator.top, height: indicator.height }}
          />
        )}
        {NAV_ITEMS.map((item) => {
          const ativo = abaAtiva === item.id;
          return (
            <button
              key={item.id}
              ref={(el) => {
                navRefs.current[item.id] = el;
              }}
              onClick={() => {
                setAbaAtiva(item.id);
                onNavigate?.();
              }}
              title={colapsada ? item.label : undefined}
              className={`relative z-10 w-full flex items-center rounded-xl py-2.5 text-sm font-medium transition-colors duration-200 ${
                colapsada ? "justify-center px-0" : "gap-3 px-3.5"
              } ${ativo ? "text-verdeSinal" : "text-nevoa hover:text-texto"}`}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {!colapsada && <span className="whitespace-nowrap">{item.label}</span>}
              {!colapsada && item.id === "multas" && multasAbertasCount > 0 && (
                <span
                  className={`ml-auto text-[11px] font-semibold rounded-full px-1.5 py-0.5 ${
                    ativo ? "bg-verdeSinal/20 text-verdeSinal" : "bg-ambarSinal/15 text-ambarSinal"
                  }`}
                >
                  {multasAbertasCount}
                </span>
              )}
              {colapsada && item.id === "multas" && multasAbertasCount > 0 && (
                <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-ambarSinal" />
              )}
            </button>
          );
        })}
      </nav>

      <div className={`py-4 border-t border-borda space-y-3 transition-all duration-300 ${colapsada ? "px-2" : "px-3"}`}>
        <button
          onClick={() => {
            setAbaAtiva("conta");
            onNavigate?.();
          }}
          title={colapsada ? "Minha Conta" : undefined}
          className={`w-full flex items-center rounded-xl py-2 transition-all hover:bg-verdeSinal/[0.06] ${
            colapsada ? "justify-center px-0" : "gap-3 px-2.5"
          }`}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-azulMercosul/25 to-azulMercosul/5 text-azulMercosul font-display font-bold text-sm shrink-0 ring-2 ring-azulMercosul/20 ring-offset-2 ring-offset-transparent">
            {userNome?.[0]?.toUpperCase() ?? "U"}
          </div>
          {!colapsada && (
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-semibold truncate">{userNome?.split(" ")[0] ?? "Operador"}</p>
              <p className="text-[11px] text-verdeSinal flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-verdeSinal animate-pulse" /> Conectado
              </p>
            </div>
          )}
        </button>
        {!colapsada && (
          <div className="flex justify-end px-2.5">
            <ThemeToggle />
          </div>
        )}
        <button
          onClick={onLogout}
          title={colapsada ? "Sair" : undefined}
          className={`w-full flex items-center rounded-xl py-2.5 text-sm font-medium text-nevoa hover:bg-vermelhoSinal/10 hover:text-vermelhoSinal transition-all ${
            colapsada ? "justify-center px-0" : "gap-2.5 px-3.5"
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" /> {!colapsada && "Sair"}
        </button>
      </div>
    </>
  );
}

// Relógio ao vivo — isolado em componente próprio para que o tick de 1s não
// force re-render do dashboard inteiro. Só renderiza após o mount (evita
// mismatch de hidratação entre servidor e cliente).
function RelogioAoVivo() {
  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    setAgora(new Date());
    const id = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!agora) return null;

  return (
    <span className="hidden lg:inline-flex items-center gap-2 rounded-full border border-borda px-3 py-1.5 font-mono text-xs text-nevoa tabular-nums">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verdeSinal opacity-60" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-verdeSinal" />
      </span>
      {agora.toLocaleTimeString("pt-BR")}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Gráfico de evolução de gastos — soma o valor das infrações mês a mês nos
// últimos 6 meses. Desenhado em SVG puro (sem lib de gráficos) para não
// adicionar dependência nova só por causa desses dois cartões.
// ─────────────────────────────────────────────────────────────────────────
function EvolucaoGastosChart({ multas }: { multas: Multa[] }) {
  const meses = (() => {
    const arr: { chave: string; label: string; total: number }[] = [];
    const agora = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      arr.push({
        chave: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        total: 0,
      });
    }
    return arr;
  })();

  multas.forEach((m) => {
    const d = new Date(m.dataInfracao);
    const chave = `${d.getFullYear()}-${d.getMonth()}`;
    const item = meses.find((mm) => mm.chave === chave);
    if (item) item.total += m.valor;
  });

  const max = Math.max(...meses.map((m) => m.total), 1);
  const W = 560;
  const H = 160;
  const padX = 8;
  const step = (W - padX * 2) / (meses.length - 1);
  const pontos = meses.map((m, i) => ({
    x: padX + i * step,
    y: H - (m.total / max) * (H - 24) - 4,
    ...m,
  }));
  const linha = pontos.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${linha} L ${pontos[pontos.length - 1].x.toFixed(1)} ${H} L ${pontos[0].x.toFixed(1)} ${H} Z`;
  const totalPeriodo = meses.reduce((s, m) => s + m.total, 0);

  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-bold text-texto">Evolução de gastos</h3>
        <span className="text-xs text-nevoa">últimos 6 meses</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full aspect-[7/2]">
        <defs>
          <linearGradient id="gastosGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#gastosGrad)" />
        <path d={linha} fill="none" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pontos.map((p) => (
          <circle key={p.chave} cx={p.x} cy={p.y} r="3.5" fill="#1D4ED8" />
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-0.5">
        {meses.map((m) => (
          <span key={m.chave} className="text-[11px] text-nevoaClara capitalize">
            {m.label}
          </span>
        ))}
      </div>
      <p className="text-xs text-nevoa mt-3 pt-3 border-t border-borda">
        Total no período:{" "}
        <span className="font-semibold text-texto">
          {totalPeriodo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Donut de gastos por tipo (gravidade) — mesma paleta de cores já usada na
// barra "Distribuição por gravidade", mas somando valor (R$) em vez de
// contagem de infrações.
// ─────────────────────────────────────────────────────────────────────────
function GastosPorTipoChart({ multas }: { multas: Multa[] }) {
  const cores: Record<string, string> = { Leve: "#16A34A", Media: "#D97706", Grave: "#EA580C", Gravissima: "#DC2626" };
  const labels: Record<string, string> = { Leve: "Leve", Media: "Média", Grave: "Grave", Gravissima: "Gravíssima" };
  const totais: Record<string, number> = {};
  multas.forEach((m) => {
    totais[m.gravidade] = (totais[m.gravidade] ?? 0) + m.valor;
  });
  const ordem = ["Gravissima", "Grave", "Media", "Leve"];
  const totalGeral = Object.values(totais).reduce((s, v) => s + v, 0) || 1;

  const R = 46;
  const C = 2 * Math.PI * R;
  let acumulado = 0;
  const fatias = ordem
    .filter((g) => totais[g] > 0)
    .map((g) => {
      const fracao = totais[g] / totalGeral;
      const dash = fracao * C;
      const offset = -acumulado * C;
      acumulado += fracao;
      return { g, dash, offset, cor: cores[g] };
    });

  return (
    <div className="card p-5 md:p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-bold text-texto">Gastos por tipo</h3>
        <span className="text-xs text-nevoa">por gravidade</span>
      </div>
      <div className="flex items-center gap-6 flex-1">
        <svg viewBox="0 0 120 120" className="w-28 h-28 -rotate-90 shrink-0">
          <circle cx="60" cy="60" r={R} fill="none" style={{ stroke: "var(--asfalto)" }} strokeWidth="14" />
          {fatias.map((f) => (
            <circle
              key={f.g}
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={f.cor}
              strokeWidth="14"
              strokeDasharray={`${f.dash} ${C - f.dash}`}
              strokeDashoffset={f.offset}
            />
          ))}
        </svg>
        <div className="flex-1 space-y-2 min-w-0">
          {ordem.filter((g) => totais[g] > 0).length === 0 ? (
            <p className="text-xs text-nevoaClara">Sem dados suficientes.</p>
          ) : (
            ordem
              .filter((g) => totais[g] > 0)
              .map((g) => (
                <div key={g} className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex items-center gap-2 text-nevoa">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cores[g] }} />
                    {labels[g]}
                  </span>
                  <span className="font-semibold text-texto tabular-nums">
                    {totais[g].toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<AbaId>("resumo");
  const [modalAberto, setModalAberto] = useState(false);
  const [menuMovelAberto, setMenuMovelAberto] = useState(false);
  const [sidebarColapsada, setSidebarColapsada] = useState(false);
  const [subAbaMultas, setSubAbaMultas] = useState<"novas" | "abertas" | "vencidas">("novas");
  const [busca, setBusca] = useState("");
  const [buscaFoco, setBuscaFoco] = useState(false);
  const [mostrarTour, setMostrarTour] = useState(false);
  const user = auth.getUser();

  useEffect(() => {
    if (!auth.isLogado()) router.push("/entrar");
  }, [router]);

  // Trava o scroll do body quando o drawer móvel está aberto
  useEffect(() => {
    document.body.style.overflow = menuMovelAberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuMovelAberto]);

  const {
    data: veiculos = [],
    isLoading: loadV,
    mutate: mutateVeiculos,
  } = useSWR<Veiculo[]>(swrKeys.veiculos, fetcher, { refreshInterval: 60_000 });

  const {
    data: multasFetch = [],
    isLoading: loadM,
    mutate: mutateMultas,
  } = useSWR<Multa[]>(swrKeys.multasMinhas, fetcher, { refreshInterval: 60_000 });

  const {
    data: pontuacaoCnh,
    isLoading: loadCnh,
    mutate: mutatePontuacaoCnh,
  } = useSWR<PontuacaoCnh>(swrKeys.pontuacaoCnh, fetcher, { refreshInterval: 60_000 });

  const { data: perfil, mutate: mutatePerfil } = useSWR<PerfilUsuario>(swrKeys.perfil, fetcher);

  // Onboarding obrigatório: sem Nome, CPF e Nº de registro da CNH, o
  // Sentinela não consegue montar o cartão de CNH nem identificar com
  // segurança o proprietário do veículo monitorado.
  // Aparece no primeiro acesso (perfil recém-criado, campos em branco) e
  // continua aparecendo em qualquer login seguinte até serem preenchidos.
  const precisaOnboarding =
    !!perfil && (!perfil.nome?.trim() || !perfil.cpf || !perfil.numeroRegistroCnh);

  // Mini tour de boas-vindas: dispara assim que o perfil está completo (seja
  // porque acabou de terminar o onboarding, seja porque já era um usuário
  // antigo que nunca viu o tour neste navegador/dispositivo). Guardado em
  // localStorage por usuário — funciona igual na versão web e instalada
  // como PWA, já que é o mesmo código rodando nos dois casos.
  useEffect(() => {
    if (!perfil || precisaOnboarding) return;
    const chave = `sentinela_tour_visto_${perfil.id}`;
    if (typeof window !== "undefined" && !window.localStorage.getItem(chave)) {
      setMostrarTour(true);
    }
  }, [perfil, precisaOnboarding]);

  const fecharTour = () => {
    if (perfil && typeof window !== "undefined") {
      window.localStorage.setItem(`sentinela_tour_visto_${perfil.id}`, "1");
    }
    setMostrarTour(false);
  };

  const multas = multasFetch;

  const multasUrgentes = multas.filter(
    (m) => m.diasParaPrazo !== null && m.diasParaPrazo !== undefined && m.diasParaPrazo <= 7
  );
  const multasAbertas = multas.filter(
    (m) => m.status === "RecursoViavel" || m.status === "NaoAvaliado" || m.status === "DefesaGerada"
  );

  // ── Categorização para a aba "Infrações": Vencidas / Novas / Em aberto ────
  // Prioridade: prazo vencido sempre vence (não há mais recurso possível,
  // só pagamento). Depois, "novas" = detectadas recentemente (últimos 3 dias),
  // ainda não vistas com calma pelo condutor. O restante fica "em aberto"
  // (dentro do prazo, aguardando alguma ação).
  const TRES_DIAS_MS = 3 * 24 * 60 * 60 * 1000;
  const agoraMs = Date.now();
  const multasVencidas = multas.filter(
    (m) => typeof m.diasParaPrazo === "number" && m.diasParaPrazo < 0
  );
  const idsVencidas = new Set(multasVencidas.map((m) => m.id));
  const multasNovas = multas.filter(
    (m) => !idsVencidas.has(m.id) && agoraMs - new Date(m.detectadaEm).getTime() <= TRES_DIAS_MS
  );
  const idsNovas = new Set(multasNovas.map((m) => m.id));
  const multasEmAberto = multas.filter((m) => !idsVencidas.has(m.id) && !idsNovas.has(m.id));

  const MULTAS_TABS = [
    { id: "novas" as const, label: "Novas", icon: Sparkles, cor: "#1D4ED8", bg: "rgba(29,78,216,0.12)", lista: multasNovas },
    { id: "abertas" as const, label: "Em aberto", icon: Activity, cor: "#D97706", bg: "rgba(217,119,6,0.12)", lista: multasEmAberto },
    { id: "vencidas" as const, label: "Vencidas", icon: ShieldAlert, cor: "#DC2626", bg: "rgba(220,38,38,0.12)", lista: multasVencidas },
  ];
  const listaMultasAtiva = MULTAS_TABS.find((t) => t.id === subAbaMultas)?.lista ?? [];

  // ── Busca rápida no header: filtra veículos (placa) e infrações (nº do
  // auto / descrição) e devolve um pequeno dropdown de atalhos — não abre
  // uma tela de detalhe própria, apenas leva para a aba correta.
  const termoBusca = busca.trim().toLowerCase();
  const resultadosBusca =
    termoBusca.length >= 2
      ? [
          ...veiculos
            .filter((v) => v.placa.toLowerCase().includes(termoBusca))
            .slice(0, 4)
            .map((v) => ({
              tipo: "veiculo" as const,
              id: v.id,
              titulo: v.placa,
              subtitulo: `${v.uf} · RENAVAM ${v.renavam}`,
            })),
          ...multas
            .filter(
              (m) =>
                m.numeroAutoInfracao.toLowerCase().includes(termoBusca) ||
                m.descricaoInfracao.toLowerCase().includes(termoBusca) ||
                (m.placaVeiculo ?? "").toLowerCase().includes(termoBusca)
            )
            .slice(0, 4)
            .map((m) => ({
              tipo: "multa" as const,
              id: m.id,
              titulo: m.numeroAutoInfracao,
              subtitulo: m.descricaoInfracao,
            })),
        ]
      : [];

  const irParaResultadoBusca = (tipo: "veiculo" | "multa") => {
    setAbaAtiva(tipo === "veiculo" ? "veiculos" : "multas");
    setBusca("");
  };

  // ── Notificações não lidas — usado no sino do header (mock por enquanto,
  // já preparado para trocar por dado real quando o backend expuser contagem).
  const notificacoesNaoLidas = NOTIFICACOES_MOCKADAS.filter((n) => n.status !== "lido").length;

  const handleLogout = () => {
    auth.limparSessao();
    router.push("/");
  };

  const saudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="relative min-h-screen bg-fundo text-texto font-body overflow-x-hidden">
      {/* ── Blobs decorativos de fundo (dão profundidade ao vidro fosco) ──── */}
      <div className="mesh-blob w-[42rem] h-[42rem] -top-48 -left-40 bg-verdeSinal/[0.22] animate-blob-float" />
      <div
        className="mesh-blob w-[38rem] h-[38rem] top-1/4 -right-48 bg-azulMercosul/[0.20] animate-blob-float"
        style={{ animationDelay: "-5s" }}
      />
      <div
        className="mesh-blob w-[34rem] h-[34rem] bottom-[-10rem] left-1/3 bg-roxoPremium/[0.16] animate-blob-float"
        style={{ animationDelay: "-9s" }}
      />
      <div
        className="mesh-blob w-[24rem] h-[24rem] top-[45%] left-[45%] bg-cyanReal/[0.12] animate-blob-float"
        style={{ animationDelay: "-3s" }}
      />
      {/* Textura de grão sutil — dá um acabamento "premium" tátil à superfície.
          Fica no mesmo nível dos blobs (z-0) para nunca cobrir o conteúdo real. */}
      <div className="fixed inset-0 bg-noise pointer-events-none z-0" />

      <div className="relative z-[1] flex w-full">
        {/* ── Sidebar (desktop, recolhível) ────────────────────────────────── */}
        <aside
          className={`hidden md:flex md:flex-col md:shrink-0 md:h-screen md:sticky md:top-0 border-r border-borda glass-sidebar relative transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            sidebarColapsada ? "md:w-[76px]" : "md:w-64"
          }`}
        >
          <SidebarContent
            abaAtiva={abaAtiva}
            setAbaAtiva={setAbaAtiva}
            multasAbertasCount={multasAbertas.length}
            userNome={user?.nome}
            onLogout={handleLogout}
            colapsada={sidebarColapsada}
          />
          <button
            onClick={() => setSidebarColapsada((v) => !v)}
            title={sidebarColapsada ? "Expandir menu" : "Recolher menu"}
            className="absolute top-8 -right-3.5 flex items-center justify-center w-7 h-7 rounded-full bg-grafite border border-borda shadow-[0_4px_12px_-2px_rgba(0,0,0,0.25)] text-nevoa hover:text-verdeSinal hover:border-verdeSinal/40 active:scale-90 transition-all z-20"
          >
            {sidebarColapsada ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </aside>

        {/* ── Conteúdo principal ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Header superior */}
          <header className="sticky top-0 z-30 glass-sidebar backdrop-blur-xl border-b border-borda px-4 md:px-8 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:hidden">
              <button
                onClick={() => setMenuMovelAberto(true)}
                aria-label="Abrir menu"
                className="flex items-center justify-center w-9 h-9 rounded-xl border border-borda text-nevoa hover:text-texto hover:border-bordaGlow active:scale-95 transition-all"
              >
                <Menu className="w-[18px] h-[18px]" />
              </button>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-verdeSinal/10 border border-verdeSinal/20">
                <ShieldCheck className="text-verdeSinal w-4 h-4" />
              </div>
              <span className="font-display text-base font-bold tracking-tight">
                Sentinela<span className="text-verdeSinal">.AI</span>
              </span>
            </div>
            <div className="hidden md:block min-w-0">
              <button
                onClick={() => setAbaAtiva("resumo")}
                className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-nevoaClara mb-0.5 hover:text-verdeSinal transition-colors"
              >
                Painel
                <ChevronRight className="w-3 h-3" />
                <span className="text-nevoa normal-case tracking-normal">{PAGE_TITLES[abaAtiva]}</span>
              </button>
              <h1 className="font-display text-2xl font-bold tracking-tight truncate">{PAGE_TITLES[abaAtiva]}</h1>
            </div>
            <div className="hidden md:flex items-center gap-3">
              {/* Busca rápida — placa ou nº do auto de infração */}
              <div className="relative">
                <div className="flex items-center gap-2 rounded-full border border-borda bg-fundo/60 px-3 py-1.5 focus-within:border-verdeSinal/50 transition-colors">
                  <Search className="w-3.5 h-3.5 text-nevoaClara shrink-0" />
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    onFocus={() => setBuscaFoco(true)}
                    onBlur={() => setTimeout(() => setBuscaFoco(false), 150)}
                    placeholder="Buscar placa ou auto..."
                    className="bg-transparent text-xs text-texto placeholder-nevoaClara focus:outline-none w-36 lg:w-52"
                  />
                </div>
                {buscaFoco && termoBusca.length >= 2 && (
                  <div className="absolute top-full mt-2 right-0 w-72 rounded-xl border border-borda bg-grafite shadow-2xl overflow-hidden z-40 animate-fade-in">
                    {resultadosBusca.length > 0 ? (
                      resultadosBusca.map((r) => (
                        <button
                          key={`${r.tipo}-${r.id}`}
                          onClick={() => irParaResultadoBusca(r.tipo)}
                          className="w-full text-left px-4 py-2.5 hover:bg-asfalto transition-colors border-b border-borda last:border-0"
                        >
                          <p className="text-xs font-semibold text-texto truncate">{r.titulo}</p>
                          <p className="text-[11px] text-nevoa truncate">{r.subtitulo}</p>
                        </button>
                      ))
                    ) : (
                      <p className="px-4 py-3 text-xs text-nevoa">Nenhum resultado para &quot;{busca}&quot;</p>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setAbaAtiva("notificacoes")}
                aria-label="Notificações"
                className="relative flex items-center justify-center w-9 h-9 rounded-full border border-borda text-nevoa hover:text-texto hover:border-bordaGlow transition-all"
              >
                <Bell className="w-4 h-4" />
                {notificacoesNaoLidas > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-vermelhoSinal text-white text-[10px] font-bold">
                    {notificacoesNaoLidas}
                  </span>
                )}
              </button>
              <RelogioAoVivo />
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setAbaAtiva("notificacoes")}
                aria-label="Notificações"
                className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-borda text-nevoa hover:text-texto transition-all"
              >
                <Bell className="w-4 h-4" />
                {notificacoesNaoLidas > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-vermelhoSinal text-white text-[9px] font-bold">
                    {notificacoesNaoLidas}
                  </span>
                )}
              </button>
              <ThemeToggle />
            </div>
            {abaAtiva === "veiculos" && (
              <button
                onClick={() => setModalAberto(true)}
                className="hidden md:inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-verdeSinal to-verdeSinal/90 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-6px_rgba(22,163,74,0.55)] hover:shadow-[0_10px_28px_-6px_rgba(22,163,74,0.65)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" /> Incluir veículo
              </button>
            )}
          </header>

          <main className="flex-1 px-4 md:px-8 py-6 md:py-8 pb-10">
            {/* ─── ABA RESUMO ────────────────────────────────────────────── */}
            {abaAtiva === "resumo" && (
              <div className="animate-fade-up space-y-8">
                <div className="relative overflow-hidden rounded-3xl px-1 py-1">
                  <div className="absolute -top-24 -left-16 w-72 h-72 bg-verdeSinal/[0.07] rounded-full blur-3xl pointer-events-none" />
                  <div className="relative flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-sm text-nevoa">{saudacao()},</p>
                      <h2 className="mt-1 font-display text-3xl md:text-4xl font-bold tracking-tight text-texto">
                        {user?.nome?.split(" ")[0] ?? "Operador"}
                      </h2>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-verdeSinal/25 bg-verdeSinal/[0.08] px-3.5 py-1.5 text-xs font-medium text-verdeSinal">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verdeSinal opacity-60" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-verdeSinal" />
                      </span>
                      Varredura diária ativa · próxima às 10:00
                    </span>
                  </div>
                </div>

                {multasUrgentes.length > 0 && (
                  <div className="rounded-2xl border border-vermelhoSinal/25 bg-vermelhoSinal/[0.06] backdrop-blur-sm px-5 py-4 flex items-center gap-4 animate-fade-up">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-vermelhoSinal/15 shrink-0">
                      <AlertTriangle className="w-5 h-5 text-vermelhoSinal" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-vermelhoSinal text-sm">Prazos expirando</p>
                      <p className="text-sm text-texto/70 mt-0.5">
                        Você possui <strong className="text-texto">{multasUrgentes.length} infraç{multasUrgentes.length > 1 ? "ões" : "ão"}</strong> com
                        prazo de defesa em menos de 7 dias.
                      </p>
                    </div>
                    <button
                      onClick={() => setAbaAtiva("multas")}
                      className="hidden md:block shrink-0 rounded-xl bg-vermelhoSinal px-4 py-2 text-sm font-semibold text-white hover:bg-vermelhoSinal/90 active:scale-[0.98] transition-all"
                    >
                      Ver agora
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[
                    {
                      label: "Veículos monitorados", valor: veiculos.length, cor: "text-verdeSinal", bar: "bg-verdeSinal",
                      grad: "from-verdeSinal/25 to-verdeSinal/5", glow: "rgba(22,163,74,0.28)", icon: CarFront,
                      insight: veiculos.length > 0 ? "Vigilância ativa" : "Nenhum cadastrado",
                    },
                    {
                      label: "Total de infrações", valor: multas.length, cor: "text-azulMercosul", bar: "bg-azulMercosul",
                      grad: "from-azulMercosul/25 to-azulMercosul/5", glow: "rgba(29,78,216,0.28)", icon: FileWarning,
                      insight: "Processadas pela IA",
                    },
                    {
                      label: "Defesas pendentes", valor: multasAbertas.length, cor: "text-ambarSinal", bar: "bg-ambarSinal",
                      grad: "from-ambarSinal/25 to-ambarSinal/5", glow: "rgba(217,119,6,0.28)", icon: Activity,
                      insight: multasAbertas.length > 0 ? "Ação recomendada" : "Tudo em dia",
                    },
                    {
                      label: "Prazos críticos", valor: multasUrgentes.length, cor: "text-vermelhoSinal", bar: "bg-vermelhoSinal",
                      grad: "from-vermelhoSinal/25 to-vermelhoSinal/5", glow: "rgba(220,38,38,0.28)", icon: Clock,
                      insight: multasUrgentes.length > 0 ? "Requer atenção imediata" : "Nenhum prazo urgente",
                    },
                  ].map((k, idx) => (
                    <Spotlight
                      key={k.label}
                      className="card card-hover p-5 pt-[18px] opacity-0 animate-scale-in overflow-hidden"
                      style={{ animationDelay: `${idx * 70}ms`, ["--glow-color" as any]: k.glow }}
                    >
                      <div className={`absolute top-0 left-0 right-0 h-[3px] ${k.bar} opacity-70`} />
                      {/* Mancha de cor sutil no canto — dá identidade própria a cada card,
                          independente de estar ou não sobre um dos blobs de fundo. */}
                      <div
                        className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-[0.16] pointer-events-none"
                        style={{ backgroundColor: k.glow }}
                      />
                      <div className="flex items-start justify-between">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${k.grad} mb-4 ring-1 ring-black/[0.03]`}>
                          <k.icon className={`w-[18px] h-[18px] ${k.cor}`} />
                        </div>
                      </div>
                      <p className={`font-display text-3xl font-bold tracking-tight tabular-nums ${k.cor}`}>{k.valor}</p>
                      <p className="text-xs text-nevoa mt-1">{k.label}</p>
                      <p className="text-[11px] text-nevoaClara mt-2 pt-2 border-t border-borda">{k.insight}</p>
                    </Spotlight>
                  ))}
                </div>

                {multas.length > 0 && (
                  <div className="card p-5 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display text-sm font-bold text-texto">Distribuição por gravidade</h3>
                      <span className="text-xs text-nevoa">{multas.length} infraç{multas.length > 1 ? "ões" : "ão"} no total</span>
                    </div>
                    {(() => {
                      const cores: Record<string, string> = { Leve: "#16A34A", Media: "#D97706", Grave: "#EA580C", Gravissima: "#DC2626" };
                      const labels: Record<string, string> = { Leve: "Leve", Media: "Média", Grave: "Grave", Gravissima: "Gravíssima" };
                      const contagem: Record<string, number> = {};
                      multas.forEach((m) => { contagem[m.gravidade] = (contagem[m.gravidade] ?? 0) + 1; });
                      const ordem = ["Gravissima", "Grave", "Media", "Leve"];
                      const total = multas.length;
                      return (
                        <>
                          <div className="flex h-3 rounded-full overflow-hidden bg-asfalto">
                            {ordem.filter((g) => contagem[g] > 0).map((g) => (
                              <div
                                key={g}
                                className="transition-all duration-700 ease-out"
                                style={{ width: `${(contagem[g] / total) * 100}%`, backgroundColor: cores[g] }}
                              />
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                            {ordem.filter((g) => contagem[g] > 0).map((g) => (
                              <div key={g} className="flex items-center gap-2 text-xs text-nevoa">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cores[g] }} />
                                {labels[g]} <span className="font-semibold text-texto">{contagem[g]}</span>
                                <span className="text-nevoaClara">· {((contagem[g] / total) * 100).toFixed(0)}%</span>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {multas.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <EvolucaoGastosChart multas={multas} />
                    </div>
                    <div className="lg:col-span-1">
                      <GastosPorTipoChart multas={multas} />
                    </div>
                  </div>
                )}

                {loadM ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-[3px] border-verdeSinal/20 border-t-verdeSinal rounded-full animate-spin" />
                  </div>
                ) : multas.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display text-lg font-bold">Infrações recentes</h3>
                      <button onClick={() => setAbaAtiva("multas")} className="text-sm font-medium text-verdeSinal hover:underline">
                        Ver todas
                      </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                      {multas.slice(0, 6).map((m) => (
                        <MultaCard key={m.id} multa={m} onUpdate={mutateMultas} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="card p-12 text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-verdeSinal/10 mb-5">
                      <CheckCircle2 className="w-8 h-8 text-verdeSinal" />
                    </div>
                    <h3 className="font-display text-xl font-bold mb-2">Nenhuma infração encontrada</h3>
                    <p className="text-sm text-nevoa mb-6 max-w-md mx-auto">
                      {veiculos.length === 0
                        ? "Cadastre sua frota para o Sentinela iniciar a varredura automática diária."
                        : "Seus veículos monitorados estão sem pendências no momento."}
                    </p>
                    {veiculos.length === 0 && (
                      <button
                        onClick={() => setModalAberto(true)}
                        className="rounded-xl bg-verdeSinal px-6 py-3 text-sm font-semibold text-white hover:bg-verdeSinal/90 active:scale-[0.98] transition-all inline-flex items-center gap-2 mx-auto"
                      >
                        <Plus className="w-4 h-4" /> Cadastrar primeiro veículo
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── ABA VEÍCULOS ──────────────────────────────────────────── */}
            {abaAtiva === "veiculos" && (
              <div className="animate-fade-up">
                <div className="flex items-center justify-between mb-6 md:hidden">
                  <p className="text-sm text-nevoa">{veiculos.length} veículo{veiculos.length !== 1 ? "s" : ""} monitorado{veiculos.length !== 1 ? "s" : ""}</p>
                  <button
                    onClick={() => setModalAberto(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-verdeSinal px-4 py-2.5 text-sm font-semibold text-white active:scale-[0.98] transition-all"
                  >
                    <Plus className="w-4 h-4" /> Incluir
                  </button>
                </div>

                {loadV ? (
                  <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-[3px] border-verdeSinal/20 border-t-verdeSinal rounded-full animate-spin" />
                  </div>
                ) : veiculos.length === 0 ? (
                  <div className="card border-dashed p-16 text-center">
                    <CarFront className="w-14 h-14 text-nevoaClara mx-auto mb-5" />
                    <p className="font-display text-lg font-bold mb-2">Garagem vazia</p>
                    <p className="text-sm text-nevoa mb-6 max-w-md mx-auto">
                      Adicione a placa do seu veículo para o Sentinela iniciar o monitoramento diário.
                    </p>
                    <button
                      onClick={() => setModalAberto(true)}
                      className="rounded-xl bg-texto px-6 py-3 text-sm font-semibold text-fundo hover:bg-verdeSinal hover:text-white active:scale-[0.98] transition-all inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Registrar placa
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {veiculos.map((v) => (
                      <VeiculoCard key={v.id} veiculo={v} onUpdate={mutateVeiculos} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── ABA MULTAS ────────────────────────────────────────────── */}
            {abaAtiva === "multas" && (
              <div className="animate-fade-up">
                <p className="text-sm text-nevoa mb-6">
                  {multas.length} ocorrência{multas.length !== 1 ? "s" : ""} processada{multas.length !== 1 ? "s" : ""} pela IA do Sentinela
                </p>

                {loadM ? (
                  <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-[3px] border-verdeSinal/20 border-t-verdeSinal rounded-full animate-spin" />
                  </div>
                ) : multas.length === 0 ? (
                  <div className="card p-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-verdeSinal/10 mb-5">
                      <CheckCircle2 className="w-8 h-8 text-verdeSinal" />
                    </div>
                    <p className="font-display text-lg font-bold text-verdeSinal">Histórico limpo</p>
                    <p className="mt-2 text-sm text-nevoa">Nenhuma infração vinculada à sua frota.</p>
                  </div>
                ) : (
                  <>
                    {/* Abas: Novas / Em aberto / Vencidas */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {MULTAS_TABS.map((tab) => {
                        const ativa = subAbaMultas === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setSubAbaMultas(tab.id)}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border transition-all ${
                              ativa ? "" : "border-borda text-nevoa hover:text-texto hover:border-bordaGlow"
                            }`}
                            style={ativa ? { backgroundColor: tab.bg, borderColor: `${tab.cor}40`, color: tab.cor } : undefined}
                          >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            <span
                              className="text-[11px] font-bold rounded-full px-1.5 py-0.5"
                              style={{
                                background: ativa ? `${tab.cor}30` : "rgba(100,116,139,0.12)",
                                color: ativa ? tab.cor : undefined,
                              }}
                            >
                              {tab.lista.length}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {listaMultasAtiva.length === 0 ? (
                      <div className="card border-dashed p-12 text-center">
                        <p className="text-sm text-nevoa">
                          {subAbaMultas === "novas" && "Nenhuma infração recebida nos últimos dias."}
                          {subAbaMultas === "abertas" && "Nenhuma infração em aberto no momento."}
                          {subAbaMultas === "vencidas" && "Nenhuma infração com prazo de defesa vencido."}
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {listaMultasAtiva.map((m) => (
                          <MultaCard key={m.id} multa={m} expanded onUpdate={mutateMultas} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ─── ABA CNH ───────────────────────────────────────────────── */}
            {abaAtiva === "cnh" && (
              <div className="animate-fade-up space-y-10">
                <p className="text-sm text-nevoa -mt-2">
                  Lei 14.071/2020 · risco de suspensão calculado em tempo real
                </p>

                {perfil && (
                  <div className="grid gap-8 lg:grid-cols-[minmax(0,400px)_1fr] items-start">
                    <CnhDocumentVisual
                      nome={perfil.nome}
                      cpf={perfil.cpf}
                      numeroRegistroCnh={perfil.numeroRegistroCnh}
                      categoriaCnh={perfil.categoriaCnh}
                      dataExpedicaoCnh={perfil.dataExpedicaoCnh}
                      validade={perfil.validadeCnh}
                      situacaoCnh={perfil.situacaoCnh}
                      cnhValidadaEm={perfil.cnhValidadaEm}
                    />
                    <div className="flex flex-col gap-4">
                      <p className="text-sm text-nevoa leading-relaxed">
                        Este cartão é uma representação dentro do app — não substitui sua CNH física ou
                        digital oficial. Preencha seus dados para ver o cartão completo e acompanhar o
                        vencimento.
                      </p>
                      <PerfilCnhForm perfil={perfil} onUpdate={mutatePerfil} />
                      <ValidarCnhCard perfil={perfil} onUpdate={mutatePerfil} />
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-display text-xl font-bold mb-5">Pontuação e risco de suspensão</h3>
                  {loadCnh ? (
                    <div className="flex justify-center py-20">
                      <div className="w-8 h-8 border-[3px] border-verdeSinal/20 border-t-verdeSinal rounded-full animate-spin" />
                    </div>
                  ) : pontuacaoCnh ? (
                    <CarteiraCnhCard
                      pontuacao={pontuacaoCnh}
                      nomeCondutor={user?.nome}
                      onUpdate={mutatePontuacaoCnh}
                    />
                  ) : (
                    <div className="card border-dashed p-16 text-center">
                      <IdCard className="w-14 h-14 text-nevoaClara mx-auto mb-5" />
                      <p className="font-display text-lg font-bold mb-2">Sem dados de pontuação</p>
                      <p className="text-sm text-nevoa max-w-md mx-auto">
                        Cadastre veículos e aguarde a varredura diária para o Sentinela calcular sua pontuação.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── ABA MINHA CONTA ───────────────────────────────────────── */}
            {abaAtiva === "conta" && (
              <div className="animate-fade-up space-y-6">
                <p className="text-sm text-nevoa -mt-2">
                  Nome, CPF e WhatsApp — usados nas consultas de multas e nos alertas.
                </p>
                {perfil && <MinhaContaForm perfil={perfil} onUpdate={mutatePerfil} />}
              </div>
            )}

            {/* ─── ABA NOTIFICAÇÕES ──────────────────────────────────────── */}
            {abaAtiva === "notificacoes" && (
              <div className="animate-fade-up">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-nevoa">Histórico de envios via WhatsApp, e-mail e app</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366]" title="WhatsApp">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#EA4335]/10 flex items-center justify-center text-[#EA4335]" title="E-mail">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-verdeSinal/10 flex items-center justify-center text-verdeSinal" title="Push App">
                      <Smartphone className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="card divide-y divide-borda overflow-hidden">
                  {NOTIFICACOES_MOCKADAS.map((notificacao) => {
                    let Icon = Bell;
                    let colorClass = "text-texto";
                    let bgClass = "bg-texto/10";

                    if (notificacao.tipo === "whatsapp") {
                      Icon = MessageCircle;
                      colorClass = "text-[#25D366]";
                      bgClass = "bg-[#25D366]/10";
                    } else if (notificacao.tipo === "email") {
                      Icon = Mail;
                      colorClass = "text-[#EA4335]";
                      bgClass = "bg-[#EA4335]/10";
                    } else if (notificacao.tipo === "app") {
                      Icon = Smartphone;
                      colorClass = "text-verdeSinal";
                      bgClass = "bg-verdeSinal/10";
                    }

                    let StatusIcon = CheckCircle;
                    let statusColor = "text-texto";
                    if (notificacao.status === "enviado") {
                      statusColor = "text-ambarSinal";
                    } else if (notificacao.status === "lido") {
                      StatusIcon = Eye;
                      statusColor = "text-azulMercosul";
                    } else if (notificacao.status === "falha") {
                      StatusIcon = XCircle;
                      statusColor = "text-vermelhoSinal";
                    }

                    return (
                      <div key={notificacao.id} className="p-5 hover:bg-asfalto/50 transition-colors flex flex-col md:flex-row gap-5">
                        <div className="shrink-0">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bgClass}`}>
                            <Icon className={`w-5 h-5 ${colorClass}`} />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1.5">
                            <h4 className="font-display font-bold text-texto">{notificacao.titulo}</h4>
                            <div className="flex items-center gap-2 text-xs text-nevoa">
                              <span>{new Date(notificacao.dataEnvio).toLocaleString("pt-BR")}</span>
                              <span className="w-1 h-1 rounded-full bg-borda" />
                              <div className={`flex items-center gap-1 ${statusColor}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {notificacao.status}
                              </div>
                            </div>
                          </div>

                          <p className="text-sm text-nevoa mb-2.5 leading-relaxed">{notificacao.mensagem}</p>

                          <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-asfalto text-[11px] text-nevoa">
                              <span className="opacity-70">Destino:</span>
                              <span className="text-texto">{notificacao.destinatario}</span>
                            </div>
                            {notificacao.referencia && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-asfalto text-[11px] text-nevoa">
                                <span className="opacity-70">Ref:</span>
                                <span className="text-texto font-semibold">{notificacao.referencia}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Sidebar móvel (drawer deslizante com overlay) ───────────────── */}
      {menuMovelAberto && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 drawer-overlay animate-fade-in"
            onClick={() => setMenuMovelAberto(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[78%] max-w-[300px] glass-sidebar border-r border-borda shadow-2xl flex flex-col animate-slide-in-left">
            <button
              onClick={() => setMenuMovelAberto(false)}
              aria-label="Fechar menu"
              className="absolute top-5 right-4 flex items-center justify-center w-8 h-8 rounded-lg text-nevoa hover:text-texto hover:bg-asfalto active:scale-95 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent
              abaAtiva={abaAtiva}
              setAbaAtiva={setAbaAtiva}
              multasAbertasCount={multasAbertas.length}
              userNome={user?.nome}
              onLogout={handleLogout}
              onNavigate={() => setMenuMovelAberto(false)}
            />
          </div>
        </div>
      )}

      {/* ── Botão flutuante mobile (ação principal por aba) ─────────────── */}
      {abaAtiva === "veiculos" && (
        <button
          onClick={() => setModalAberto(true)}
          aria-label="Incluir veículo"
          className="md:hidden fixed bottom-6 right-5 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-b from-verdeSinal to-verdeSinal/90 text-white shadow-[0_10px_28px_-6px_rgba(22,163,74,0.55)] active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* ── Modal adicionar veículo ──────────────────────────────────────── */}
      {modalAberto && (
        <AdicionarVeiculoModal
          onClose={() => setModalAberto(false)}
          onSuccess={() => {
            mutateVeiculos();
            setModalAberto(false);
          }}
        />
      )}

      {/* ── Onboarding de boas-vindas ─────────────────────────────────────
          Some sozinho assim que Nome, CPF e Nº de registro da CNH estiverem
          preenchidos (mutatePerfil() faz a checagem abaixo virar false). */}
      {precisaOnboarding && perfil && (
        <OnboardingBoasVindasModal
          perfil={perfil}
          onConcluido={() => {
            mutatePerfil();
            mutateVeiculos();
          }}
        />
      )}

      {/* ── Mini tour pós-onboarding ──────────────────────────────────────── */}
      {mostrarTour && !precisaOnboarding && <TourAppModal nome={user?.nome} onFechar={fecharTour} />}
    </div>
  );
}
