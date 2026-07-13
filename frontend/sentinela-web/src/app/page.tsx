import RadarStatus from "@/components/RadarStatus";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ShieldCheck,
  Search,
  Scale,
  FileText,
  Zap,
  BadgePercent,
  Bell,
  ArrowRight,
  Shield,
  Clock,
  Car,
  CheckCircle,
  MailWarning,
  IdCard,
  Timer,
  Briefcase
} from "lucide-react";

const dores = [
  {
    icon: MailWarning,
    titulo: "Ninguém te avisa em tempo real",
    texto:
      "Não existe alerta automático oficial. A maioria descobre a multa pelo boleto em papel — semanas depois, quando o prazo de 30 dias pra apresentar defesa já passou.",
  },
  {
    icon: IdCard,
    titulo: "Os pontos somam sem aviso",
    texto:
      "A CNH pode ser suspensa ao atingir o limite de pontos em 12 meses, e a maioria só descobre o tamanho do problema quando já é tarde para agir.",
  },
  {
    icon: Briefcase,
    titulo: "Pra quem dirige por profissão, é o emprego em jogo",
    texto:
      "Motorista de app, taxista, caminhoneiro: perder a CNH não é só um transtorno, é perder a fonte de renda. E o limite de pontos é diferente pra quem exerce atividade remunerada.",
  },
  {
    icon: Timer,
    titulo: "Recorrer sozinho consome tempo que você não tem",
    texto:
      "Entender o artigo do CTB, avaliar se vale a pena, redigir a defesa com fundamentação — é trabalho jurídico que a maioria acaba não fazendo, e paga o valor cheio mesmo quando tinha argumento.",
  },
];

const timeline = [
  {
    hora: "07:00",
    titulo: "Verificação automática",
    texto:
      "O Sentinela acessa DETRAN-RJ, CET-Rio e PRF em paralelo. Você não faz nada.",
    orgaos: ["DETRAN-RJ", "CET-Rio", "PRF"],
    icon: Search,
  },
  {
    hora: "07:02",
    titulo: "Análise do CTB ponta a ponta",
    texto:
      "A IA lê o código da infração, identifica o artigo, avalia se dá para recorrer e já estima o prazo.",
    icon: Scale,
  },
  {
    hora: "07:03",
    titulo: "Aviso no e-mail e WhatsApp",
    texto:
      "Sem multa: confirmação de tranquilidade. Com multa: o que aconteceu, o prazo e o que fazer agora.",
    icon: Bell,
  },
  {
    hora: "07:04",
    titulo: "Defesa pronta se valer recurso",
    texto:
      "O texto da defesa prévia já sai gerado, com fundamentação legal. Só protocolar.",
    icon: FileText,
  },
];

