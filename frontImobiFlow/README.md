# FrontImobiFlow (ImobiFlow UI)

Frontend Angular 21 + Tailwind CSS v4 + SSR + Vitest da plataforma ImobiFlow (CRM Imobiliário com Supabase Auth).

- **Estrutura**: standalone components, Signals para estado reativo
- **Autenticação**: Supabase Auth (email/senha) + **Custom Access Token Hook PL/pgSQL** para isolar apps que compartilham o mesmo projeto Supabase
- **Media Storage**: fotos de imóveis via Edge Functions do Supabase integradas ao bucket S3 `fotos-imoveis-pierre` (AWS us-east-1)
- **Banco**: schema `pierre` no Supabase PostgreSQL (sa-east-1 / São Paulo)
- **Serviços Angular**: [auth.service.ts](src/app/services/auth.service.ts), [menu-service.ts](src/app/services/menu-service.ts), [s3.service.ts](src/app/services/s3.service.ts)
- **Injeção de envs**: script `set-env.js` lê o `.env` da raiz e gera `src/environments/environment*.ts`

## 1. Desenvolvimento local

```bash
cd frontImobiFlow
npm install
npm run start          # sobe em http://localhost:4200 (com SSR)
npm run test           # testes Vitest
npm run build          # build de produção (SSR + browser bundles)
```

> ⚠️ Para rodar local o `.env` na raiz do repositório precisa ter `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SCHEMA`. O `npm run start` executa o `set-env.js` antes (prestart).

---

## 2. Validação de App por `app_metadata.app_id` via Auth Hook PL/pgSQL

Quando múltiplos apps compartilham o **mesmo projeto Supabase**, o controle de acesso não pode ser só client-side. Usamos um **Custom Access Token Hook (PL/pgSQL)** que roda **antes da emissão do JWT** e bloqueia login de usuário sem `app_metadata.app_id === 'imobiflow'`.

### 2.1 Bug inicial que fazia bypass

Na primeira versão do SQL a comparação usava apenas `<>`:

```sql
IF claims->'app_metadata'->>'app_id' <> 'imobiflow' THEN ...
```

Quando o usuário não tinha o campo `app_id`, a expressão virava **`NULL <> 'imobiflow'`** → PostgreSQL retorna `NULL`, tratado como **false** no `IF`. Bloco de erro nunca rodava, login era permitido. Além disso, no Custom Access Token Hook o Supabase **não aninha** `app_metadata` dentro de `claims` — o caminho `claims->'app_metadata'` também retornava `NULL`.

### 2.2 Versão final do SQL (funcionando)

Cole no painel **Supabase → Authentication → Hooks → Add Hook → Custom Access Token Hook (PL/pgSQL)**:

```sql
DECLARE
    claims jsonb;
    app_id text;
BEGIN
    claims := meta->'claims';

    -- (opcional) Logs para debug — consulte na aba Postgres Logs do painel
    -- RAISE LOG 'hook claims: %', claims;
    -- RAISE LOG 'keys: %', ARRAY(SELECT jsonb_object_keys(claims));

    -- Tenta múltiplos caminhos e pega o primeiro que não for NULL:
    --   1) claim custom na raiz do JWT  → claims->>'app_id'
    --   2) se app_metadata for aninhado → claims->'app_metadata'->>'app_id'
    --   3) direto da coluna fonte da tabela auth.users (raw_app_meta_data)
    app_id := claims->>'app_id';
    IF app_id IS NULL THEN app_id := claims->'app_metadata'->>'app_id'; END IF;
    IF app_id IS NULL THEN app_id := (raw_app_meta_data->>'app_id'); END IF;

    -- RAISE LOG 'app_id resolvido: %', app_id;

    -- IS DISTINCT FROM considera NULL como "diferente":
    --   • usuário sem campo app_id → bloqueia
    --   • usuário com app_id diferente de imobiflow → bloqueia
    --   • usuário com app_id = imobiflow → permite
    IF app_id IS DISTINCT FROM 'imobiflow' THEN
        RETURN jsonb_build_object(
            'error', jsonb_build_object(
                'http_code', 401,
                'message', 'Unauthorized: invalid app_id'
            )
        );
    END IF;

    -- Opcional: injeta app_id como claim custom no payload do JWT,
    -- útil para RLS baseado em auth.jwt()->>'app_id'
    RETURN jsonb_set(
        meta,
        '{claims,app_id}',
        to_jsonb(COALESCE(app_id, '')),
        true
    );
END;
```

### 2.3 Campos importantes

