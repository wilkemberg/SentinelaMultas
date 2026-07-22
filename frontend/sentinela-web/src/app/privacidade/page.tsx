import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata = { title: "Política de Privacidade — Sentinela" };

export default function PrivacidadePage() {
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
          <h1 className="font-display text-3xl font-bold text-texto mb-2">Política de Privacidade</h1>
          <p className="text-sm text-nevoa mb-10">
            Última atualização: 22 de julho de 2026 — em conformidade com a Lei Geral de Proteção de Dados
            (Lei 13.709/2018, LGPD).
          </p>

          <div className="space-y-8 text-sm leading-relaxed text-texto/85">
            <section>
              <h2 className="font-display text-lg font-semibold text-texto mb-2">1. Quais dados coletamos</h2>
              <p className="mb-2">Para que o monitoramento funcione, coletamos:</p>
              <p>
                Dados de conta: nome, e-mail, WhatsApp e senha (armazenada apenas como hash, nunca em texto puro).
                Dados de identificação: CPF e, se você optar por validar sua CNH, número de registro, nome da mãe,
                categoria e situação da CNH. Dados de veículo: placa, RENAVAM, UF e, quando aplicável, o CPF do
                proprietário (se for diferente do titular da conta). Dados de uso: data de criação da conta, último
                login e o histórico de multas detectadas para os veículos monitorados.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-texto mb-2">2. Para que usamos esses dados</h2>
              <p>
                Usamos seus dados exclusivamente para viabilizar o monitoramento diário de multas (consultando a
                base nacional SERPRO/RADAR com sua placa e RENAVAM), gerar a análise de IA sobre cada multa
                encontrada, montar o cartão de identificação da CNH, calcular a pontuação estimada da carteira e
                enviar as notificações por e-mail e/ou WhatsApp que você configurar. Não usamos seus dados para
                publicidade nem os vendemos a terceiros.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-texto mb-2">3. Com quem compartilhamos dados</h2>
              <p>
                Para operar, o Sentinela repassa o mínimo necessário de dados a fornecedores que atuam como
                operadores, sob suas próprias políticas de segurança: Infosimples (consulta placa/RENAVAM na base
                SERPRO/RADAR e, se solicitada, validação de CNH junto ao SENATRAN), Resend (envio dos e-mails de
                notificação), e, quando essa função for ativada por você, um provedor de mensageria para envio de
                alertas por WhatsApp. Também usamos um provedor de inteligência artificial (Anthropic) para gerar a
                análise do enquadramento no CTB e o texto de defesa — apenas os dados da própria multa (não seus
                dados pessoais de identificação) são enviados para essa análise.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-texto mb-2">4. Por quanto tempo guardamos os dados</h2>
              <p>
                Mantemos seus dados enquanto sua conta estiver ativa. Se você excluir sua conta, o monitoramento e as
                notificações são desligados imediatamente; o histórico de multas e veículos já registrado é mantido
                por um período adicional como registro histórico (inclusive porque pode ter valor para eventual
                defesa administrativa em curso), mas deixa de ser usado para qualquer finalidade além do próprio
                registro. Você pode solicitar a exclusão completa desses dados residuais entrando em contato pelo
                e-mail de suporte.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-texto mb-2">5. Seus direitos como titular (LGPD)</h2>
              <p>
                Você pode, a qualquer momento: confirmar quais dados temos sobre você, corrigir dados incompletos ou
                desatualizados diretamente na aba "Minha Conta", solicitar a portabilidade dos seus dados, revogar o
                consentimento dado no cadastro (o que implica encerrar a conta) e solicitar a exclusão dos seus
                dados, nos limites do item 4 acima. Para exercer qualquer um desses direitos além do que já está
                disponível no painel, entre em contato pelo e-mail de suporte informado no rodapé do site.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-texto mb-2">6. Segurança</h2>
              <p>
                Senhas são armazenadas com hash (PBKDF2) e nunca em texto puro. As comunicações com o Sentinela usam
                criptografia TLS. Links de redefinição de senha e verificação de e-mail são de uso único e expiram
                em curto prazo (1 hora e 24 horas, respectivamente).
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-texto mb-2">7. Alterações desta política</h2>
              <p>
                Podemos atualizar esta Política periodicamente. Mudanças relevantes na forma como tratamos seus
                dados serão comunicadas por e-mail antes de entrarem em vigor.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-texto mb-2">8. Contato</h2>
              <p>
                Dúvidas sobre esta Política ou sobre o tratamento dos seus dados podem ser enviadas para o e-mail de
                suporte informado no rodapé do site.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
