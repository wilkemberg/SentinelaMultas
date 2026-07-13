# Sentinela — Análise do Projeto e Plano de Evolução (RJ)

Documento gerado em 12/07/2026. Cobre: estado atual do código, correção sobre as fontes de multa solicitadas, arquitetura de automação diária, motor de IA de defesa, tela de pontuação de CNH e recomendações de design.

---

## 1. Resumo executivo

O projeto já não é uma ideia no papel: existe um esqueleto funcional razoavelmente maduro. Backend em .NET 8 com models de Usuário/Veículo/Multa, um job diário às 07:00 que consulta multas via Infosimples, manda o resultado para o Claude analisar à luz do CTB, e notifica por e-mail (Resend) e WhatsApp (Z-API). O frontend em Next.js já tem landing page, login e um dashboard PWA com visual "terminal tático" (HUD escuro, neon verde, glassmorphism) bem consistente e com identidade própria — chamado "Sentinela.AI".

O que falta para o que você descreveu se divide em três blocos: (1) uma correção de escopo sobre quais das seis entidades citadas realmente existem como fonte de dados separada, porque duas delas não emitem multa de trânsito da forma que você imagina; (2) a tela de pontuação de CNH, que não existe ainda no modelo de dados nem no frontend; e (3) o mecanismo de "cada defesa tem que ser diferente", que hoje não existe — o motor de IA gera uma defesa boa, mas nada impede que duas defesas para infrações idênticas saiam quase iguais.

---

## 2. Correção importante sobre as seis entidades

Antes de desenhar a integração, uma checagem jurídica é necessária, porque nem toda "entidade que aparece numa blitz" é uma fonte de dados de multa independente. No Brasil, quem registra formalmente uma infração é sempre um **órgão executivo de trânsito** com competência definida pelo CTB (art. 21 e 24) — é esse órgão que aparece no banco de dados como "órgão autuador", não quem fisicamente parou o carro.

**DETRAN-RJ** é o órgão executivo estadual de trânsito. Cobre autuações em rodovias estaduais e é também o órgão registrador de qualquer autuação lavrada por policiais militares em blitz dentro do estado (a PM não tem base de dados de multa própria — quando ela autua, o auto entra no sistema do DETRAN-RJ). Ou seja: **"Polícia Militar" não é uma fonte separada**, ela já está contida no DETRAN-RJ.

**Prefeitura do Rio / CET-Rio / Guarda Municipal** também não são três fontes distintas. A Secretaria Municipal de Transportes (SMTR) é a pasta, a CET-Rio é a companhia que executa a engenharia e fiscalização de trânsito no município, e a Guarda Municipal só pode autuar porque atua sob convênio com o sistema de trânsito municipal, como agente credenciado — os autos de todas as três entram no mesmo sistema municipal, hoje consultável em `sgtu.rio.rj.gov.br` (SMTR) e no portal Carioca Digital. Vale registrar que a competência municipal é limitada por lei: guarda municipal e CET-Rio só podem autuar infrações de circulação, estacionamento e parada — nunca aplicar suspensão de CNH ou apreensão de veículo, que são exclusividade dos órgãos estaduais/federais. **"Prefeitura RJ", "CET-Rio" e "Guarda Municipal" são, na prática, uma única fonte de dados.**

**Polícia Federal** não multa trânsito — a PF cuida de fronteiras, imigração e crimes federais. Quem fiscaliza rodovias federais (BR-040, BR-101, trechos federais da Linha Vermelha etc.) é a **Polícia Rodoviária Federal (PRF)**, que é outro órgão. Presumo que foi isso que você quis dizer, e vou seguir com PRF — mas vale confirmar.

