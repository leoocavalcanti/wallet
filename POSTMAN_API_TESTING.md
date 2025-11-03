# API Carteira Financeira - Guia de Testes no Postman

## 🚀 Configuração Base

**URL Base:** `http://localhost:3000`

**Headers para requisições autenticadas:**
- `Content-Type: application/json`
- `Authorization: Bearer {{token}}`

---

## 📋 Fluxo Completo de Testes Ponta a Ponta

### 1. Cadastro de Usuário

**Endpoint:** `POST /auth/register`

**Headers:**
```
Content-Type: application/json
```

**Corpo da Requisição - Usuário 1:**
```json
{
  "email": "usuario1@exemplo.com",
  "password": "senha123",
  "name": "Usuário Um",
  "balanceInCents": 100000
}
```

**Corpo da Requisição - Usuário 2:**
```json
{
  "email": "usuario2@exemplo.com",
  "password": "senha123",
  "name": "Usuário Dois",
  "balanceInCents": 50000
}
```

**Resposta Esperada:**
```json
{
  "user": {
    "id": "uuid-aqui",
    "email": "usuario1@exemplo.com",
    "name": "Usuário Um",
    "balanceInCents": 100000,
    "createdAt": "2025-11-03T22:04:58.169Z",
    "updatedAt": "2025-11-03T22:04:58.169Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> 💡 **Salve o `token` e `user.id` de ambas as respostas para uso posterior**

---

### 2. Autenticação de Usuário

**Endpoint:** `POST /auth/login`

**Headers:**
```
Content-Type: application/json
```

**Corpo da Requisição - Usuário 1:**
```json
{
  "email": "usuario1@exemplo.com",
  "password": "senha123"
}
```

**Corpo da Requisição - Usuário 2:**
```json
{
  "email": "usuario2@exemplo.com",
  "password": "senha123"
}
```

**Resposta Esperada:**
```json
{
  "user": {
    "id": "uuid-aqui",
    "email": "usuario1@exemplo.com",
    "name": "Usuário Um",
    "balanceInCents": 100000,
    "createdAt": "2025-11-03T22:04:58.169Z",
    "updatedAt": "2025-11-03T22:04:58.169Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 3. Obter Perfil do Usuário

**Endpoint:** `GET /users/profile`

**Headers:**
```
Authorization: Bearer {{user1_token}}
```

**Resposta Esperada:**
```json
{
  "id": "uuid-aqui",
  "email": "usuario1@exemplo.com",
  "name": "Usuário Um",
  "balanceInCents": 100000,
  "createdAt": "2025-11-03T22:04:58.169Z",
  "updatedAt": "2025-11-03T22:04:58.169Z"
}
```

---

### 4. Verificar Saldo do Usuário

**Endpoint:** `GET /users/balance`

**Headers:**
```
Authorization: Bearer {{user1_token}}
```

**Resposta Esperada:**
```json
{
  "balanceInCents": 100000,
  "balanceInReais": 1000
}
```

---

### 5. Criar Transação (Transferir Dinheiro)

**Endpoint:** `POST /transactions`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{user1_token}}
```

**Corpo da Requisição:**
```json
{
  "receiverId": "{{user2_id}}",
  "amountInCents": 25000,
  "description": "Transferência teste - 250 reais"
}
```

**Resposta Esperada:**
```json
{
  "id": "uuid-transacao",
  "senderId": "uuid-usuario1",
  "receiverId": "uuid-usuario2",
  "amountInCents": 25000,
  "description": "Transferência teste - 250 reais",
  "status": "completed",
  "reversalReason": null,
  "createdAt": "2025-11-03T22:15:00.000Z",
  "updatedAt": "2025-11-03T22:15:00.000Z"
}
```

> 💡 **Salve o `id` da transação para teste de reversão**

---

### 6. Obter Transações do Usuário

**Endpoint:** `GET /transactions`

**Headers:**
```
Authorization: Bearer {{user1_token}}
```

**Resposta Esperada:**
```json
[
  {
    "id": "uuid-transacao",
    "senderId": "uuid-usuario1",
    "receiverId": "uuid-usuario2",
    "amountInCents": 25000,
    "description": "Transferência teste - 250 reais",
    "status": "completed",
    "reversalReason": null,
    "createdAt": "2025-11-03T22:15:00.000Z",
    "updatedAt": "2025-11-03T22:15:00.000Z",
    "sender": {
      "id": "uuid-usuario1",
      "email": "usuario1@exemplo.com",
      "name": "Usuário Um",
      "balanceInCents": 75000
    },
    "receiver": {
      "id": "uuid-usuario2",
      "email": "usuario2@exemplo.com", 
      "name": "Usuário Dois",
      "balanceInCents": 75000
    }
  }
]
```

---

### 7. Obter Transação Específica

**Endpoint:** `GET /transactions/{{transaction_id}}`

**Headers:**
```
Authorization: Bearer {{user1_token}}
```

**Resposta Esperada:**
```json
{
  "id": "uuid-transacao",
  "senderId": "uuid-usuario1",
  "receiverId": "uuid-usuario2",
  "amountInCents": 25000,
  "description": "Transferência teste - 250 reais",
  "status": "completed",
  "reversalReason": null,
  "createdAt": "2025-11-03T22:15:00.000Z",
  "updatedAt": "2025-11-03T22:15:00.000Z",
  "sender": {
    "id": "uuid-usuario1",
    "email": "usuario1@exemplo.com",
    "name": "Usuário Um"
  },
  "receiver": {
    "id": "uuid-usuario2",
    "email": "usuario2@exemplo.com",
    "name": "Usuário Dois"
  }
}
```

---

### 8. Reverter Transação

**Endpoint:** `PATCH /transactions/{{transaction_id}}/reverse`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{user1_token}}
```

**Corpo da Requisição:**
```json
{
  "reason": "Solicitação do usuário - teste de reversão"
}
```

**Resposta Esperada:**
```json
{
  "id": "uuid-transacao",
  "senderId": "uuid-usuario1",
  "receiverId": "uuid-usuario2",
  "amountInCents": 25000,
  "description": "Transferência teste - 250 reais",
  "status": "reversed",
  "reversalReason": "Solicitação do usuário - teste de reversão",
  "createdAt": "2025-11-03T22:15:00.000Z",
  "updatedAt": "2025-11-03T22:16:00.000Z"
}
```

---

## 🧪 Casos de Teste Adicionais

### Testes de Validação de Erro

#### 1. Transferência para Si Mesmo (Deve Falhar)
**Endpoint:** `POST /transactions`
```json
{
  "receiverId": "{{user1_id}}",
  "amountInCents": 10000,
  "description": "Transferência para si mesmo"
}
```
**Esperado:** `400 Bad Request - Cannot transfer to yourself`

#### 2. Saldo Insuficiente (Deve Falhar)
**Endpoint:** `POST /transactions`
```json
{
  "receiverId": "{{user2_id}}",
  "amountInCents": 999999999,
  "description": "Transferir muito dinheiro"
}
```
**Esperado:** `400 Bad Request - Insufficient balance`

#### 3. Receptor Inválido (Deve Falhar)
**Endpoint:** `POST /transactions`
```json
{
  "receiverId": "uuid-invalido",
  "amountInCents": 10000,
  "description": "Transferir para usuário inválido"
}
```
**Esperado:** `404 Not Found - User not found`

#### 4. Valor Negativo (Deve Falhar)
**Endpoint:** `POST /transactions`
```json
{
  "receiverId": "{{user2_id}}",
  "amountInCents": -10000,
  "description": "Valor negativo"
}
```
**Esperado:** `400 Bad Request - Amount must be positive`

#### 5. Reverter Transação Já Revertida (Deve Falhar)
Tente reverter a mesma transação duas vezes.
**Esperado:** `400 Bad Request - Only completed transactions can be reversed`

---

## 📊 Fluxo de Verificação de Saldo

### Testar Fluxo Completo de Dinheiro:

1. **Saldos Iniciais:**
   - Usuário 1: R$ 1.000,00 (100000 centavos)
   - Usuário 2: R$ 500,00 (50000 centavos)

2. **Após Transferência de R$ 250,00 (25000 centavos):**
   - Usuário 1: R$ 750,00 (75000 centavos)
   - Usuário 2: R$ 750,00 (75000 centavos)

3. **Após Reversão:**
   - Usuário 1: R$ 1.000,00 (100000 centavos) 
   - Usuário 2: R$ 500,00 (50000 centavos)

### Passos de Verificação:
1. Verificar saldos iniciais com `GET /users/balance`
2. Criar transferência
3. Verificar saldos atualizados
4. Reverter transação
5. Verificar que saldos voltaram aos valores originais

---

## 🔒 Notas de Autenticação

- Todos os endpoints exceto `/auth/register` e `/auth/login` requerem autenticação
- Tokens expiram após 24 horas (86400 segundos)
- Use o formato `Authorization: Bearer {{token}}` no header
- Salve os tokens das respostas de login/cadastro

---

## 📖 Documentação da API

Para documentação interativa da API, visite: `http://localhost:3000/api`

---

## 🐳 Comandos Docker

```bash
# Iniciar a aplicação
docker-compose up -d

# Verificar status dos containers
docker-compose ps

# Ver logs da aplicação
docker-compose logs app

# Parar a aplicação
docker-compose down
```

---

## 💡 Variáveis de Ambiente do Postman

Crie essas variáveis no Postman:

- `base_url`: `http://localhost:3000`
- `user1_token`: (definir após login)
- `user2_token`: (definir após login)
- `user1_id`: (definir após cadastro/login)
- `user2_id`: (definir após cadastro/login)
- `transaction_id`: (definir após criar transação)

Isso permite usar `{{base_url}}`, `{{user1_token}}`, etc. nas suas requisições.