| Item | Valor |
|---|---|
| Tipo de Hook | Custom Access Token Hook (PL/pgSQL) |
| Evento | Sign-in (acionado antes da emissão do JWT) |
| Http code de erro | 401 (não 403) |
| Comparação segura NULL | `IS DISTINCT FROM` |
| Fonte de verdade do `app_id` | Coluna `raw_app_meta_data` de `auth.users` |

### 2.4 Como atribuir `app_id` para usuários

`app_metadata` (raw_app_meta_data no Postgres) **só pode ser alterado via service role / SQL direto** (usuário final não consegue editar via `updateUser`).

#### Usuários existentes (rode no SQL Editor do Supabase)

```sql
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{app_id}',
  '"imobiflow"'
)
WHERE email IN ('usuario@exemplo.com');
```

#### Preenchimento automático no cadastro (trigger BEFORE INSERT)

```sql
CREATE OR REPLACE FUNCTION pierre.set_default_app_id_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  NEW.raw_app_meta_data := jsonb_set(
    COALESCE(NEW.raw_app_meta_data, '{}'::jsonb),
    '{app_id}',
    '"imobiflow"'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_set_app_id_before_insert
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION pierre.set_default_app_id_on_signup();
```

### 2.5 Exemplo de Policies RLS com o claim custom injetado

Se descomentar o `jsonb_set` no final do hook, o JWT passa a ter o claim `app_id` e você pode bloquear **em nível de tabela**:

```sql
ALTER TABLE pierre.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pierre.imoveis   ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_rw_by_app_id
  ON pierre.profiles FOR ALL
  USING (auth.jwt() ->> 'app_id' = 'imobiflow');

CREATE POLICY imoveis_rw_by_app_id
  ON pierre.imoveis FOR ALL
  USING (auth.jwt() ->> 'app_id' = 'imobiflow');
```

### 2.6 Fluxo completo de autenticação

```
Front chama signInWithPassword(email, senha)
        ↓
Supabase Auth valida credenciais
        ↓
[ANTES de emitir JWT] roda Custom Access Token Hook PL/pgSQL
        ↓
Hook lê raw_app_meta_data.app_id do usuário da tabela auth.users
   ├─ ❌ app_id IS DISTINCT FROM 'imobiflow'
   │       → retorna {error.http_code:401}
   │       → Supabase NÃO emite token
   │       → SDK retorna erro "Invalid app_id"
   └─ ✅ app_id = 'imobiflow'
           → retorna meta com claim "app_id" injetado
           → Supabase emite JWT com o claim custom
        ↓
onAuthStateChange dispara (auth.service.ts)
        ↓
AuthService só confere se há profile no schema pierre
```

### 2.7 Troubleshooting

- **Login passando mesmo sem app_id**: confirme que o `IF` usa `IS DISTINCT FROM` (e não só `<>`).
- **Login bloqueando mesmo com app_id correto**: descomente os `RAISE LOG`, tente logar e consulte a aba **Postgres Logs** para ver o `app_id resolvido`.
- **Estrutura real de `meta.claims`**: descomente os logs de `keys` e `claims` no topo do hook.
- **Claim `app_id` não aparece no JWT**: confirme que o `jsonb_set` no final do hook não está comentado.

---

## 3. Serviços de mídia (imagens dos imóveis via S3)

Três Edge Functions do Supabase gerenciam fotos no bucket AWS S3 `fotos-imoveis-pierre` (us-east-1). Os endpoints são chamados por [s3.service.ts](src/app/services/s3.service.ts):

| Edge Function | Método | Descrição |
|---|---|---|
| `get-s3-property-images` | GET | Lista imagens de um imóvel no S3 |
| `get-s3-presigned-upload-url` | POST | Gera presigned URL para upload de imagem |
| `delete-s3-property-image` | POST | Apaga imagem do S3 |

> ⚠️ Hard constraints (validadas em deploy anterior):
> - Edge Functions Deno **NÃO** podem enviar body em HTTP 204 (`TypeError: Response with null body status cannot have body`)
> - Região do S3 precisa ser fixada como `us-east-1` no código (evita redirecionamento 307)
> - Credenciais AWS ficam em **Project Secrets globais** no Supabase (não só por função)
> - CORS do bucket S3 precisa aceitar `PUT` de presigned URLs vindas do navegador

---

## 4. Comandos rápidos

```bash
# Desenvolvimento com SSR
npm run start

# Build de produção (gera dist/ com bundles browser + server + prerender)
npm run build

# Testes unitários (Vitest)
npm run test
```

## 5. Recursos adicionais

- [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Supabase Auth — Custom Access Token Hooks](https://supabase.com/docs/guides/auth/hooks/custom-claims)
