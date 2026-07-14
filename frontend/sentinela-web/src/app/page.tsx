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
  Clock,
  CheckCircle,
  MailWarning,
  IdCard,
  Timer,
  Briefcase,
  Radar,
  Bike,
  Car,
  Lock,
  Sparkles,
} from "lucide-react";

const confianca = [
  { icon: Radar, texto: "Dados oficiais SERPRO & DETRAN-RJ" },
  { icon: Scale, texto: "Conforme a Lei 14.071/2020" },
  { icon: Lock, texto: "Criptografia TLS de ponta a ponta" },
  { icon: Sparkles, texto: "Análise por IA em segundos" },
];

const dores = [
  {
    icon: MailWarning,
    titulo: "Ninguém te avisa em tempo real",
    texto:
      "Não existe alerta automático oficial. A maioria descobre a multa pelo boleto em papel — semanas depois, quando o prazo de 30 dias para apresentar defesa prévia já venceu.",
  },
  {
    icon: IdCard,
    titulo: "Os pontos somam sem aviso",
    texto:
      "A CNH pode ser suspensa ao atingir o limite de pontos em 12 meses (20, 30 ou 40, conforme a Lei 14.071/2020), e a maioria só descobre o tamanho do problema quando já é tarde para agir.",
  },
  {
    icon: Briefcase,
    titulo: "Pra quem dirige por profissão, é o emprego em jogo",
    texto:
      "Motorista de app, taxista, entregador de moto: perder a CNH não é só um transtorno, é perder a fonte de renda. E quem exerce atividade remunerada tem uma regra de pontuação diferente.",
  },
  {
    icon: Timer,
    titulo: "Recorrer sozinho consome tempo (e dinheiro) que você não tem",
    texto:
      "Entender o artigo do CTB, avaliar se vale a pena, redigir a defesa com fundamentação legal — isso normalmente custa uma consulta com despachante. A maioria acaba não fazendo, e paga o valor cheio mesmo quando tinha argumento.",
  },
];

const timeline = [
  {
    hora: "10:00",
    titulo: "Verificação automática",
    texto:
      "O Sentinela consulta SERPRO/RADAR (base nacional) e DETRAN-RJ em paralelo, cruzando as duas fontes. Você não faz nada.",
    orgaos: ["SERPRO/RADAR", "DETRAN-RJ"],
    icon: Search,
  },
  {
    hora: "10:01",
    titulo: "Análise do CTB ponta a ponta",
    texto:
      "A IA lê o código da infração, identifica o artigo, calcula a chance real de recurso e estima o prazo de defesa.",
    icon: Scale,
  },
  {
    hora: "10:02",
    titulo: "Aviso por e-mail e WhatsApp",
    texto:
      "Sem multa: confirmação de tranquilidade. Com multa: o que aconteceu, quanto tempo você tem — com PDF detalhado em anexo no e-mail.",
    icon: Bell,
  },
  {
    hora: "10:03",
    titulo: "Defesa pronta se valer recurso",
    texto: "O texto da defesa prévia já sai gerado, com fundamentação legal. Você só revisa e protocola.",
    icon: FileText,
  },
];

const diferenciais = [
  {
    icon: Radar,
    titulo: "Duas fontes cruzadas",
    texto:
      "SERPRO/RADAR (base nacional) e DETRAN-RJ consultados em paralelo todos os dias. Cada multa mostra qual fonte confirmou — ou as duas.",
  },
  {
    icon: Scale,
    titulo: "IA que entende o CTB de verdade",
    texto: "Não é uma busca genérica: é análise com o artigo certo, a gravidade certa e a chance real de recurso.",
  },
  {
    icon: FileText,
    titulo: "Defesa gerada automaticamente",
    texto: "Se vale recorrer, o texto da defesa prévia já está pronto com fundamentação legal. Só revisar e baixar.",
  },
  {
    icon: Zap,
    titulo: "D-1 — você sabe no mesmo dia",
    texto: "Verificação todos os dias às 10:00. Você não espera o boleto chegar para descobrir a multa.",
  },
  {
    icon: Bell,
    titulo: "E-mail com PDF + WhatsApp",
    texto: "Cada multa nova chega com um PDF detalhado em anexo no e-mail, além do alerta no WhatsApp.",
  },
  {
    icon: BadgePercent,
    titulo: "Onde conseguir desconto",
    texto: "Se não valer recurso, a IA indica onde pagar com desconto: PagTesouro, parcelamento, Refis.",
  },
  {
    icon: IdCard,
    titulo: "Saiba antes de perder a CNH",
    texto:
      "Pontuação calculada automaticamente conforme a Lei 14.071/2020, considerando se você exerce atividade remunerada. Você vê o risco antes da suspensão, não depois.",
  },
  {
    icon: Car,
    titulo: "Carro e moto, num só painel",
    texto: "Cadastre toda a sua frota — carros e motos — e acompanhe todos os veículos no mesmo lugar.",
  },
];

