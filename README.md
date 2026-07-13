# Sentinela

Monitoramento automático de multas de trânsito no Rio de Janeiro. O Sentinela consulta
diariamente as multas do condutor e dos veículos cadastrados, explica cada infração em
linguagem simples (com base no CTB), estima a chance de recurso, calcula a pontuação da
CNH e o risco de suspensão, e valida a CNH oficialmente junto ao SENATRAN.

## Funcionalidades

- **Login e cadastro** com autenticação JWT.
- **Cadastro de veículos** (placa + RENAVAM) com monitoramento ativável/pausável.
- **Varredura diária automática** (`MonitoramentoDiarioJob`) que consulta multas via
  SERPRO/RADAR (Infosimples), identifica infrações novas e atualiza as já existentes
  quando algum dado chega incompleto.
- **Enquadramento CTB automático**: artigo, gravidade, pontos e valor, combinando a
  análise de IA (Anthropic) com uma tabela de referência estática para os casos em que
  o provedor de consulta não devolve esses campos.
- **Painel com abas** — Novas / Em aberto / Vencidas — separando multas por urgência,
  com aviso claro de quando o prazo de defesa já expirou (só resta pagamento).
- **Geração de defesa com IA**, incluindo explicação da infração, fundamentação jurídica
  e estimativa de chance de recurso.
- **Pontuação da CNH e risco de suspensão** (Lei 14.071/2020), considerando atividade
  remunerada (limite de pontos diferenciado).
- **Validação oficial da CNH via SENATRAN** (RENACH), usando o código de segurança da
  CNH digital — nunca a senha do gov.br nem certificado digital.
- **Dashboard** com busca rápida (placa/auto de infração), notificações com contador,
  gráficos de evolução de gastos e distribuição por gravidade/tipo.
- **Notificações** por e-mail (Resend) e WhatsApp (Z-API, solução provisória até migrar
  para a Meta Cloud API oficial).

## Stack

| Camada    | Tecnologia |
|-----------|------------|
| Backend   | .NET 8 Web API, EF Core + Npgsql, JWT, Swagger |
| Frontend  | Next.js 14 (App Router), TypeScript, Tailwind CSS, SWR |
| Banco     | PostgreSQL 15 |
| Infra     | Docker Compose |
| CI        | GitHub Actions (build + testes do backend e do frontend a cada push/PR) |

## Estrutura

```
SentinelaMultas/
├── backend/Sentinela.Api/     → API .NET 8 (monitoramento, análise, CNH, notificações)
├── frontend/sentinela-web/    → Next.js — landing page + dashboard (PWA instalável)
├── docs/                      → decisões de arquitetura e próximos passos
└── docker-compose.yml         → sobe banco + backend + frontend com um único comando
```

## Como rodar (Docker Compose — recomendado)

1. Copie `.env.example` para `.env` na raiz do projeto e preencha as chaves que tiver
   disponíveis (o sistema sobe mesmo sem elas, em modo degradado: sem consultar multas
   reais, sem IA e sem notificações — cada serviço loga um aviso e segue).
2. Suba os containers:

   ```bash
   docker compose up -d --build
   ```

3. Acesse:
   - Frontend: http://localhost:3000
   - API + Swagger: http://localhost:5000/swagger

As migrations do banco rodam automaticamente na subida do backend
(`dbContext.Database.Migrate()` no `Program.cs`).

## Variáveis de ambiente (`.env`)

| Variável | Para que serve |
|----------|-----------------|
| `JWT_SECRET_KEY` | Assinatura dos tokens de autenticação — troque por uma string aleatória de 32+ caracteres antes de expor a API além do localhost |
| `INFOSIMPLES_TOKEN` | Consulta de multas (SERPRO/RADAR) e validação de CNH (SENATRAN) |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Análise do CTB e geração de defesa |
| `RESEND_API_KEY` / `RESEND_REMETENTE` | Envio de e-mail |
| `ZAPI_INSTANCE_ID` / `ZAPI_TOKEN` | Envio de WhatsApp |

## Rodando sem Docker (desenvolvimento)

**Backend** (requer .NET 8 SDK e um PostgreSQL local):

```bash
cd backend/Sentinela.Api
dotnet restore
dotnet ef database update
dotnet run
```

Configure a connection string e as chaves acima em `appsettings.Development.json`
(nunca committado) ou via variáveis de ambiente / user-secrets.

**Frontend**:

```bash
cd frontend/sentinela-web
npm install
npm run dev
```

Abre em http://localhost:3000. A rota `/dashboard` é o "app" — tem `manifest.json`
configurado para instalação como PWA (Adicionar à tela inicial).

## Limitações conhecidas

- A validação de CNH via SENATRAN depende do produto correspondente estar habilitado na
  conta Infosimples (é um produto separado do SERPRO/RADAR, mesmo usando o mesmo token).
- O provedor de consulta de multas (Infosimples/SERPRO-RADAR) não devolve pontos/valor
  para todas as infrações — nesses casos o Sentinela recorre a uma tabela de referência
  estática do CTB, que cobre os enquadramentos mais comuns mas não é exaustiva.
- Notificações por WhatsApp usam uma API não-oficial (Z-API) como solução provisória.