const diferenciais = [
  {
    icon: Shield,
    titulo: "Todos os órgãos, um cadastro",
    texto:
      "DETRAN-RJ, CET-Rio e PRF consultados em paralelo. Você não precisa saber de qual órgão veio.",
  },
  {
    icon: Scale,
    titulo: "IA que entende o CTB de verdade",
    texto:
      "Não é uma busca genérica. É análise com o artigo certo, o prazo certo e a chance real de recurso.",
  },
  {
    icon: FileText,
    titulo: "Defesa gerada automaticamente",
    texto:
      "Se vale recorrer, o texto da defesa prévia já está pronto com fundamentação legal. Só baixar.",
  },
  {
    icon: Zap,
    titulo: "D-1 — você sabe no mesmo dia",
    texto:
      "Verificação às 07:00 todo dia. Você não espera o boleto chegar para descobrir a multa.",
  },
  {
    icon: BadgePercent,
    titulo: "Onde conseguir desconto",
    texto:
      "Se não valer recurso, a IA indica onde pagar com desconto: PagTesouro, parcelamento, Refis.",
  },
  {
    icon: Bell,
    titulo: "E-mail + WhatsApp",
    texto:
      "Alertas nos dois canais. Você escolhe o que prefere no seu painel.",
  },
  {
    icon: IdCard,
    titulo: "Saiba antes de perder a CNH",
    texto:
      "Pontuação calculada automaticamente conforme a Lei 14.071/2020, considerando se você exerce atividade remunerada. Você vê o risco antes da suspensão, não depois.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-fundo bg-noise bg-grid overflow-hidden selection:bg-verdeSinal/30 selection:text-fundo relative">
      
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-verdeSinal/10 blur-[120px] rounded-full pointer-events-none opacity-50" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[500px] bg-azulNeon/5 blur-[150px] rounded-full pointer-events-none" />

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <header className="relative z-20 glass-nav sticky top-0 mx-auto">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-verdeSinal/20 to-verdeSinal/5 border border-verdeSinal/30 shadow-[0_0_15px_rgba(0,255,136,0.2)]">
              <ShieldCheck className="h-5 w-5 text-verdeSinal" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-texto">
              Sentinela<span className="text-verdeSinal">.AI</span>
            </span>
          </div>
          <nav className="flex items-center gap-8 text-sm font-medium text-nevoaClara">
            <a href="#como-funciona" className="hidden md:block hover:text-texto transition-colors">
              Motor IA
            </a>
            <a href="#diferenciais" className="hidden md:block hover:text-texto transition-colors">
              Capacidades
            </a>
            <ThemeToggle />
            <Link
              href="/entrar"
              className="group relative overflow-hidden rounded-lg bg-texto/5 border border-borda px-6 py-2.5 hover:border-verdeSinal/50 hover:bg-texto/10 transition-all duration-300"
            >
              <span className="relative z-10 text-texto font-semibold flex items-center gap-2">
                Acessar Terminal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 md:gap-16 px-6 pt-16 pb-20 md:grid-cols-2 md:pt-24 md:pb-32 lg:pt-32">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-verdeSinal/30 bg-verdeSinal/10 px-4 py-1.5 text-xs font-mono text-verdeSinal uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(0,255,136,0.1)] mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verdeSinal opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-verdeSinal"></span>
            </span>
            Monitoramento diário · Rio de Janeiro
          </div>

          <h1 className="font-display text-4xl font-bold leading-[1.15] sm:text-5xl md:text-6xl lg:text-7xl text-texto">
            A multa não avisa. <br />
            O prazo não espera. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-verdeSinal to-cyanReal neon-text-verde">
              Nós avisamos primeiro.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-texto/80 leading-relaxed border-l-2 border-borda pl-6">
            Hoje, ninguém te avisa quando uma multa é registrada no seu nome. Você descobre pelo
            boleto — muitas vezes depois que o prazo de defesa já venceu. O Sentinela verifica
            sua placa todo dia em DETRAN-RJ, CET-Rio e PRF, e no mesmo dia te diz{" "}
            <span className="text-texto font-medium">o que aconteceu, quanto tempo você tem e se vale recorrer</span>{" "}
            — com a defesa já pronta pra protocolar.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Link
              href="/entrar"
              className="group relative rounded-xl bg-verdeSinal px-8 py-4 font-bold text-black hover:bg-white transition-all duration-300 shadow-[0_0_30px_rgba(0,255,136,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] flex items-center gap-3"
            >
              <Car className="w-5 h-5" />
              Proteger Minha Placa Agora
            </Link>
            <div className="flex flex-col text-sm text-nevoa font-mono">
              <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-verdeSinal" /> Setup em 30s</span>
              <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-verdeSinal" /> Grátis para 1 placa</span>
            </div>
          </div>

          {/* Stats rápidas */}
          <div className="mt-16 grid grid-cols-3 gap-4 sm:gap-6 pt-8 border-t border-borda">
            {[
              { valor: "3", label: "Órgãos Simultâneos" },
              { valor: "07:00", label: "Sync Diário" },
              { valor: "IA", label: "Análise CTB" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl sm:text-3xl font-bold text-texto">{s.valor}</p>
                <p className="text-[10px] sm:text-xs text-nevoaClara font-mono uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex justify-center lg:justify-end md:animate-float">
          {/* Elemento de decoração futurista atrás do card */}
          <div className="absolute inset-0 bg-gradient-to-tr from-azulNeon/20 to-verdeSinal/20 blur-3xl rounded-full -z-10 transform scale-110" />

          <div className="relative w-full max-w-sm md:max-w-md transform md:rotate-2 hover:rotate-0 transition-transform duration-500">
            <RadarStatus
              placa="KVX-1D34"
              status="sem-multa"
              ultimaVerificacao="07:02:45 UTC-3"
              orgaos={["DETRAN-RJ", "CET-Rio", "PRF"]}
            />
          </div>
        </div>
      </section>

      {/* ── Dor / Agitação ────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 md:py-28 border-t border-borda">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-14 md:mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-texto">
              O sistema não foi feito pra <span className="text-vermelhoSinal neon-text-vermelho">te avisar</span>
            </h2>
            <p className="mt-4 text-texto/75 text-base md:text-lg max-w-2xl mx-auto">
              Nenhum órgão manda um alerta quando você é multado. É por isso que tanta gente perde
              prazo, perde pontos e perde dinheiro sem nem entender como.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {dores.map((d) => {
              const Icon = d.icon;
              return (
                <div
                  key={d.titulo}
                  className="glass-panel rounded-2xl p-6 md:p-7 border-l-2 border-l-vermelhoSinal/40 hover:border-l-vermelhoSinal transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-vermelhoSinal/10 border border-vermelhoSinal/20 flex items-center justify-center text-vermelhoSinal">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg md:text-xl font-bold text-texto">{d.titulo}</h3>
                      <p className="mt-2 text-base text-texto/70 leading-relaxed">{d.texto}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Como funciona ─────────────────────────────────────────────────────── */}
      <section id="como-funciona" className="relative z-10 py-20 md:py-32 border-t border-borda bg-surface backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-14 md:mb-20">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-texto/5 border border-borda mb-6">
              <Clock className="w-6 h-6 text-verdeSinal" />
            </div>
            <h2 className="font-display text-4xl font-bold text-texto">
              Processamento Autônomo <span className="text-verdeSinal">D-1</span>
            </h2>
            <p className="mt-4 text-texto/75 text-lg max-w-2xl mx-auto">
              Veja a telemetria exata do que o motor IA executa diariamente enquanto você dorme.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Linha conectora desktop */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            {timeline.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.hora} className="relative group">
                  <div className="glass-panel p-6 rounded-2xl h-full border-t border-t-white/20 hover:border-verdeSinal/50 hover:bg-texto/5 transition-all duration-300 relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-2.5 rounded-lg bg-surface border border-borda text-verdeSinal shadow-[0_0_10px_rgba(0,255,136,0.1)] group-hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-shadow">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs text-nevoa bg-surface px-2 py-1 rounded border border-borda">{item.hora}</span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-texto mb-3">{item.titulo}</h3>
                    <p className="text-base text-texto/70 leading-relaxed">{item.texto}</p>

                    {item.orgaos && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {item.orgaos.map((o) => (
                          <span key={o} className="rounded border border-borda bg-surface px-2 py-1 text-xs font-mono text-texto/80">
                            {o}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Diferenciais ──────────────────────────────────────────────────────── */}
      <section id="diferenciais" className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:py-32">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl font-bold text-texto">
              Arquitetura de <span className="text-cyanReal neon-text-cyan">Defesa</span>
            </h2>
            <p className="mt-4 text-texto/70 text-lg">
              Construído para não apenas alertar, mas resolver. O Sentinela transforma dados burocráticos em inteligência acionável.
            </p>
          </div>
          <Link href="/entrar" className="text-verdeSinal hover:text-texto font-mono text-sm uppercase tracking-wider flex items-center gap-2 group">
            Ver todas as features <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {diferenciais.map((d, i) => {
            const Icon = d.icon;
            return (
              <div
                key={d.titulo}
                className="glass-panel p-8 rounded-3xl group hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/0 border border-borda flex items-center justify-center mb-6 text-texto group-hover:text-verdeSinal transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-texto">{d.titulo}</h3>
                <p className="mt-4 text-base text-texto/70 leading-relaxed">{d.texto}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Comparação ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 md:py-32 border-t border-borda">
        <div className="mx-auto max-w-5xl px-6">
          <div className="glass-panel-heavy rounded-3xl overflow-hidden border border-borda relative">
            <div className="absolute inset-0 bg-gradient-to-r from-vermelhoSinal/5 via-transparent to-verdeSinal/5 pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-borda relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-vermelhoSinal/10 blur-[50px] rounded-full" />
                <div className="flex items-center gap-3 mb-8">
                  <span className="p-1.5 rounded-full bg-vermelhoSinal/20 text-vermelhoSinal">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </span>
                  <h3 className="font-mono text-sm uppercase tracking-widest text-nevoaClara">Sem Sentinela</h3>
                </div>
                <ul className="space-y-6 text-base text-texto/80">
                  <li className="flex gap-4"><span className="text-vermelhoSinal mt-1">✗</span> Descobre a multa pelo boleto em papel</li>
                  <li className="flex gap-4"><span className="text-vermelhoSinal mt-1">✗</span> Prazo de recurso quase sempre vencido</li>
                  <li className="flex gap-4"><span className="text-vermelhoSinal mt-1">✗</span> Paga o valor cheio (100%)</li>
                  <li className="flex gap-4"><span className="text-vermelhoSinal mt-1">✗</span> Precisa pagar despachante para recurso</li>
                </ul>
              </div>

              <div className="p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-verdeSinal/5 blur-[50px] rounded-full" />
                <div className="flex items-center gap-3 mb-8 relative z-10">
                  <span className="p-1.5 rounded-full bg-verdeSinal/20 text-verdeSinal">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </span>
                  <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-verdeSinal">Com Sentinela AI</h3>
                </div>
                <ul className="space-y-6 text-base text-texto relative z-10">
                  <li className="flex gap-4"><span className="text-verdeSinal mt-1">✓</span> Notificação D-1 no WhatsApp/Email</li>
                  <li className="flex gap-4"><span className="text-verdeSinal mt-1">✓</span> 30 dias integrais para avaliar a situação</li>
                  <li className="flex gap-4"><span className="text-verdeSinal mt-1">✓</span> Indica onde pagar com 40% de desconto</li>
                  <li className="flex gap-4"><span className="text-verdeSinal mt-1">✓</span> IA gera a petição de defesa pronta</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Final ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-20 md:py-32 text-center">
        <div className="glass-panel rounded-3xl border border-verdeSinal/30 bg-gradient-to-b from-verdeSinal/15 to-surface p-8 md:p-16 shadow-[0_0_50px_rgba(0,255,136,0.1)] relative overflow-hidden">
          <div className="scanlines absolute inset-0 opacity-20" />

          <div className="relative z-10">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-texto">
              Inicie a proteção. <span className="text-verdeSinal">Custo zero.</span>
            </h2>
            <p className="mt-6 text-texto/80 text-lg max-w-xl mx-auto">
              Inicialize o monitoramento da sua placa em menos de 60 segundos. A primeira varredura D-1 começa no próximo ciclo às 07:00.
            </p>
            <Link
              href="/entrar"
              className="mt-10 inline-flex items-center justify-center gap-3 rounded-xl bg-verdeSinal px-10 py-5 font-bold text-black hover:bg-white transition-all duration-300 shadow-[0_0_30px_rgba(0,255,136,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] transform hover:-translate-y-1"
            >
              <Zap className="w-5 h-5 fill-fundo" />
              Ativar Sentinela AI
            </Link>
            <div className="mt-8 flex justify-center items-center gap-6 text-xs font-mono text-nevoaClara">
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 opacity-70" /> TLS Encryption</span>
              <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 opacity-70" /> Sem cartão de crédito</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-borda bg-surface px-6 py-12 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-nevoa">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-texto/30" />
            <span className="font-display font-bold text-texto tracking-widest uppercase text-xs">Sentinela<span className="text-verdeSinal">.AI</span></span>
          </div>
          <p className="font-mono text-xs">© 2026 Sentinela Core · Rio de Janeiro · Status: <span className="text-verdeSinal">Operacional</span></p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-texto transition-colors">Termos</a>
            <a href="#" className="hover:text-texto transition-colors">Privacidade</a>
            <a href="/entrar" className="text-verdeSinal hover:text-texto transition-colors font-medium">Console Login</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

