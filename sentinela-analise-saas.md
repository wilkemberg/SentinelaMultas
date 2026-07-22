# Sentinela: da aplicação atual a um SaaS completo

Análise do estado real do projeto (código, infraestrutura e operação) e um plano de implantação em fases até virar um produto vendável. O WhatsApp fica deliberadamente para o final, como pedido.

---

## 1. A notificação diária por e-mail — resposta direta

Boa notícia: a lógica já existe e já faz exatamente o que você descreveu. Todos os dias às 10:00, o `MonitoramentoDiarioJob` passa por cada veículo com monitoramento ativo e, ao final da verificação, sempre dispara uma notificação — `NotificarSemMultasAsync` quando não acha nada novo, ou `NotificarMultaEncontradaAsync` quando acha. Isso significa que, hoje, cada usuário já recebe um e-mail por veículo todo dia, dizendo se tem ou não multa nova. O mesmo acontece quando alguém clica em "Verificar agora" manualmente. Não falta código para isso — falta **fazer o e-mail sair de verdade para qualquer usuário**, e é aqui que mora o problema real.

O remetente configurado hoje (`onboarding@resend.dev`) é o endereço de teste que o Resend libera por padrão. Ele só entrega e-mails para o endereço que você usou para criar a conta no Resend — para qualquer outro destinatário, o envio falha silenciosamente ou cai em spam. Ou seja: em produção, com usuários reais, praticamente ninguém além de você receberia o e-mail. Esse é o único bloqueio real para "implantar a notificação por e-mail" — o código já está pronto.

Para resolver, faltam três passos, todos do lado do Resend (não exigem mudança de código):

1. Verificar um domínio seu no Resend (Settings → Domains → Add Domain), adicionando os registros DNS que eles pedem (SPF, DKIM, e geralmente um registro de retorno). Se você não tem domínio próprio ainda, esse é o primeiro item prático do plano abaixo — sem ele, não dá para sair do modo sandbox de nenhum provedor de e-mail transacional (Resend, SendGrid, Postmark, todos exigem domínio verificado da mesma forma).
2. Trocar `RESEND_REMETENTE` no `.env` de produção para usar esse domínio, por exemplo `Sentinela <alertas@seudominio.com.br>`.
3. Testar enviando para um e-mail que não seja o da sua conta Resend, para confirmar que chega.

Nada mais precisa mudar no `NotificacaoService` — a implementação já suporta anexo em PDF, corpo formatado e fallback silencioso (loga erro sem derrubar o job) se o envio falhar.

---

## 2. Panorama do que já existe hoje

O backend (.NET 8 + PostgreSQL) já resolve a parte mais difícil de um produto como esse: consulta cruzada em duas fontes oficiais (SERPRO/RADAR nacional e DETRAN-RJ), com fallback resiliente — só desiste se as duas falharem no mesmo ciclo. A cada multa nova, uma IA (Anthropic) lê o código de infração, identifica o artigo do CTB, avalia se vale recorrer, estima prazo e já gera o texto de defesa pronto. Isso é convertido em PDF por multa e anexado ao e-mail. Autenticação é via JWT, com onboarding obrigatório (nome, CPF, registro de CNH) e cadastro guiado do primeiro veículo. O frontend (Next.js, PWA instalável) tem dashboard completo, pontuação de CNH conforme a Lei 14.071/2020, área de conta, tour de boas-vindas e uma landing page já alinhada ao produto real.

Em resumo: a parte de **produto** (o que o Sentinela faz por dentro) está madura e bem construída. O que falta é inteiramente a parte de **operação de SaaS** — tudo que transforma "um sistema que funciona no meu Docker Compose local" em "um serviço que outras pessoas pagam para usar com confiança".

---

## 3. O que falta para ser um SaaS completo

### 3.1 Infraestrutura de produção real