const faqs = [
  {
    pergunta: "O Sentinela substitui um advogado ou despachante?",
    resposta:
      "Não. O Sentinela automatiza a parte que consome mais tempo — descobrir a multa a tempo e montar a base da defesa com fundamentação legal. Para casos mais complexos ou recursos em instâncias superiores (JARI, CETRAN), o ideal ainda é contar com um profissional. Mas para a grande maioria das multas do dia a dia, o texto gerado já é suficiente para protocolar.",
  },
  {
    pergunta: "Preciso pagar algo para usar?",
    resposta:
      "Não. Cadastro, monitoramento diário e alertas por e-mail e WhatsApp não têm custo. Não pedimos cartão de crédito no cadastro.",
  },
  {
    pergunta: "Funciona para moto e carro?",
    resposta:
      "Sim. Você pode cadastrar quantos veículos quiser — carros e motos — e escolher o tipo de cada um no cadastro.",
  },
  {
    pergunta: "Meus dados estão seguros?",
    resposta:
      "Sim. A comunicação com o Sentinela é criptografada (TLS) e seus dados (CPF, placa, RENAVAM) são usados exclusivamente para consultar as bases oficiais de multas do seu veículo — nunca compartilhados com terceiros.",
  },
  {
    pergunta: "Funciona em outros estados, além do Rio de Janeiro?",
    resposta:
      "A base nacional (SERPRO/RADAR) cobre infrações de qualquer estado. Já a segunda fonte, DETRAN-RJ, é específica do Rio de Janeiro — por isso a cobertura mais completa hoje é para veículos emplacados no RJ.",
  },
  {
    pergunta: "Preciso instalar um aplicativo?",
    resposta:
      "Não é obrigatório — o Sentinela funciona direto no navegador. Mas se preferir, dá para instalar como um app (PWA) direto do navegador, sem passar por loja de aplicativos, e os alertas continuam chegando por e-mail e WhatsApp de qualquer forma.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-fundo bg-noise overflow-hidden selection:bg-verdeSinal/30 relative">
      {/* Background gradients — sutis, compatíveis com o tema claro */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-verdeSinal/[0.08] blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] right-0 w-[600px] h-[500px] bg-azulMercosul/[0.06] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-roxoPremium/[0.05] blur-[130px] rounded-full pointer-events-none" />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="relative z-20 glass-nav sticky top-0 mx-auto">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-verdeSinal/20 to-verdeSinal/5 border border-verdeSinal/30">
              <ShieldCheck className="h-5 w-5 text-verdeSinal" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-texto">
              Sentinela<span className="text-verdeSinal">.AI</span>
            </span>
          </div>
          <nav className="flex items-center gap-6 md:gap-8 text-sm font-medium text-nevoa">
            <a href="#como-funciona" className="hidden md:block hover:text-texto transition-colors">
              Como funciona
            </a>
            <a href="#diferenciais" className="hidden md:block hover:text-texto transition-colors">
              Recursos
            </a>
            <a href="#faq" className="hidden md:block hover:text-texto transition-colors">
              Dúvidas
            </a>
            <ThemeToggle />
            <Link href="/entrar" className="hidden sm:block hover:text-texto transition-colors">
              Entrar
            </Link>
            <Link
              href="/entrar"
              className="group relative overflow-hidden rounded-xl bg-verdeSinal px-5 py-2.5 font-semibold text-white hover:bg-verdeSinal/90 transition-all duration-300 flex items-center gap-2 shadow-[0_8px_20px_-6px_rgba(22,163,74,0.5)]"
            >
              Criar conta grátis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 pt-16 pb-20 md:grid-cols-2 md:gap-12 md:pt-24 md:pb-28 lg:pt-28">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-verdeSinal/25 bg-verdeSinal/[0.08] px-4 py-1.5 text-xs font-medium text-verdeSinal mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verdeSinal opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-verdeSinal" />
            </span>
            Monitoramento automático · todos os dias às 10:00
          </div>

          <h1 className="font-display text-4xl font-bold leading-[1.15] sm:text-5xl md:text-6xl text-texto">
            A multa não avisa.
            <br />
            O prazo não espera.
            <br />
            <span className="text-gradient">Nós avisamos primeiro.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-texto/75 leading-relaxed border-l-2 border-borda pl-6">
            Hoje, nenhum órgão te avisa quando uma multa é registrada no seu nome. Você descobre pelo
            boleto — muitas vezes depois que o prazo de defesa já venceu. O Sentinela verifica sua
            placa todo dia em SERPRO/RADAR e DETRAN-RJ, e no mesmo dia te diz{" "}
            <span className="text-texto font-medium">
              o que aconteceu, quanto tempo você tem e se vale recorrer
            </span>{" "}
            — com a defesa já pronta para protocolar.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Link
              href="/entrar"
              className="group rounded-xl bg-verdeSinal px-8 py-4 font-bold text-white hover:bg-verdeSinal/90 transition-all duration-300 shadow-[0_10px_30px_-8px_rgba(22,163,74,0.5)] hover:shadow-[0_14px_36px_-8px_rgba(22,163,74,0.6)] hover:-translate-y-0.5 flex items-center gap-3"
            >
              <ShieldCheck className="w-5 h-5" />
              Monitorar minha placa grátis
            </Link>
            <div className="flex flex-col text-sm text-nevoa">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-verdeSinal" /> Cadastro em 30 segundos
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-verdeSinal" /> Sem cartão de crédito
              </span>
            </div>
          </div>

          {/* Stats rápidas */}
          <div className="mt-16 grid grid-cols-3 gap-4 sm:gap-6 pt-8 border-t border-borda">
            {[
              { valor: "2", label: "Fontes oficiais" },
              { valor: "10:00", label: "Verificação diária" },
              { valor: "IA", label: "Análise do CTB" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl sm:text-3xl font-bold text-texto">{s.valor}</p>
                <p className="text-[11px] sm:text-xs text-nevoaClara uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex justify-center lg:justify-end md:animate-float pt-6 md:pt-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-azulMercosul/10 to-verdeSinal/10 blur-3xl rounded-full -z-10 transform scale-110" />
          <div className="relative w-full max-w-sm md:max-w-md transform md:rotate-1 hover:rotate-0 transition-transform duration-500">
            <RadarStatus placa="KVX-1D34" status="sem-multa" ultimaVerificacao="hoje às 10:00" />
          </div>
        </div>
      </section>

      {/* ── Faixa de confiança ────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-borda bg-surface backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {confianca.map((c) => (
            <div key={c.texto} className="flex items-center gap-3">
              <c.icon className="w-4 h-4 text-nevoaClara shrink-0" />
              <span className="text-xs sm:text-sm text-nevoa leading-tight">{c.texto}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Dor / Agitação ────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-14 md:mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-texto">
              O sistema não foi feito pra <span className="text-vermelhoSinal">te avisar</span>
            </h2>
            <p className="mt-4 text-texto/70 text-base md:text-lg max-w-2xl mx-auto">
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
                  className="card rounded-2xl p-6 md:p-7 border-l-2 !border-l-vermelhoSinal/40 hover:!border-l-vermelhoSinal transition-colors"
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

      {/* ── Como funciona ─────────────────────────────────────────────────── */}
      <section id="como-funciona" className="relative z-10 py-20 md:py-28 border-t border-borda bg-surface backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-14 md:mb-20">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-verdeSinal/10 border border-verdeSinal/20 mb-6">
              <Clock className="w-6 h-6 text-verdeSinal" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-texto">
              Um dia inteiro de trabalho, <span className="text-verdeSinal">todo dia às 10:00</span>
            </h2>
            <p className="mt-4 text-texto/70 text-lg max-w-2xl mx-auto">
              Veja exatamente o que o Sentinela faz por você, automaticamente, enquanto você segue a sua vida.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-borda" />

            {timeline.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.hora} className="relative group">
                  <div className="card rounded-2xl p-6 h-full hover:-translate-y-1 transition-all duration-300 relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-2.5 rounded-lg bg-verdeSinal/10 text-verdeSinal">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-mono text-nevoa bg-asfalto px-2 py-1 rounded">{item.hora}</span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-texto mb-3">{item.titulo}</h3>
                    <p className="text-base text-texto/70 leading-relaxed">{item.texto}</p>

                    {item.orgaos && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {item.orgaos.map((o) => (
                          <span key={o} className="rounded border border-borda bg-asfalto px-2 py-1 text-xs text-texto/80">
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

      {/* ── Diferenciais ──────────────────────────────────────────────────── */}
      <section id="diferenciais" className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-texto">
              Tudo o que você precisa <span className="text-cyanReal">num só painel</span>
            </h2>
            <p className="mt-4 text-texto/70 text-lg">
              Construído para não apenas alertar, mas resolver. O Sentinela transforma dados
              burocráticos em decisões práticas.
            </p>
          </div>
          <Link href="/entrar" className="text-verdeSinal hover:text-texto text-sm font-medium flex items-center gap-2 group shrink-0">
            Começar agora <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {diferenciais.map((d) => {
            const Icon = d.icon;
            return (
              <div key={d.titulo} className="card rounded-2xl p-7 group hover:-translate-y-1 transition-transform duration-300">
                <div className="w-11 h-11 rounded-xl bg-verdeSinal/10 flex items-center justify-center mb-5 text-verdeSinal">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-base font-bold text-texto">{d.titulo}</h3>
                <p className="mt-3 text-sm text-texto/70 leading-relaxed">{d.texto}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Comparação ────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 md:py-28 border-t border-borda">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-texto">Com ou sem Sentinela</h2>
          </div>

          <div className="card !rounded-3xl overflow-hidden relative">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-borda relative">
                <div className="flex items-center gap-3 mb-8">
                  <span className="p-1.5 rounded-full bg-vermelhoSinal/10 text-vermelhoSinal">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-nevoaClara">Sem Sentinela</h3>
                </div>
                <ul className="space-y-6 text-base text-texto/80">
                  <li className="flex gap-4">
                    <span className="text-vermelhoSinal mt-1">✗</span> Descobre a multa pelo boleto em papel
                  </li>
                  <li className="flex gap-4">
                    <span className="text-vermelhoSinal mt-1">✗</span> Prazo de defesa quase sempre já vencido
                  </li>
                  <li className="flex gap-4">
                    <span className="text-vermelhoSinal mt-1">✗</span> Paga o valor cheio da multa
                  </li>
                  <li className="flex gap-4">
                    <span className="text-vermelhoSinal mt-1">✗</span> Precisa contratar despachante para recorrer
                  </li>
                </ul>
              </div>

              <div className="p-8 md:p-12 relative">
                <div className="flex items-center gap-3 mb-8">
                  <span className="p-1.5 rounded-full bg-verdeSinal/10 text-verdeSinal">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-verdeSinal">Com Sentinela</h3>
                </div>
                <ul className="space-y-6 text-base text-texto">
                  <li className="flex gap-4">
                    <span className="text-verdeSinal mt-1">✓</span> Aviso no mesmo dia, por e-mail e WhatsApp
                  </li>
                  <li className="flex gap-4">
                    <span className="text-verdeSinal mt-1">✓</span> Prazo integral para decidir e agir
                  </li>
                  <li className="flex gap-4">
                    <span className="text-verdeSinal mt-1">✓</span> A IA indica onde pagar com desconto
                  </li>
                  <li className="flex gap-4">
                    <span className="text-verdeSinal mt-1">✓</span> Defesa com fundamentação legal já pronta
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="relative z-10 py-20 md:py-28 border-t border-borda bg-surface backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-texto">Perguntas frequentes</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.pergunta} className="card rounded-2xl p-5 md:p-6 group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between gap-4 cursor-pointer font-display font-semibold text-texto list-none">
                  {f.pergunta}
                  <span className="shrink-0 w-7 h-7 rounded-full bg-asfalto flex items-center justify-center text-nevoa group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-sm text-texto/70 leading-relaxed">{f.resposta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-20 md:py-28 text-center">
        <div className="card !rounded-3xl border !border-verdeSinal/25 bg-gradient-to-b from-verdeSinal/[0.07] to-transparent p-8 md:p-16 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-texto">
              Comece a se proteger. <span className="text-verdeSinal">Sem custo.</span>
            </h2>
            <p className="mt-6 text-texto/70 text-lg max-w-xl mx-auto">
              Cadastre sua placa em menos de 60 segundos. A primeira verificação roda no próximo
              ciclo, às 10:00.
            </p>
            <Link
              href="/entrar"
              className="mt-10 inline-flex items-center justify-center gap-3 rounded-xl bg-verdeSinal px-10 py-5 font-bold text-white hover:bg-verdeSinal/90 transition-all duration-300 shadow-[0_10px_30px_-8px_rgba(22,163,74,0.5)] hover:shadow-[0_14px_36px_-8px_rgba(22,163,74,0.6)] hover:-translate-y-1"
            >
              <Zap className="w-5 h-5" />
              Ativar meu monitoramento
            </Link>
            <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-xs text-nevoa">
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" /> Criptografia TLS
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Sem cartão de crédito
              </span>
              <span className="flex items-center gap-2">
                <Bike className="w-4 h-4" /> Carro e moto
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-borda bg-surface px-6 py-12 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-nevoa">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-nevoaClara" />
            <span className="font-display font-bold text-texto tracking-wide text-sm">
              Sentinela<span className="text-verdeSinal">.AI</span>
            </span>
          </div>
          <p className="text-xs text-nevoaClara">© 2026 Sentinela · Rio de Janeiro</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-texto transition-colors">
              Termos
            </a>
            <a href="#" className="hover:text-texto transition-colors">
              Privacidade
            </a>
            <Link href="/entrar" className="text-verdeSinal hover:text-texto transition-colors font-medium">
              Entrar
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