Resultado prático: em vez de seis fontes, existem **três bases de dados reais** para o MVP em RJ — estadual (DETRAN-RJ, que já inclui PM), municipal (Prefeitura/CET-Rio, que já inclui Guarda Municipal) e federal (PRF, via sistema nacional RENAINF/SENATRAN). E é exatamente isso que o código já implementado faz: `MultiOrgaoConsultaService` já consulta os três em paralelo via Infosimples. Ou seja, a arquitetura de fontes que você pediu **já está certa no esqueleto atual** — o trabalho que falta é validar os endpoints e confirmar os contratos de campo, não redesenhar a integração.

---

## 3. Onde buscar cada fonte, concretamente

| Fonte | Cobertura | Caminho recomendado | Observação |
|---|---|---|---|
| DETRAN-RJ (inclui PM) | Multas estaduais RJ | Infosimples — "DETRAN/RJ/Multas (Guia de Recolhimento)" | Já implementado no código (`MultiOrgaoConsultaService`); confirmar contrato de campos no painel Infosimples |
| Prefeitura RJ / CET-Rio (inclui Guarda Municipal) | Multas municipais do Rio de Janeiro | Infosimples — "Prefeitura/RJ/Rio de Janeiro/Multas (Descritivos)" | Idem; existe também consulta pública em `sgtu.rio.rj.gov.br`, mas sem API oficial documentada |
| PRF | Multas em rodovias federais dentro do RJ | Infosimples — "SENATRAN/Infrações" (nacional, cobre PRF) | Alternativa oficial mais trabalhosa: WSDenatran/RENAINF via SERPRO, que exige convênio formal + certificado digital em nome de CNPJ autorizado pelo DENATRAN — inviável para um MVP, o caminho comercial (Infosimples) é o certo agora |

Sobre o modelo de custo: a Infosimples cobra por consulta, com preço unitário caindo conforme o volume mensal sobe, e pode haver uma taxa adicional em consultas que exigem automação mais pesada. Não há um número fixo público — a plataforma tem uma calculadora de estimativa. Antes de escalar para milhares de usuários, vale rodar essa estimativa com o volume esperado de placas × 3 consultas/dia, porque esse é o item de custo variável mais sensível do sistema inteiro.

Um ponto de atenção separado: a pontuação oficial de CNH (o "extrato" real de pontos de um condutor) não é obtida por placa+RENAVAM — ela é vinculada ao CPF/CNH da pessoa e normalmente exige login do próprio condutor no gov.br (Carteira Digital de Trânsito/RENACH). Isso significa que a tela de pontuação da seção 6 vai funcionar com base nas multas que o Sentinela efetivamente captura (por veículo cadastrado), não com o extrato oficial completo do condutor — se ele tiver pontos de infrações em outro estado ou em veículo não cadastrado no sistema, eles não vão aparecer. Vale deixar isso explícito na interface ("baseado nas multas monitoradas pelo Sentinela") para não passar a impressão de um número oficial garantido, e considerar como item de roadmap uma integração futura via login gov.br (fluxo que o próprio usuário autoriza, diferente de scraping).

---

## 4. Regra de pontos da CNH — correção necessária

A regra que você descreveu (20 pontos para quem não exerce atividade remunerada, 40 para quem exerce) está simplificada demais e vai gerar um número errado na tela se implementada assim. A regra real da Lei 14.071/2020 é escalonada:

Para condutor comum, a suspensão ocorre ao atingir, em 12 meses: 20 pontos **se houver 2 ou mais infrações gravíssimas**; 30 pontos se houver exatamente 1 infração gravíssima; ou 40 pontos se não houver nenhuma infração gravíssima no período. Ou seja, o limite não é fixo em 20 — ele depende da gravidade das infrações, não só da soma.

Para quem exerce atividade remunerada com o veículo, a lei simplifica: a suspensão só ocorre ao atingir 40 pontos, independentemente da gravidade das infrações, e esse condutor pode (não é obrigatório) fazer um curso preventivo de reciclagem ao atingir 30 pontos, como uma forma de neutralizar o excesso de pontos antes da suspensão. Essa parte bate com o que você descreveu.

