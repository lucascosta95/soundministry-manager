# 🎧 SoundMinistry Manager

Sistema completo de gerenciamento para equipe de sonoplastia de igrejas, desenvolvido com Next.js, TypeScript e PostgreSQL.

## 📋 Funcionalidades

### ✅ Implementado (Parte 1 - CRUD)

- **Autenticação**
  - Sistema de login com e-mail e senha
  - Senhas criptografadas com bcrypt
  - Sessões seguras com iron-session
  - Proteção de rotas

- **Gerenciamento de Sonoplastas**
  - CRUD completo
  - Nome, data de aniversário
  - Disponibilidade mensal (quantidade máxima de vezes no mês)
  - Disponibilidade semanal (Quarta, Sábado, Domingo)
  - Disponibilidade anual (12 meses)
  - Validações front-end e back-end

- **Duplas Preferenciais**
  - CRUD completo
  - Validação de compatibilidade de disponibilidade
  - Verificação de duplicação
  - Impede sonoplastas iguais na mesma dupla

- **Restrições Mensais**
  - CRUD completo
  - Registro de dias indisponíveis por mês/ano
  - Seleção visual de dias
  - Validação de duplicação

- **Interface & UX**
  - Design moderno e profissional
  - 100% responsivo (mobile, tablet, desktop)
  - Tema claro e escuro
  - Internacionalização (Português e Inglês)
  - Componentes reutilizáveis com shadcn/ui
  - Feedback visual com toasts

## 🛠️ Stack Tecnológica

### Front-end
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (componentes)
- **next-themes** (modo claro/escuro)
- **next-intl** (internacionalização)
- **Lucide React** (ícones)

### Back-end
- **Next.js API Routes**
- **PostgreSQL**
- **Prisma ORM**
- **iron-session** (gerenciamento de sessão)
- **bcryptjs** (criptografia de senha)
- **Zod** (validação de dados)

## 🚀 Como Rodar o Projeto

### Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL instalado e rodando
- npm ou yarn

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Banco de Dados

Você pode usar **PostgreSQL local** ou **Neon** (PostgreSQL serverless):

#### Opção A: Neon (Recomendado - Mais Fácil!) 🟢

```bash
# Inicializar Neon (cria .env automaticamente)
npx neonctl@latest init
```

Depois adicione manualmente o `SESSION_SECRET` no `.env`:

```env
# Gerado automaticamente pelo Neon
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

# Adicione esta linha (gere uma chave forte)
SESSION_SECRET="sua-chave-secreta-aqui-minimo-32-caracteres-muito-importante"
```

#### Opção B: PostgreSQL Local

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/soundministry"
SESSION_SECRET="sua-chave-secreta-aqui-minimo-32-caracteres-muito-importante"
```

**Importante:** 
- Substitua `usuario`, `senha` e o nome do banco conforme seu ambiente PostgreSQL
- Gere uma chave secreta forte para `SESSION_SECRET` (mínimo 32 caracteres)

### 3. Criar e Popular o Banco de Dados

```bash
# Criar as tabelas no banco
npm run db:push