Hoje o `docker-compose.yml` sobe Postgres, backend e frontend na sua própria máquina, com a senha do banco hardcoded (`mysecretpassword`) e sem HTTPS de verdade na frente (o `UseHttpsRedirection()` existe no código, mas não há certificado/proxy reverso configurado nesse compose). Para produção, você precisa de: um host real (Railway, Render, Fly.io, um VPS com Docker, ou Azure/AWS se quiser algo mais robusto), um banco Postgres gerenciado com backup automático (o volume Docker atual não tem backup nenhum — se o disco falhar, perde tudo), um domínio próprio, e um proxy reverso (Caddy resolve isso sozinho, com HTTPS automático via Let's Encrypt) na frente do frontend e da API.

### 3.2 Segurança e confiabilidade básica de conta

Não existe fluxo de "esqueci minha senha" — hoje, se um usuário perde a senha, ele fica travado para sempre, sem forma de recuperar. Também não existe verificação de e-mail no cadastro (qualquer um pode registrar com um e-mail que não é dele, e é justamente esse e-mail que recebe os alertas de multa). E não há rate limiting nos endpoints de login/registro, o que deixa a porta aberta para força bruta. Esses três itens são pré-requisito de qualquer SaaS que lida com dados sensíveis (CPF, RENAVAM) antes de aceitar usuários que você não conhece pessoalmente.

### 3.3 Conformidade legal (LGPD)

O app coleta CPF, RENAVAM, WhatsApp e dados de CNH — dados pessoais sensíveis pela LGPD. Hoje não existem páginas de Termos de Uso nem Política de Privacidade reais (o rodapé aponta para "#"), não há mecanismo de exclusão de conta/dados a pedido do usuário, e não há registro de consentimento no cadastro. Para operar como negócio (mesmo pequeno), isso precisa existir antes do primeiro usuário pagante — não é opcional, é exigência legal.

### 3.4 Controle de custo variável (Infosimples)

Cada consulta ao SERPRO/RADAR, ao DETRAN-RJ e à validação de CNH é uma chamada paga à Infosimples. Hoje o job diário consulta **todos** os veículos ativos de **todos** os usuários, sem limite algum por conta. Isso é ótimo para poucos usuários, mas é a primeira coisa que quebra o modelo financeiro se o produto crescer sem controle: custo variável crescendo linearmente com a base de usuários, sem nenhum tipo de teto por plano. Antes de vender assinaturas, você precisa decidir quantos veículos cada plano permite e, tecnicamente, aplicar esse limite no cadastro de veículo (`VeiculosController.Criar` já é o lugar certo para essa checagem).

### 3.5 Modelo de cobrança

Não existe nenhuma estrutura de plano, assinatura ou pagamento no código hoje — o app é, tecnicamente, 100% gratuito e ilimitado para qualquer um que se cadastre. Virar SaaS de verdade exige decidir a régua de preço (ex.: grátis para 1 veículo, pago para frota), integrar um gateway (Stripe tem SDK mais maduro; Mercado Pago é mais natural para clientes brasileiros pagando em real), e guardar o status do plano no `Usuario` (algo como `PlanoId`, `AssinaturaAtiva`, `AssinaturaExpiraEm`) para aplicar os limites do item 3.4.

### 3.6 Preferência de notificação exposta na UI

O backend já suporta `NotificarEmail` e `NotificarWhatsApp` por usuário, mas não existe nenhum lugar na tela onde a pessoa possa ligar/desligar isso — hoje só é possível mudar direto no banco. É um ajuste pequeno (um toggle na aba Minha Conta) mas importante para dar controle ao usuário antes de ativar o WhatsApp.

### 3.7 Observabilidade e confiabilidade operacional

O job diário roda como um `BackgroundService` simples, em memória, dentro do próprio processo da API — se o container reiniciar no meio da execução (deploy, crash, restart do host), o que não foi processado naquele ciclo simplesmente não roda de novo até o dia seguinte, sem re-tentativa e sem qualquer alerta de que algo falhou. Não há logging estruturado nem monitoramento de erro (Sentry, Application Insights, ou similar) — hoje, se algo quebrar em produção, a única forma de saber é olhando o log bruto do container manualmente. Para um SaaS que promete "todo dia às 10:00 você recebe seu e-mail", isso precisa de solidez: idealmente um scheduler mais robusto (Hangfire, ou um cron job externo chamando um endpoint) com re-tentativa e alerta automático se o job não rodar ou falhar em massa.

### 3.8 Qualidade e testes

Não existe nenhum teste automatizado no projeto (nem unitário, nem de integração) e não há pipeline de CI/CD — todo deploy hoje é manual (`docker compose build && up`). Isso é aceitável numa fase inicial, mas vira risco real assim que existirem usuários pagantes: qualquer mudança pode quebrar algo em produção sem que ninguém perceba antes do usuário reclamar.

### 3.9 Operação e suporte

Não existe painel administrativo (para você ver quantos usuários existem, quais estão ativos, revisar uma verificação que falhou, ou reenviar manualmente uma notificação), nem canal de suporte formal (um e-mail de contato, um chat). Para um SaaS pequeno isso pode começar simples (um e-mail de suporte e queries manuais no banco), mas em algum momento vira gargalo.

---

## 4. Plano de implantação em fases

**Fase 0 — Fazer o e-mail funcionar de verdade (curtíssimo prazo).**
Verificar domínio no Resend, atualizar o remetente, testar envio para terceiros. Sem essa fase, nenhuma das seguintes faz sentido, porque o núcleo da proposta de valor (ser avisado) não chega no destinatário.

**Fase 1 — Infraestrutura mínima de produção.**
Domínio próprio, hospedagem real (backend + frontend + Postgres gerenciado com backup), HTTPS de verdade via proxy reverso, variáveis de ambiente de produção separadas das de desenvolvimento. Ao final dessa fase, o Sentinela deixa de depender do seu computador ligado para funcionar.

**Fase 2 — Segurança e conformidade essenciais.**
Recuperação de senha, verificação de e-mail no cadastro, rate limiting no login, páginas reais de Termos e Privacidade, mecanismo de exclusão de conta. Essa fase é o que separa "projeto pessoal" de "algo que você pode divulgar publicamente sem risco".

**Fase 3 — Controle de custo e modelo de cobrança.**
Definir os planos (o que é grátis, o que é pago, limite de veículos por plano), aplicar o limite tecnicamente no cadastro de veículo, integrar gateway de pagamento (Stripe ou Mercado Pago) e guardar o status da assinatura no usuário. Essa é a fase que efetivamente transforma o projeto em negócio.

**Fase 4 — Confiabilidade operacional.**
Logging estruturado, monitoramento de erro (Sentry ou similar), scheduler mais robusto para o job diário com re-tentativa e alerta se ele não rodar, e um painel administrativo básico para você acompanhar a operação sem precisar entrar direto no banco.

**Fase 5 — Qualidade e crescimento.**
Testes automatizados nos pontos críticos (autenticação, verificação de multa, geração de defesa), pipeline de CI/CD simples, toggle de preferências de notificação na UI, e-mails transacionais adicionais (boas-vindas, cobrança, resumo semanal opcional).

**Fase 6 — WhatsApp (por último, como combinado).**
A integração com Z-API já está codificada e só precisa de credenciais reais para ativar — mas antes de ligar esse canal vale ter o toggle de preferências (Fase 5) pronto, para o usuário poder escolher receber só e-mail, só WhatsApp, ou os dois, sem você precisar mexer no banco manualmente.

---

Cada fase pode virar uma conversa própria quando você quiser começar a implementar — a Fase 0 (e-mail de verdade) é a mais rápida e a que eu recomendo atacar primeiro, já que sem ela nenhuma outra fase entrega valor real para um usuário de fora.
