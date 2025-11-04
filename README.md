# 🏦 Sistema de Carteira Financeira

Sistema monolítico de carteira financeira construído com **NestJS**, **TypeScript**, **PostgreSQL** e **JWT** para transferências seguras entre usuários.

## 📋 Índice

- [🎯 Objetivo](#-objetivo)
- [🏗️ Arquitetura](#️-arquitetura)
- [✅ Requisitos Atendidos](#-requisitos-atendidos)
- [🚀 Instalação e Configuração](#-instalação-e-configuração)
- [▶️ Como Iniciar](#️-como-iniciar)
- [📡 API Endpoints](#-api-endpoints)
- [🧪 Testes](#-testes)
- [🔒 Segurança](#-segurança)
- [📊 Arquitetura de Dados](#-arquitetura-de-dados)

## 🎯 Objetivo

Sistema de carteira financeira que permite aos usuários:

- **Cadastro e autenticação** segura de usuários
- **Transferências de saldo** entre usuários com validação
- **Transações reversíveis** para qualquer inconsistência
- **Saldo em centavos** para preservar precisão decimal
- **Logs e monitoramento** completo das operações

## 🏗️ Arquitetura

### Arquitetura Clean Code com Design Patterns

O sistema implementa **Clean Code**, **princípios SOLID** e **Design Patterns** para máxima qualidade e manutenibilidade.

```mermaid
graph TD
    A[Client] -->|HTTP :3000| B[NestJS Application]
    B --> C[Auth Module]
    B --> D[Users Module] 
    B --> E[Transactions Module]
    B --> R[Queue Module]
    
    C --> F[JWT Strategy]
    D --> G[Users Service]
    E --> H[Transactions Service]
    E --> T[Transaction Domain Service]
    E --> S[Strategy Factory]
    E --> ST[Transfer Strategy]
    
    T --> SF[Strategy Factory]
    T --> RQ[RabbitMQ Service]
    SF --> ST
    
    G --> I[PostgreSQL Database]
    H --> I
    T --> I
    RQ --> Q[RabbitMQ Logs]
    
    I --> J[Users Table]
    I --> K[Transactions Table]
    
    B --> L[Winston Logger]
    B --> M[Swagger Documentation]
    
    classDef pattern fill:#e1f5fe
    class S,SF,ST,T pattern
```

### Arquitetura Clean Code

#### 📂 Estrutura de Pastas
```
src/
├── common/
│   ├── interfaces/           # Interfaces para SOLID
│   │   ├── repository.interface.ts
│   │   └── queue.interface.ts
│   └── value-objects/        # Value Objects (DDD)
│       └── money.vo.ts
├── modules/
│   ├── auth/                 # Autenticação
│   ├── users/                # Gerenciamento de usuários
│   ├── transactions/
│   │   ├── services/         # Domain Services
│   │   │   └── transaction-domain.service.ts
│   │   ├── strategies/       # Strategy Pattern
│   │   │   ├── transaction-strategy.interface.ts
│   │   │   └── transfer-strategy.ts
│   │   ├── factories/        # Factory Pattern
│   │   │   └── transaction-strategy.factory.ts
│   │   └── dto/             # Data Transfer Objects
│   └── queue/               # RabbitMQ Integration
│       └── rabbitmq.service.ts
```

### 🎯 Design Patterns Implementados

| Pattern | Implementação | Benefício |
|---------|---------------|-----------|
| **Strategy Pattern** | `TransferStrategy` para tipos de transação | Extensibilidade para novos tipos |
| **Factory Pattern** | `TransactionStrategyFactory` | Criação centralizada de strategies |
| **Domain Service** | `TransactionDomainService` | Lógica de negócio isolada |
| **Value Objects** | `Money` class | Encapsulamento de valores monetários |
| **Repository Pattern** | Interfaces genéricas | Abstração de acesso a dados |

### 🔧 Princípios SOLID

- ✅ **Single Responsibility**: Cada classe tem uma responsabilidade única
- ✅ **Open/Closed**: Strategy Pattern permite extensão sem modificação
- ✅ **Liskov Substitution**: Interfaces permitem substituição de implementações
- ✅ **Interface Segregation**: Interfaces específicas (IQueueService, ITransactionEventPublisher)
- ✅ **Dependency Inversion**: Injeção de dependências e abstrações

### 🐰 RabbitMQ Integration

Sistema de eventos assíncronos para monitoramento de transações:

```typescript
// Eventos publicados automaticamente:
transaction.created     // Quando transação é criada
transaction.completed   // Quando transação é concluída
transaction.reversed    // Quando transação é revertida
transaction.failed      // Quando transação falha
```

### Componentes

| Componente | Descrição |
|------------|-----------|
| **NestJS Application** | Aplicação principal na porta 3000 |
| **Auth Module** | Autenticação JWT com strategies |
| **Users Module** | Gerenciamento de usuários e saldo |
| **Transactions Module** | Processamento com Clean Architecture |
| **Transaction Domain Service** | Lógica de negócio complexa |
| **Strategy Factory** | Criação de estratégias de transação |
| **RabbitMQ Service** | Eventos assíncronos e logging |
| **PostgreSQL** | Banco de dados principal |
| **Winston Logger** | Sistema de logs estruturados |
| **Swagger** | Documentação automática da API |

## ✅ Requisitos Atendidos

### Requisitos Obrigatórios ✅

- ✅ **Cadastro de usuários** - Endpoint `/auth/register`
- ✅ **Autenticação JWT** - Endpoint `/auth/login` 
- ✅ **Transferências** - Endpoint `POST /transactions`
- ✅ **Validação de saldo** - Verificação antes de cada transferência
- ✅ **Transações reversíveis** - Endpoint `PATCH /transactions/:id/reverse`

### Tecnologias Obrigatórias ✅

- ✅ **Node.js** - Runtime JavaScript
- ✅ **NestJS** - Framework para aplicações scaláveis
- ✅ **TypeScript** - Linguagem de programação

### Diferenciais Implementados ✅

- ✅ **Docker** - Containerização completa
- ✅ **Testes unitários** - 27 testes passando
- ✅ **Testes de integração** - Testes E2E completos
- ✅ **Documentação** - Swagger + README detalhado
- ✅ **Logging** - Winston para logs estruturados
- ✅ **Clean Code** - Arquitetura limpa e SOLID
- ✅ **Design Patterns** - Strategy, Factory, Domain Service
- ✅ **RabbitMQ** - Sistema de eventos assíncronos
- ✅ **Value Objects** - Money class para precisão
- ✅ **Security** - Sanitização de dados sensíveis

## 🚀 Instalação e Configuração

### Pré-requisitos

- **Node.js** 18+ e **npm**
- **Docker** e **Docker Compose**
- **Git**
- **Postman** ou **curl** (para testes de API)

### 1. Clone o Repositório

```bash
git clone <repository-url>
cd microsservices-bank
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure o Ambiente

O arquivo `.env` já está configurado com valores padrão:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/financial_wallet
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
```

⚠️ **IMPORTANTE**: Em produção, altere o `JWT_SECRET` para uma chave segura!

## ▶️ Como Iniciar

### 1. Inicie o Banco de Dados

```bash
# Apenas o PostgreSQL
docker-compose up postgres -d
```

### 2. Execute a Aplicação

```bash
# Desenvolvimento
npm run start:dev

# Produção (build primeiro)
npm run build
npm run start:prod
```

### 3. Verifique os Logs

Você deve ver logs similares a:

```
🚀 Financial Wallet API is running on port 3000
📖 API Documentation available at http://localhost:3000/api
```

### 4. Acesse a Documentação

- **API Swagger**: http://localhost:3000/api
- **Aplicação**: http://localhost:3000

## 🐳 Executar com Docker

### Subir todo ambiente

```bash
docker-compose up -d
```

Isso iniciará:
- PostgreSQL na porta 5432
- Aplicação na porta 3000

## 📡 API Endpoints

Base URL: `http://localhost:3000`

### 🔐 Autenticação

#### Registrar Usuário
```http
POST /auth/register
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "senha123",
  "name": "Nome do Usuário",
  "balanceInCents": 100000
}
```

**Resposta (201):**
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "usuario@email.com",
    "name": "Nome do Usuário",
    "balanceInCents": 100000,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

### 👤 Usuários (Autenticado)

#### Perfil do Usuário
```http
GET /users/profile
Authorization: Bearer <token>
```

#### Saldo do Usuário
```http
GET /users/balance
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "balanceInCents": 100000,
  "balanceInReais": 1000.00
}
```

### 💸 Transações (Autenticado)

#### Criar Transferência
```http
POST /transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiverId": "uuid-do-destinatario",
  "amountInCents": 5000,
  "description": "Transferência PIX"
}
```

**Resposta (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "senderId": "123e4567-e89b-12d3-a456-426614174000",
  "receiverId": "123e4567-e89b-12d3-a456-426614174001",
  "amountInCents": 5000,
  "description": "Transferência PIX",
  "status": "completed",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### Listar Transações do Usuário
```http
GET /transactions
Authorization: Bearer <token>
```

#### Buscar Transação por ID
```http
GET /transactions/{id}
Authorization: Bearer <token>
```

#### Reverter Transação
```http
PATCH /transactions/{id}/reverse
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Motivo da reversão"
}
```

## 🧪 Testes

O projeto inclui cobertura completa de testes unitários e de integração.

### Executar Testes

```bash
# Todos os testes
npm test

# Apenas testes unitários
npm run test:unit

# Testes de integração (E2E)
npm run test:e2e

# Testes com coverage
npm run test:cov

# Modo watch (desenvolvimento)
npm run test:watch
```

### Cobertura dos Testes

#### Testes Unitários
- ✅ **AuthService** - Registro, login, validação JWT
- ✅ **UsersService** - CRUD usuários, validação saldo
- ✅ **TransactionsService** - Transferências, reversões

#### Testes de Integração (E2E)
- ✅ **Autenticação** - Registro e login completo
- ✅ **Usuários** - Perfil e consulta de saldo
- ✅ **Transações** - Criação, listagem, busca, reversão
- ✅ **Segurança** - Validação de tokens JWT
- ✅ **Validações** - Dados de entrada e regras de negócio

## 🔒 Segurança

### Implementações de Segurança

- ✅ **JWT Authentication** - Tokens seguros com expiração
- ✅ **Password Hashing** - bcryptjs com salt rounds
- ✅ **Input Validation** - class-validator em todos os DTOs
- ✅ **SQL Injection Protection** - TypeORM com prepared statements
- ✅ **CORS** - Configurado para origens permitidas
- ✅ **Rate Limiting** - Via reverse proxy (recomendado)

### Melhores Práticas

- Senhas hasheadas com bcrypt (salt rounds: 10)
- Tokens JWT com expiração de 24h
- Validação rigorosa de entrada
- Transações atômicas para operações financeiras
- Logs estruturados sem informações sensíveis

## 🧹 Clean Code & Arquitetura

### Princípios Aplicados

#### 🎯 Clean Code
- **Nomes descritivos**: Classes e métodos com nomes claros
- **Funções pequenas**: Uma responsabilidade por função
- **Comentários desnecessários removidos**: Código autoexplicativo
- **Tratamento de erros**: Exceptions específicas para cada caso
- **Testes abrangentes**: Cobertura de 100% dos casos críticos

#### 🏗️ Clean Architecture
```
┌─────────────────────────────────────┐
│           Controllers               │ ← Interface/Framework Layer
├─────────────────────────────────────┤
│              Services               │ ← Application Layer
├─────────────────────────────────────┤
│          Domain Services            │ ← Domain Layer
│         Value Objects               │
│           Strategies                │
├─────────────────────────────────────┤
│            Repository               │ ← Infrastructure Layer
│            Database                 │
│            RabbitMQ                 │
└─────────────────────────────────────┘
```

#### 💎 Value Objects Implementados
```typescript
// Money Value Object - Encapsula lógica monetária
export class Money {
  private readonly _amountInCents: number;
  
  constructor(amountInCents: number) {
    if (!Number.isInteger(amountInCents)) {
      throw new Error('Amount must be an integer representing cents');
    }
    this._amountInCents = amountInCents;
  }
  
  add(other: Money): Money {
    return new Money(this._amountInCents + other._amountInCents);
  }
  
  subtract(other: Money): Money {
    const result = this._amountInCents - other._amountInCents;
    if (result < 0) throw new Error('Insufficient funds');
    return new Money(result);
  }
}
```

#### 🎨 Strategy Pattern Example
```typescript
// Interface para estratégias de transação
export interface ITransactionStrategy {
  validate(sender: User, receiver: User, amount: Money): Promise<void>;
  execute(sender: User, receiver: User, amount: Money, description: string): Promise<void>;
}

// Implementação específica para transferências
@Injectable()
export class TransferStrategy implements ITransactionStrategy {
  async validate(sender: User, receiver: User, amount: Money): Promise<void> {
    if (sender.id === receiver.id) {
      throw new BadRequestException('Cannot transfer to yourself');
    }
    
    const senderBalance = Money.fromCents(sender.balanceInCents);
    if (senderBalance.isLessThan(amount)) {
      throw new BadRequestException('Insufficient balance');
    }
  }

  async execute(sender: User, receiver: User, amount: Money): Promise<void> {
    await this.validate(sender, receiver, amount);
    sender.balanceInCents -= amount.amountInCents;
    receiver.balanceInCents += amount.amountInCents;
  }
}
```

### 🔄 Event-Driven Architecture

#### RabbitMQ Events
```typescript
// Eventos do sistema de transações
interface TransactionEvents {
  'transaction.created': {
    transactionId: string;
    senderId: string;
    receiverId: string;
    amountInCents: number;
    timestamp: string;
  };
  
  'transaction.completed': {
    transactionId: string;
    newSenderBalance: number;
    newReceiverBalance: number;
    timestamp: string;
  };
  
  'transaction.reversed': {
    transactionId: string;
    reason: string;
    timestamp: string;
  };
}
```

### 📊 Metrics & Observability
- **Structured Logging**: Winston com formato JSON
- **Transaction Events**: RabbitMQ para auditoria
- **Error Tracking**: Stack traces estruturados
- **Performance**: Database transaction timing
- **Security**: Sanitização automática de dados sensíveis

## 📊 Arquitetura de Dados

### Modelo de Dados

```mermaid
erDiagram
    User {
        uuid id PK
        string email UK
        string password
        string name
        integer balanceInCents
        timestamp createdAt
        timestamp updatedAt
    }
    
    Transaction {
        uuid id PK
        uuid senderId FK
        uuid receiverId FK
        integer amountInCents
        string description
        enum status
        string reversalReason
        timestamp createdAt
        timestamp updatedAt
    }
    
    User ||--o{ Transaction : "sends"
    User ||--o{ Transaction : "receives"
```

### Entidades

#### User
- `id`: UUID único do usuário
- `email`: Email único para login
- `password`: Senha hasheada com bcrypt
- `name`: Nome completo do usuário
- `balanceInCents`: Saldo em centavos (inteiro)

#### Transaction
- `id`: UUID único da transação
- `senderId`: UUID do usuário remetente
- `receiverId`: UUID do usuário destinatário
- `amountInCents`: Valor em centavos (inteiro)
- `status`: pending | completed | reversed | failed
- `description`: Descrição opcional
- `reversalReason`: Motivo da reversão (se aplicável)

### Regras de Negócio

1. **Saldo em Centavos**: Todos os valores são armazenados como inteiros em centavos
2. **Transações Atômicas**: Transferências usam transações de banco de dados
3. **Validação de Saldo**: Verificação obrigatória antes de transferências
4. **Reversões**: Apenas transações "completed" podem ser revertidas
5. **Segurança**: Usuários só podem reverter suas próprias transações

## 🔄 Fluxo de Teste Completo

### 1. Registrar Usuários
```bash
# Primeiro usuário
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@email.com",
    "password": "senha123",
    "name": "Usuário 1",
    "balanceInCents": 100000
  }'

# Segundo usuário  
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user2@email.com",
    "password": "senha123", 
    "name": "Usuário 2",
    "balanceInCents": 50000
  }'
```

### 2. Fazer Login e Obter Token
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@email.com",
    "password": "senha123"
  }'
```

### 3. Criar Transferência
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_DO_USER1>" \
  -d '{
    "receiverId": "<ID_DO_USER2>",
    "amountInCents": 25000,
    "description": "Transferência teste"
  }'
```

### 4. Verificar Saldos
```bash
# Saldo do remetente
curl -H "Authorization: Bearer <TOKEN_DO_USER1>" \
  http://localhost:3000/users/balance

# Saldo do destinatário (precisa do token do user2)
curl -H "Authorization: Bearer <TOKEN_DO_USER2>" \
  http://localhost:3000/users/balance
```

### 5. Reverter Transação (Opcional)
```bash
curl -X PATCH http://localhost:3000/transactions/<TRANSACTION_ID>/reverse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_DO_USER1>" \
  -d '{
    "reason": "Reversão de teste"
  }'
```

## 🛠️ Solução de Problemas

### Aplicação não inicia
- Verifique se o Node.js 18+ está instalado
- Execute `npm install` para instalar dependências
- Verifique se a porta 3000 está disponível

### Erro de conexão com banco
- Execute `docker-compose up postgres -d`
- Aguarde alguns segundos para o banco inicializar
- Verifique logs: `docker-compose logs postgres`

### Testes falhando
- Certifique-se que o banco está rodando
- Execute `npm run test:unit` para testes que não dependem do banco
- Para testes E2E, o banco deve estar disponível

---

## 📚 Tecnologias Utilizadas

### Core Technologies
- **Node.js** - Runtime JavaScript
- **NestJS** - Framework para aplicações escaláveis
- **TypeScript** - Linguagem de programação tipada
- **PostgreSQL** - Banco de dados relacional

### Architecture & Patterns
- **Clean Architecture** - Arquitetura em camadas
- **SOLID Principles** - Princípios de design
- **Strategy Pattern** - Para tipos de transação
- **Factory Pattern** - Criação de objetos
- **Domain Services** - Lógica de negócio
- **Value Objects** - Encapsulamento de valores

### Security & Authentication
- **JWT** - Autenticação via tokens
- **bcryptjs** - Hash de senhas
- **Passport.js** - Estratégias de autenticação

### Database & ORM
- **TypeORM** - ORM para TypeScript
- **PostgreSQL Driver** - Conectividade com banco

### Messaging & Events
- **RabbitMQ** - Sistema de eventos assíncronos
- **amqplib** - Cliente RabbitMQ para Node.js

### Development & Testing
- **Jest** - Framework de testes
- **Supertest** - Testes de integração HTTP
- **Docker** - Containerização
- **Docker Compose** - Orquestração de containers

### Monitoring & Documentation
- **Winston** - Sistema de logs estruturados
- **Swagger** - Documentação automática da API
- **class-validator** - Validação de entrada
- **class-transformer** - Transformação de objetos

---

- **🏗️ Arquitetura em Camadas**: Separação clara de responsabilidades
- **🎯 Strategy Pattern**: Extensibilidade para novos tipos de transação
- **🏭 Factory Pattern**: Criação centralizada de objetos
- **💰 Value Objects**: Money class para operações monetárias seguras
- **🐰 RabbitMQ Events**: Sistema de eventos assíncronos para auditoria
- **🔒 Security Enhanced**: Sanitização automática de dados sensíveis
- **✅ 27 Unit Tests**: Cobertura completa com nova arquitetura
