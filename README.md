# ImobiFlow

Plataforma imobiliária completa com CRM, automação de workflows via n8n, integração com WhatsApp (Evolution API), IA via Dify e MCP Server para consultas a imóveis.

---

## Arquitetura

```
ImobiFlow/
├── imobiFlow/                  # Backend Java 17 + Spring Boot 4.1 (CRM Imobiliário)
├── frontImobiFlow/             # Frontend Angular 21 + Tailwind CSS v4 + SSR
├── mcp_imoveis/                # MCP Server Python (FastMCP v3) → Supabase PostgreSQL
├── dify/                       # Sub-repo Dify (plataforma de IA/RAG)
├── docker-compose.yml          # Infra completa: n8n + Evolution + Postgres + Redis + Nginx
├── nginx.conf                  # Configuração de proxy reverso (desenvolvimento)
└── nginx.conf.prod             # Configuração de produção com SSL (Let's Encrypt)
```

### Serviços (Docker Compose)

| Serviço | Imagem | Porta | Descrição |
|---|---|---|---|
| **nginx** | `nginx:1.25-alpine` | 80 / 443 / 8080 | Proxy reverso + SSL |
| **postgres** | `postgres:16.4-alpine` | 5432 | Banco de dados principal (n8n + Evolution) |
| **redis** | `redis:7.2-alpine` | 6379 | Cache e filas (BullMQ) |
| **n8n** | `n8nio/n8n:2.26.4` | 5678 | Automação de workflows |
| **n8n-worker** | `n8nio/n8n:2.26.4` | — | Worker de fila do n8n |
| **evolution** | `evoapicloud/evolution-api:v2.3.7` | 8080 (exp) | API WhatsApp |
| **mcp_imoveis** | Build local | 8000 | MCP Server de imóveis |
| **cloudflared** | `cloudflare/cloudflared` | — | Tunnel Cloudflare (acesso externo HTTPS) |

---

## Pré-requisitos

- Docker + Docker Compose v2
- Java 17+ (apenas se rodar backend fora do Docker)
- Node.js 22+ (apenas se rodar frontend fora do Docker)
- Python 3.11+ (apenas se rodar MCP fora do Docker)
- Arquivo `.env` na raiz (copie de um existente ou preencha o template abaixo)

---

## Variáveis de Ambiente (`.env`)

Todas as variáveis **obrigatórias** devem estar no `.env`. Valores sem fallback — se faltar, o container sobe com valor vazio e pode quebrar.

```env
# ===============================
# PostgreSQL Local
# ===============================
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha_forte_aqui
POSTGRES_DB=databasePierreAutomation
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_SSL_ENABLED=false
POSTGRES_SSL_REJECT_UNAUTHORIZED=false
POSTGRES_SSLMODE=disable

# ===============================
# Databases dedicados
# ===============================
N8N_POSTGRES_DB=n8n
EVOLUTION_POSTGRES_DB=evolution
EVOLUTION_DB_SCHEMA=public

# ===============================
# Redis
# ===============================
REDIS_PASSWORD=sua_senha_redis_aqui

# ===============================
# n8n
# ===============================
N8N_HOST=n8n.seu-dominio.com.br
N8N_PORT=5678
N8N_PROTOCOL=https
N8N_EDITOR_BASE_URL=https://n8n.seu-dominio.com.br
N8N_WEBHOOK_URL=https://n8n.seu-dominio.com.br/
N8N_TIMEZONE=America/Sao_Paulo
META_ACCESS_TOKEN=seu_token_meta_whatsapp_aqui

# ===============================
# Evolution API (WhatsApp)
# ===============================
EVOLUTION_PORT=8080
EVOLUTION_SERVER_URL=https://evolution.seu-dominio.com.br/
EVOLUTION_WEBHOOK_GLOBAL_URL=https://evolution.seu-dominio.com.br/
EVOLUTION_LOG_LEVEL=ERROR,WARN,DEBUG,INFO
EVOLUTION_CACHE_REDIS_PREFIX_KEY=evolution
EVOLUTION_API_KEY=sua_api_key_evolution_aqui

# ===============================
# Supabase PostgreSQL (MCP Imóveis)
# ===============================
SUPABASE_POSTGRES_HOST=aws-1-sa-east-1.pooler.supabase.com
SUPABASE_POSTGRES_USER=postgres.suauser
SUPABASE_POSTGRES_PASSWORD=sua_senha_supabase
SUPABASE_POSTGRES_PORT=5432
SUPABASE_POSTGRES_DATABASE=postgres
SUPABASE_POSTGRES_SSLMODE=require
SUPABASE_CONNECT_TIMEOUT=10
SUPABASE_DEFAULT_SCHEMA=public
SUPABASE_POSTGRES_DSN=postgresql://user:senha@host:porta/db?sslmode=require
SUPABASE_VECTOR_DATABASE_PASSWORD=sua_senha_vector_db

# ===============================
# Cloudflare Tunnel
# ===============================
CLOUDFLARE_TUNNEL_TOKEN=seu_tunnel_token_aqui
CLOUDFLARE_ACCOUNT_ID=seu_account_id
CLOUDFLARE_API_TOKEN=seu_api_token

# ===============================
# Outros
# ===============================
SUPABASE_ACCESS_TOKEN=sbp_...
```

