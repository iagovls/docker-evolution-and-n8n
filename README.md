# 🚀 Docker Compose - n8n + Evolution API + Redis (+ PostgreSQL no RDS)

## Visão geral rápida

- **n8n** `1.119.1` em `http://localhost:5678`
- **Evolution API** `v2.3.6` em `http://localhost:8080`
- **PostgreSQL**: use um banco gerenciado (ex.: **AWS RDS**). **Redis** `7.2-alpine` (porta 6379)
- Use `localhost` para acessar via navegador no host. Em Linux/EC2, ajuste `N8N_HOST` e `N8N_WEBHOOK_URL` no `.env` para o domínio/IP público da instância.

## Como subir

```bash
# Edite o .env com suas credenciais (já há um modelo básico versionado)
docker-compose pull   # baixa/atualiza as imagens definidas nas tags
docker-compose up -d  # sobe os containers em background usando o .env
docker-compose ps     # mostra o status atual dos serviços
```

Para desligar: `docker-compose down`. Para apagar dados: `docker-compose down -v`.

## Credenciais (ajuste no `.env`)

- PostgreSQL (RDS): defina `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- Bancos usados no RDS: `N8N_POSTGRES_DB` (padrão `n8n`) e `EVOLUTION_POSTGRES_DB` (padrão `evolution`)
- O serviço `db-init` cria esses bancos automaticamente no start (usuário precisa permissão de `CREATEDB` no RDS)
- Redis: `redis123`
- Evolution API Key: `evolution_api_key_12345`

⚠️ Troque tudo antes de qualquer uso público/produção.

## Dúvidas comuns
- **Como conectar um webhook ao n8n?** Dentro do compose, os serviços se enxergam pelo nome: use `http://n8n:5678/<sua-rota-webhook>`. Para webhooks externos, configure `N8N_HOST`/`N8N_WEBHOOK_URL` com o domínio/IP público.
- **Por que `host.docker.internal`?** No Docker Desktop (Windows/macOS) isso facilita chamar serviços do host a partir de containers. Em EC2/Linux, use o DNS/IP da instância ou um Load Balancer.
- **Como atualizar versões?** Troque as tags das imagens no `docker-compose.yml`, rode `docker-compose pull` e suba de novo.
- **Problema com dados antigos?** Como o Postgres fica no RDS, os dados não estão em volume local.

Pronto para uso local de desenvolvimento. Apenas para fins educacionais. Contributions são bem-vindas. 