# Popular com dados iniciais (usuário admin + exemplos)
npx tsx prisma/seed.ts
```

### 4. Rodar o Projeto

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

### 5. Fazer Login

**Credenciais padrão:**
- E-mail: `admin@soundministry.com`
- Senha: `admin123`

⚠️ **Importante:** Altere essas credenciais em produção!

## 📁 Estrutura do Projeto

```
soundministry-manager/
├── prisma/
│   ├── schema.prisma          # Modelagem do banco de dados
│   └── seed.ts               # Dados iniciais
├── src/
│   ├── app/
│   │   ├── (dashboard)/      # Rotas protegidas
│   │   │   ├── operators/    # Página de sonoplastas
│   │   │   ├── pairs/        # Página de duplas
│   │   │   ├── restrictions/ # Página de restrições
│   │   │   └── page.tsx      # Dashboard principal
│   │   ├── api/              # API Routes
│   │   │   ├── auth/         # Autenticação
│   │   │   ├── operators/    # CRUD de sonoplastas
│   │   │   ├── pairs/        # CRUD de duplas
│   │   │   └── restrictions/ # CRUD de restrições
│   │   ├── login/            # Página de login
│   │   ├── layout.tsx        # Layout raiz
│   │   └── globals.css       # Estilos globais
│   ├── components/
│   │   ├── ui/               # Componentes shadcn/ui
│   │   ├── operators/        # Componentes de sonoplastas
│   │   ├── pairs/            # Componentes de duplas
│   │   ├── restrictions/     # Componentes de restrições
│   │   ├── dashboard-layout.tsx
│   │   ├── theme-provider.tsx
│   │   ├── theme-toggle.tsx
│   │   └── language-switcher.tsx
│   ├── lib/
│   │   ├── prisma.ts         # Cliente Prisma
│   │   ├── session.ts        # Configuração de sessão
│   │   └── utils.ts          # Utilitários
│   └── middleware.ts         # Middleware de autenticação
├── messages/
│   ├── pt-BR.json           # Traduções em Português
│   └── en-US.json           # Traduções em Inglês
└── package.json
```

## 🗃️ Modelagem do Banco de Dados

### User (Usuários)
- `id` - Identificador único
- `email` - E-mail único
- `password` - Senha criptografada
- `name` - Nome do usuário

### SoundOperator (Sonoplastas)
- `id` - Identificador único
- `name` - Nome
- `birthday` - Data de aniversário
- `monthlyAvailability` - Disponibilidade mensal (número)
- `weeklyAvailability` - Dias da semana disponíveis (array)
- `annualAvailability` - Meses disponíveis (array)

### PreferredPair (Duplas Preferenciais)
- `id` - Identificador único
- `firstOperatorId` - ID do primeiro sonoplasta
- `secondOperatorId` - ID do segundo sonoplasta
- Constraint único para evitar duplicação

### MonthlyRestriction (Restrições Mensais)
- `id` - Identificador único
- `operatorId` - ID do sonoplasta
- `month` - Mês (1-12)
- `year` - Ano
- `restrictedDays` - Dias indisponíveis (array)
- Constraint único por operador/mês/ano

## 🎨 Interface

### Responsividade
- **Mobile**: Menu hambúrguer, layout otimizado
- **Tablet**: Layout intermediário
- **Desktop**: Sidebar fixa, layout completo

### Temas
- **Claro**: Interface limpa e profissional
- **Escuro**: Modo noturno confortável
- **Sistema**: Segue preferência do sistema operacional

### Idiomas
- **Português (pt-BR)**: Idioma padrão
- **Inglês (en-US)**: Tradução completa
- Troca instantânea sem recarregar a página

## 🔒 Segurança

- Senhas criptografadas com bcrypt (salt rounds: 10)
- Sessões seguras com iron-session
- Middleware de proteção de rotas
- Validação de dados no front-end e back-end
- Queries SQL com Prisma (proteção contra SQL Injection)

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento

# Build
npm run build            # Cria build de produção
npm start                # Inicia servidor de produção

# Banco de Dados
npm run db:generate      # Gera cliente Prisma
npm run db:push          # Sincroniza schema com banco
npm run db:migrate       # Cria migration
npm run db:studio        # Abre Prisma Studio (GUI do banco)

# Linting
npm run lint             # Verifica código
```

## 🔄 Próximos Passos (Parte 2)

Funcionalidades planejadas para futuras implementações:

- Geração automática de escala mensal
- Algoritmo de otimização considerando:
  - Disponibilidades
  - Duplas preferenciais
  - Restrições mensais
  - Equilíbrio de distribuição
- Visualização de calendário
- Exportação de escala (PDF, Excel)
- Notificações por e-mail
- Histórico de escalas

## 🤝 Contribuindo

Este é um projeto privado, mas sugestões são bem-vindas!

## 📄 Licença

Todos os direitos reservados © 2026 SoundMinistry Manager

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se o PostgreSQL está rodando
2. Confirme que as variáveis de ambiente estão configuradas
3. Execute `npm run db:push` para sincronizar o banco
4. Limpe o cache: `rm -rf .next && npm run dev`

---

**Desenvolvido com ❤️ para igrejas**