Recomendo implementar a regra completa (a tabela de 20/30/40 conforme gravidade para não-remunerado, e 40 fixo + reciclagem preventiva opcional aos 30 para remunerado), porque o campo `Gravidade` (enum `GravidadeInfracao`) já existe na entidade `Multa` — o cálculo é direto a partir do que já está no banco.

---

## 5. O que já existe no backend (auditoria do código)

O modelo de dados tem três entidades: `Usuario` (com preferências de notificação e-mail/WhatsApp), `Veiculo` (placa + RENAVAM + UF, hoje travado em "RJ" por padrão) e `Multa` — esta última já é rica: guarda número do auto, órgão autuador, artigo do CTB, gravidade, valor, pontos, os três prazos legais (defesa prévia D+30, JARI D+60, CETRAN D+90), e todo o output da IA (explicação simples, fundamentação de recurso, texto da defesa, chance de sucesso em %, onde recorrer, onde obter desconto, como evitar no futuro). Não existe hoje nenhum campo de "atividade remunerada" nem entidade de pontuação agregada — isso precisa ser adicionado (seção 6).

O job diário (`MonitoramentoDiarioJob`) já roda às 07:00, percorre veículos com monitoramento ativo, consulta as três fontes, deduplica contra multas já conhecidas, manda cada multa nova para análise da IA e dispara a notificação — com tratamento de erro por veículo (um veículo com erro não derruba o processamento dos demais). É implementado como `BackgroundService` com `Task.Delay` até o próximo horário, o que funciona, mas tem uma fragilidade: se a API reiniciar entre a meia-noite e as 07:00, ele recalcula a partir do reinício, e não há fila/retry persistente se uma consulta falhar por instabilidade momentânea da Infosimples. Para produção, vale trocar por um scheduler mais robusto (Hangfire ou Quartz.NET), que sobrevive a restarts e dá retry automático — é uma troca de poucas linhas dado que a lógica de negócio já está isolada em serviços.

O motor de IA (`AnthropicCtbAnaliseService`) já chama o Claude com um RAG simples sobre uma base de conhecimento do CTB com ~35-40 trechos (velocidade, semáforo, celular ao volante, embriaguez, prazos, pontos, transferência de pontos para condutor indicado, nulidades de autuação, prescrição), cobrindo bem mais do que o README desatualizado sugere. A busca é por contagem de palavras-chave, não por embeddings — funciona como MVP, mas para escalar em qualidade de resposta vale migrar para pgvector com embeddings de verdade, ingerindo o CTB completo e as resoluções CONTRAN.

Autenticação: ao contrário do que o `README.md` diz, o JWT já está implementado e funcional (hash de senha com PBKDF2, tokens com expiração configurável, todos os controllers de domínio protegidos com `[Authorize]`). O README está desatualizado nesse ponto e também no ponto da migration do EF Core, que já existe e está commitada. Vale atualizar o README para não gerar retrabalho desnecessário.

---

## 6. Tela de pontuação de CNH — proposta de implementação

Adicionar um campo `AtividadeRemunerada` (bool) em `Usuario` — é a informação mais simples de coletar via um toggle na tela de perfil, e é a única entrada manual necessária para todo o cálculo.

Criar um serviço `IPontuacaoCnhService` que agrega, para o usuário logado, todas as multas com `Pontos > 0` dentro de uma janela móvel de 12 meses a partir de `DataInfracao`, soma os pontos, conta quantas são `Gravidade == Gravissima`, e aplica a regra da seção 4 para determinar o limite (20/30/40 para não-remunerado, 40 fixo para remunerado) e a distância até a suspensão.

