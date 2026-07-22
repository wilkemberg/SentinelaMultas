import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata = { title: "Termos de Uso — Sentinela" };

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-fundo px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-3 mb-10 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-verdeSinal/10">
            <ShieldCheck className="h-5 w-5 text-verdeSinal" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-texto">
            Sentinela<span className="text-verdeSinal">.AI</span>
          </span>
        </Link>

        <div className="card rounded-3xl p-8 md:p-12">
          <h1 className="font-display text-3xl font-bold text-texto mb-2">Termos de Uso</h1>
          <p className="text-sm text-nevoa mb-10">Última atualização: 22 de julho de 2026</p>

          <div className="space-y-8 text-sm leading-relaxed text-texto/85">
            <section>
              <h2 className="font-display text-lg font-semibold text-texto mb-2">1. Sobre o serviço</h2>
              <p>
                O Sentinela é um serviço de monitoramento automático de multas de trânsito. A partir da placa e do
                RENAVAM de um veículo cadastrado, consultamos diariamente a base nacional oficial (SERPRO/RADAR,
                via RENAINF) e avisamos por e-mail e/ou WhatsApp quando há uma multa nova, incluindo uma análise
                automatizada por IA sobre o enquadramento no Código de Trânsito Brasileiro (CTB) e a viabilidade de
                recurso.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-texto mb-2">2. Cadastro e responsabilidade pelos dados</h2>
              <p>
                Para usar o Sentinela, você precisa criar uma conta e informar dados como nome, e-mail, WhatsApp,
                CPF e, opcionalmente, dados da CNH e dos veículos monitorados. Você é responsável por manter essas
                informações corretas e atualizadas — dados incorretos podem impedir o monitoramento efetivo do seu
                veículo. Cada veículo só pode ser cadastrado por quem tem legitimidade para monitorá-lo (proprietário,
                condutor habitual ou responsável).
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-texto mb-2">3. Natureza informativa do serviço</h2>
              <p>
                O Sentinela é uma ferramenta de apoio e monitoramento — não substitui o acompanhamento oficial junto
                aos órgãos de trânsito, nem presta consultoria jurídica. As análises de recurso geradas por
                inteligência artificial são um ponto de partida para sua decisão, não uma garantia de resultado.
                Prazos legais (defesa prévia, recursos à JARI e ao CETRAN) são de responsabilidade do usuário
                confirmar diretamente com o órgão autuador antes de agir com base apenas no que o sistema informa.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-texto mb-2">4. Disponibilidade e limitações</h2>
              <p>
                Fazemos o possível para que o monitoramento diário rode sem falhas, mas o serviço depende de
                terceiros (bases de dados governamentais, provedores de e-mail e WhatsApp) que podem ficar
                indisponíveis ou instáveis fora do nosso controle. Não garantimos disponibilidade contínua nem a
                detecção de 100% das multas em 100% dos casos.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-texto mb-2">5. Cancelamento</h2>
              <p>
                Você pode encerrar sua conta a qualquer momento pela aba "Minha Conta", informando sua senha atual
                para confirmar. Ao encerrar, o monitoramento e as notificações são desligados imediatamente; o
                histórico de multas já detectadas permanece registrado, conforme detalhado na nossa Política de
                Privacidade.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-texto mb-2">6. Alterações destes termos</h2>
              <p>
                Podemos atualizar estes Termos de tempos em tempos para refletir mudanças no serviço ou na
                legislação. Alterações relevantes serão comunicadas por e-mail ou aviso no painel antes de entrarem
                em vigor.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-texto mb-2">7. Contato</h2>
              <p>
                Dúvidas sobre estes Termos podem ser enviadas para o e-mail de suporte informado no rodapé do site.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
