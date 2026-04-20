# Debounce de Mensagens no n8n
**Evolution API + Redis + Dify**

---

## Visão Geral

O debounce resolve o problema do cliente que envia mensagens "picotadas" — várias mensagens em sequência para dizer uma coisa só. Sem debounce, o bot responde cada mensagem separadamente, quebrando o contexto.

Com debounce, o n8n acumula todas as mensagens e só envia para o Dify após 8 segundos sem nova mensagem.

---

## Fluxo Resumido

```
Baileys → n8n (webhook)
  → Acumula mensagem no Redis + salva timestamp
  → Wait 8 segundos
  → Verifica se chegou mensagem mais nova
      → Se SIM: encerra (outra execução vai responder)
      → Se NÃO: concatena mensagens → envia pro Dify
  → Dify responde
  → n8n envia resposta pro cliente
```

---

## Estrutura das Chaves no Redis

| Chave | Conteúdo |
|---|---|
| `debounce:{phone}` | execution_id da última execução recebida |
| `mensagens:{phone}` | Array JSON com mensagens acumuladas |
| `conversa:{phone}` | conversation_id do Dify |

---

## Passo a Passo no n8n

### Passo 1 — Após o Webhook: Nó Code (normalizar dados)

Adicione um nó Code logo após o Webhook para normalizar o payload da Evolution API:

```javascript
const body = $input.first().json.body;

return [{
  json: {
    phone: body.data.key.remoteJid.replace("@s.whatsapp.net", ""),
    message: body.data.message?.conversation
           || body.data.message?.extendedTextMessage?.text
           || "",
    execution_id: $execution.id,
    timestamp: Date.now()
  }
}];
```

---

### Passo 2 — Redis SET: salvar execution_id

Salva o ID da execução atual para controle do debounce:

```
Operation: Set
Key:       debounce:{{ $json.phone }}
Value:     {{ $execution.id }}
Expire:    30 (segundos)
```

---

### Passo 3 — Redis GET: buscar mensagens acumuladas

```
Operation: Get
Key:       mensagens:{{ $json.phone }}
```

---

### Passo 4 — Nó Code: adicionar mensagem ao array

```javascript
const phone = $('Code').first().json.phone;
const message = $('Code').first().json.message;

let anteriores = [];
try {
  anteriores = JSON.parse($input.first().json.value || "[]");
} catch(e) { anteriores = []; }

anteriores.push(message);

return [{
  json: {
    phone: phone,
    mensagens: anteriores,
    execution_id: $('Code').first().json.execution_id
  }
}];
```

---

### Passo 5 — Redis SET: salvar array atualizado

```
Operation: Set
Key:       mensagens:{{ $json.phone }}
Value:     {{ JSON.stringify($json.mensagens) }}
Expire:    60 (segundos)
```

---

### Passo 6 — Nó Wait

```
Amount: 8
Unit:   Seconds
```

---

### Passo 7 — Redis GET: verificar última mensagem

```
Operation: Get
Key:       debounce:{{ $json.phone }}
```

---

### Passo 8 — Nó IF: é a última mensagem?

Compara o execution_id salvo no Redis com o da execução atual:

```
Condição: {{ $json.value }} == {{ $('Code').first().json.execution_id }}
```

- **True** → continua para o Dify
- **False** → No Operation (encerra esta execução)

---

### Passo 9 — Nó Code: preparar mensagem final

```javascript
const mensagens = JSON.parse(
  $('redis_mensagens').first().json.value || "[]"
);

return [{
  json: {
    phone: $('Code').first().json.phone,
    mensagem_completa: mensagens.join("\n")
  }
}];
```

---

### Passo 10 — Chamada pro Dify

```
POST https://sua-instancia/v1/chat-messages
Authorization: Bearer {sua_api_key}
```

```json
{
  "inputs": {},
  "query": "{{ $json.mensagem_completa }}",
  "conversation_id": "{{ $json.conversation_id }}",
  "user": "{{ $json.phone }}",
  "response_mode": "blocking"
}
```

---

### Passo 11 — Redis DEL: limpar acumulador

Após receber a resposta do Dify, limpe o acumulador de mensagens:

```
Operation: Delete
Key:       mensagens:{{ $json.phone }}
```

---

## Resultado Esperado

O cliente manda mensagens picotadas:
```
14:00 - "oi"
14:00 - "queria saber do produto"
14:00 - "tem disponível?"
```

O Dify recebe uma única mensagem concatenada:
```
oi
queria saber do produto
tem disponível?
```

---

## Observações Importantes

- O tempo de espera de 8 segundos pode ser ajustado conforme o perfil dos seus clientes.
- O TTL do Redis (30s para debounce, 60s para mensagens) garante limpeza automática em caso de falha.
- O nó No Operation encerra silenciosamente as execuções intermediárias sem gerar erro.
- O conversation_id do Dify deve ser salvo e recuperado do Redis para manter o histórico da conversa.