Na interface, a ideia de simular a carteira de habilitação funciona bem com a linguagem visual que o projeto já usa (placa Mercosul estilizada, cards tipo terminal). Sugiro um card no estilo carteira: nome do condutor, badge "Atividade Remunerada: Sim/Não" (editável), um medidor circular ou barra de progresso mostrando pontos atuais sobre o limite aplicável, status em três níveis (verde "Regular", âmbar "Atenção — perto do limite", vermelho "Risco de suspensão"), e a lista das multas que compõem a pontuação, com data de "expiração" de cada ponto (a data em que aquela multa sai da janela de 12 meses, o que é informação que ninguém mais mostra e seria um diferencial real do produto). Adicionar o aviso de que o número reflete apenas as multas monitoradas pelo Sentinela, como comentei na seção 3.

---

## 7. Motor de IA de defesa "sempre diferente"

Hoje o `GerarTextoDefesaAsync` já monta uma peça estruturada (Preâmbulo, Fatos, Direito, Pedido) e escolhe o órgão de recurso certo pelo nome do órgão autuador — mas nada impede que duas defesas para a mesma infração, artigo e argumento saiam com frases quase idênticas, o que é exatamente o risco que você identificou (JARIs desconfiam de peças em série, e uma defesa "copiada" reduz a credibilidade e pode ser indeferida por padrão de texto repetido).

Duas camadas resolvem isso, e vale implementar as duas juntas: primeiro, variação controlada no prompt — em vez de um único system prompt fixo, manter um pequeno banco de 4-5 "personas/estilos" de redação jurídica (mais técnico e cheio de jurisprudência; mais direto e objetivo; com ênfase em nulidade processual; com ênfase em mérito técnico) e sortear um por geração, além de injetar detalhes específicos do caso (local exato, horário, contexto da via) para forçar o modelo a ancorar o texto em fatos concretos em vez de boilerplate. Segundo, uma checagem de similaridade pós-geração — antes de salvar `TextoDefesa`, comparar (por embeddings, sem precisar de infraestrutura pesada, dá para usar a própria API de embeddings da Anthropic/OpenAI ou até um algoritmo de similaridade textual mais simples) contra as últimas N defesas geradas para o mesmo usuário e artigo do CTB; se a similaridade passar de um limiar, regenerar com uma instrução explícita de "reescreva evitando repetir estas frases: [...]". Isso é barato de implementar porque a interface `ICtbAnaliseService` já existe e só precisa de um método novo, sem mexer no resto do sistema.

---

## 8. Notificação (WhatsApp / e-mail)

O e-mail via Resend está pronto e é o canal mais barato e sem barreira de aprovação — pode ir para produção primeiro. O WhatsApp via Z-API é uma solução não-oficial (usa número pessoal simulando o WhatsApp Web), útil para validar o produto rápido, mas o próprio código já deixa comentado que a ideia é trocar pela Meta Cloud API oficial antes de escalar — o Z-API tem risco de banimento de número e não tem SLA, o que é inaceitável para um produto que promete avisar sobre prazo legal. A migração para Meta Cloud API exige processo de verificação de negócio no Meta Business Manager e aprovação de templates de mensagem (toda mensagem iniciada pela empresa fora de uma janela de 24h de conversa precisa ser um template pré-aprovado) — vale começar esse processo de aprovação em paralelo ao desenvolvimento, porque a fila de revisão do Meta pode levar dias.

---

## 9. Design e UX — o que está bom e o que ajustar

O visual atual tem identidade própria de verdade — a estética "terminal tático / HUD de radar" com neon verde sobre fundo escuro, glassmorphism e placas Mercosul estilizadas é incomum no nicho de multas (que normalmente é tudo cinza-institucional) e comunica bem a ideia de monitoramento ativo e vigilância. Isso é um ativo de marca, vale preservar a linguagem em vez de trocar por um design genérico.

