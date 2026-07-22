# Sentinela: modelo de cobrança e divulgação (implantar por último, antes do lançamento)

Este documento cobre as duas peças que ficaram de fora da rodada de melhorias operacionais, por decisão sua: como cobrar pelo Sentinela e como divulgá-lo. Nenhuma linha de código foi criada para isso ainda — é a base de decisão para quando você quiser implementar.

## 1. Modelo de cobrança

### 1.1 Estrutura de planos sugerida

A variável que mais importa aqui é o número de veículos monitorados, porque é ela que determina o custo variável (cada veículo monitorado gera uma consulta paga à Infosimples por dia). Uma estrutura simples e comum em SaaS brasileiros:

Plano Grátis — 1 veículo, e-mail apenas (sem WhatsApp), serve como isca para o usuário experimentar o produto e sentir o valor da primeira multa detectada automaticamente.

Plano Motorista — R$ 19,90 a R$ 29,90/mês, até 2 veículos, e-mail + WhatsApp, indicado para pessoa física (motorista de app, autônomo, família com 1-2 carros).

Plano Frota Pequena — R$ 79,90 a R$ 129,90/mês, até 10 veículos, mesmas notificações, indicado para pequenas transportadoras, frotistas de aplicativo com carro próprio + agregados, oficinas que gerenciam carros de clientes.

Plano Frota — sob consulta, acima de 10 veículos, com desconto por volume, indicado para empresas de logística, locadoras, frotas corporativas.

Uma alternativa mais simples para começar (recomendada para o lançamento): dois planos só — Grátis (1 veículo) e Pro (R$ 24,90/mês, até 5 veículos, e-mail + WhatsApp) — e só desenhar o plano Frota quando o primeiro cliente com frota grande aparecer pedindo.

### 1.2 Por que cobrar por veículo, não por usuário

O custo real do Sentinela escala com o número de veículos monitorados (é isso que gera consultas pagas), não com o número de contas de usuário. Cobrar por usuário deixaria brechas óbvias (uma família toda usando uma conta com 5 carros no plano grátis) e desalinha preço com custo.

### 1.3 Período de teste e conversão

Um trial de 14 dias no plano Pro completo (sem pedir cartão de crédito antes) tende a converter melhor do que pedir pagamento na hora do cadastro — a pessoa só sente o valor real quando recebe o primeiro e-mail confirmando "sem multas hoje" ou, melhor ainda, quando o Sentinela pega uma multa que ela não sabia que tinha. Vale considerar também: desconto de 15-20% no plano anual (prática padrão em SaaS, melhora o caixa e reduz o churn mensal).

### 1.4 Gateway de pagamento

Para cobrança recorrente em reais, as duas opções mais maduras são Stripe (excelente SDK, suporta Brasil via Stripe Connect/local acquiring, mas historicamente mais forte em cartão internacional) e Mercado Pago (assinatura nativa em reais, Pix, boleto — meios de pagamento que o público brasileiro usa mais no dia a dia, especialmente Pix). Para o público-alvo do Sentinela (motorista de aplicativo, pequeno frotista), Mercado Pago com suporte a Pix recorrente tende a converter melhor que só cartão. Vale considerar aceitar os dois desde o início ou começar só com Mercado Pago e adicionar Stripe depois se houver demanda de cartão internacional.

### 1.5 O que muda no produto quando isso for implementado

Um campo de plano e status de assinatura no usuário (ex.: `PlanoId`, `AssinaturaAtiva`, `AssinaturaExpiraEm`, já mapeado no documento de análise de SaaS). Um limite de veículos aplicado no cadastro (`VeiculosController.Criar`), com uma mensagem clara de upgrade quando o limite for atingido, em vez de simplesmente bloquear. Uma tela de "Planos" no painel, com o estado atual do usuário e um caminho de upgrade de um clique. Webhook do gateway de pagamento para atualizar o status da assinatura automaticamente (pagamento recusado, assinatura cancelada, etc.) — sem isso, alguém que cancelar o cartão continuaria com acesso Pro indefinidamente.

## 2. Como divulgar o Sentinela

### 2.1 Quem é o cliente mais provável primeiro

Motoristas de aplicativo (Uber, 99) e taxistas — é o público com maior sensibilidade ao problema: perder pontos da CNH é perder a fonte de renda, e o Sentinela já tem a regra de pontuação de atividade remunerada pronta para isso. Pequenos frotistas e donos de oficina/despachante que atendem motoristas — vendem o Sentinela para os próprios clientes como um serviço a mais. Qualquer dono de carro no Rio de Janeiro que já levou uma multa "surpresa" — é o gatilho emocional mais forte para conversão (a dor já aconteceu, a pessoa está buscando solução).

### 2.2 Canais de aquisição sugeridos, em ordem de custo/esforço

Grupos e comunidades de motoristas de aplicativo no WhatsApp/Telegram/Facebook — esses grupos já existem, são ativos e o problema de multas é pauta recorrente neles. Custo baixo, esforço de participar organicamente (não só postar link) é alto, mas o retorno tende a ser o melhor custo-benefício no início. Parcerias com despachantes, escritórios de defesa de multa e oficinas — eles já têm o cliente com o problema na porta; o Sentinela vira uma ferramenta que eles oferecem ou indicam, com comissão por indicação. SEO/conteúdo — artigos respondendo perguntas reais que as pessoas buscam no Google ("como saber se tenho multa no RJ", "prazo para recorrer de multa", "quantos pontos suspende a CNH 2026") atraem tráfego orgânico de quem já está no momento de dor, sem custo de mídia recorrente. Google Ads segmentado por essas mesmas buscas — custo mais alto, mas captura intenção de compra imediata; vale testar com orçamento pequeno primeiro. Instagram/TikTok com conteúdo educativo sobre CTB e pontuação de CNH — funciona bem para o público motorista de aplicativo, que consome bastante conteúdo nessas redes; menos direto para conversão, mais para construir reconhecimento de marca. Programa de indicação (referral) — dar 1 mês grátis para quem indica e para quem é indicado; baixo custo, boa adequação a um produto que se beneficia de "efeito manada" dentro dos mesmos grupos de motoristas.

### 2.3 Posicionamento e mensagem central

A landing page já reflete a mensagem certa (você não descobre a multa a tempo, o Sentinela avisa no mesmo dia), mas vale reforçar esse ângulo em qualquer material de divulgação: o problema não é "ter multa", é "descobrir tarde demais para recorrer". Esse é o gancho que diferencia o Sentinela de simplesmente "consultar o Detran de vez em quando".

### 2.4 Sequência recomendada de lançamento

Validar manualmente com 10-20 usuários reais (motoristas de aplicativo conhecidos, grupos pequenos) antes de qualquer investimento em mídia paga — o objetivo é confirmar que o produto entrega valor de verdade e coletar depoimentos/casos reais para usar como prova social. Só depois de ter esse validador social, investir em conteúdo/SEO (mais lento para começar a funcionar, por isso começa cedo) e em parcerias com despachantes/oficinas (o canal com melhor custo-benefício de médio prazo). Testar mídia paga (Google Ads, Instagram) só depois de ter a cobrança funcionando de ponta a ponta — não faz sentido pagar por tráfego para um produto que ainda não sabe cobrar.