---

## Como rodar

### Infra completa (Docker)

```bash
# 1. Clone o repo e entre na pasta
git clone https://github.com/iagovls/imobiflow.git
cd imobiflow

# 2. Copie/crie o .env com suas credenciais
#    (ver sessão de variáveis acima)

# 3. Suba tudo
docker compose up -d

# 4. Verifique os logs
docker compose logs -f
```

### Backend (Spring Boot) — desenvolvimento local

```bash
cd imobiFlow
./mvnw spring-boot:run      # Linux/Mac
mvnw.cmd spring-boot:run     # Windows
```

Aplicação sobe em `http://localhost:8080` com banco H2 em memória por padrão.

### Frontend (Angular + SSR) — desenvolvimento local

```bash
cd frontImobiFlow
npm install
npm run start
```

Frontend em `http://localhost:4200`.

### MCP Imóveis (Python) — desenvolvimento local

```bash
cd mcp_imoveis
pip install -e .
uvicorn app:app --reload --port 8000
```

MCP Server em `http://localhost:8000` (conecta no Supabase).

---

## Deploy na AWS (EC2)

Os scripts `ec2-user-data.sh` e `user-data.sh` provisionam uma instância EC2 com Docker, clonam este repo e rodam `docker compose up -d`.

Fluxo:
1. Anexe `user-data.sh` no launch da EC2 (Amazon Linux 2 / Ubuntu)
2. SSL via Let's Encrypt (certbot) — certificados montados em `/etc/letsencrypt`
3. Use `nginx.conf.prod` ao invés de `nginx.conf` em produção

---

## Estrutura de comunicação

```
 ┌─────────────────────────────────────────────────────────────┐
 │                        nginx (80/443)                       │
 │  80    /  →  n8n:5678                                       │
 │  8080 /  →  evolution:8080                                  │
 └────────┬──────────────────────────┬─────────────────────────┘
          │                          │
          ▼                          ▼
 ┌────────────────┐         ┌────────────────────┐
 │  n8n (5678)    │         │  Evolution API     │
 │  + worker      │         │  (WhatsApp)        │
 │  queue (Bull)  │         └─────────┬──────────┘
 └──┬─────────┬───┘                   │
    │         │                       │
    ▼         ▼                       ▼
 ┌────────┐ ┌───────┐          ┌────────────────┐
 │Postgres│ │ Redis  │◄─────────┤                │
 └────────┘ └───────┘          └────────────────┘
     ▲
     │ Conexão separada (Supabase)
     ▼
 ┌──────────────────────────────────┐
 │    MCP Imóveis (FastMCP :8000)   │
 │    → Dify / LLMs via MCP         │
 └──────────────────────────────────┘

                          Cloudflare Tunnel → acesso HTTPS externo
```

---

## Scripts úteis

```bash
# Ver status de todos os containers
docker compose ps

# Reiniciar apenas um serviço (ex: n8n)
docker compose restart n8n

# Logs de um serviço específico
docker compose logs -f evolution

# Derrubar TUDO (cuidado!)
docker compose down

# Derrubar e apagar volumes (PERDE TODOS OS DADOS LOCAIS)
docker compose down -v
```

---

## Segurança

- **NUNCA** commit o `.env` (já está no `.gitignore`)
- Mude todas as senhas padrão do template antes de subir em produção
- Cloudflare Tunnel é preferencial a portas abertas diretamente na EC2
- PostgreSQL e Redis só são acessíveis pela rede Docker bridge (`app_network`)

---

## Licença

Veja arquivo [LICENSE](./LICENSE).