Pontos técnicos a corrigir antes de mais nada: há uma inconsistência entre o nome da variável de fonte de display esperada no Tailwind (`--font-outfit`) e a que é de fato carregada no layout (`--font-space-grotesk`) — hoje provavelmente está caindo no fallback do navegador sem que ninguém tenha percebido; o mesmo acontece com a fonte monoespaçada (`--font-jetbrains-mono` vs `--font-jetbrains`). O background `mesh-pattern` referencia um `/mesh.svg` que não existe em `public/`, e os ícones do PWA (`icon-192.png`/`icon-512.png`) também não foram gerados, o que impede a instalação completa como app no celular — isso é citado no próprio README como pendência e continua pendente.

Do ponto de vista de produto, a aba "Notificações" do dashboard hoje é inteiramente mockada (não existe endpoint real de histórico de notificações no backend) — antes de lançar, ou implementa o endpoint de verdade, ou remove a aba, porque um usuário que clica ali achando que é o log real de avisos e vê dados falsos derruba a confiança no "monitoramento sério" que é a proposta central do produto. Na mesma linha, a acessibilidade de contraste dos textos com `text-shadow` neon (verde sobre fundo escuro) deve ser validada — efeitos de glow bonitos em prints às vezes ficam ilegíveis em tela de sol ou para usuários com baixa visão, e esse é um produto que pessoa vai abrir tenso, sob prazo de multa, muitas vezes no sol, então legibilidade importa mais que em outros produtos.

Sobre a missão de "agregar na vida de milhares de pessoas": o maior salto de valor percebido não é visual, é de confiança e transparência de prazo. Sugiro dar mais destaque, na primeira tela que o usuário vê depois de logar, a um contador regressivo bem grande do prazo mais urgente em aberto (hoje isso existe como um banner, mas pode ganhar mais peso visual que os KPIs), e mostrar de forma honesta a % de chance de recurso vindo da IA como uma estimativa, não como certeza — para não gerar frustração ou, pior, decisão de não pagar uma multa que na prática não tinha chance real de reverter.

---

## 10. Riscos e pontos de atenção gerais

Existe uma dependência forte de um único fornecedor comercial (Infosimples) para as três fontes de dados — se o preço subir ou o serviço cair, o produto para. Vale manter a interface `IConsultaMultasService` desacoplada como já está (foi uma boa decisão de arquitetura original) para permitir trocar ou combinar fornecedores no futuro sem reescrever o job.

Do ponto de vista de LGPD, o sistema vai lidar com dado de infração de trânsito vinculado a uma pessoa física, o que é dado sensível o suficiente para exigir política de privacidade clara, retenção definida (por quanto tempo guardar histórico de multas de um usuário que cancelou a conta) e, no médio prazo, criptografia de campos sensíveis em repouso — hoje não há indício de que a Placa/RENAVAM estejam criptografados no banco, o que é aceitável para MVP mas deve entrar no roadmap antes de qualquer volume real de usuários.

Por fim, a chave JWT em `appsettings.json` está com valor placeholder e precisa ser trocada por variável de ambiente/secret antes de qualquer deploy público — é o tipo de detalhe fácil de esquecer justamente porque tudo em volta já parece pronto.

---

## 11. Próximos passos sugeridos

A ordem que eu recomendaria, pensando em risco e velocidade de validação: primeiro confirmar com a Infosimples o contrato exato de campo dos três endpoints (hoje é um "melhor esforço" no parser) e rodar uma consulta real de teste; em paralelo, implementar a regra de pontos de CNH completa e a tela (é isolado, não depende de infraestrutura externa); depois a camada de variação/anti-repetição do motor de defesa; por último a migração de Z-API para Meta Cloud API oficial, que tem prazo de aprovação fora do seu controle e por isso deveria começar cedo mesmo sendo a última a "ligar".

Antes de eu partir para implementação de código, preciso de algumas decisões suas: confirmar se "Polícia Federal" era mesmo PRF; definir se o toggle de atividade remunerada fica editável livremente pelo usuário ou exige algum tipo de comprovação; e decidir a prioridade entre migrar já para Meta Cloud API oficial ou manter Z-API por mais tempo, dado o trabalho de aprovação de conta comercial no Meta.
