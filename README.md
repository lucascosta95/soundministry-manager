# 🎧 SoundMinistry Manager

**Sistema para gerenciamento de escalas e equipes de sonoplastia.**

O **SoundMinistry Manager** simplifica a organização de escalas, permitindo gerenciar disponibilidade de voluntários, definir restrições e criar duplas de trabalho de forma eficiente e moderna.

---

## 📸 Screenshots

| Dashboard | Escalas |
|-----------|---------|
| ![Dashboard Preview](https://placehold.co/600x400?text=Dashboard+Preview) | ![Escalas Preview](https://placehold.co/600x400?text=Escalas+Preview) |

| Mobile View | Dark Mode |
|-------------|-----------|
| ![Mobile Preview](https://placehold.co/600x400?text=Mobile+View) | ![Dark Mode Preview](https://placehold.co/600x400?text=Dark+Mode) |

---

## 🚀 Funcionalidades Principais

- **Gestão de Voluntários**: Cadastro completo com controle de disponibilidade mensal, semanal e anual.
- **Duplas e Compatibilidade**: Definição de duplas preferenciais com validação automática de conflitos.
- **Restrições**: Bloqueio de datas específicas e gerenciamento de ausências.
- **Segurança**: Autenticação segura (Criptografia + Sessões), proteção de rotas e logs.
- **UX/UI Moderna**: Interface responsiva, suporte a Temas (Claro/Escuro) e Internacionalização (PT-BR/EN).

## 🛠️ Stack Tecnológica

O projeto utiliza as tecnologias mais recentes do ecossistema React:

- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Estilo**: Tailwind CSS + Shadcn/ui
- **Banco de Dados**: PostgreSQL + Prisma ORM
- **Autenticação**: Iron Session + Bcrypt
- **Validação**: Zod

## ⚡ Como Rodar o Projeto

### 1. Instalação
```bash
npm install
```

### 2. Configuração
Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
SESSION_SECRET="sua-chave-secreta-com-minimo-32-caracteres"
```

### 3. Banco de Dados
Inicialize o banco e popule com dados de teste:

```bash
npm run db:push        # Cria as tabelas
npx tsx prisma/seed.ts # Cria usuário admin e dados iniciais
```

### 4. Execução
```bash
npm run dev
```
Acesse: [http://localhost:3000](http://localhost:3000)


---

## 📄 Licença

Copyright © 2026 SoundMinistry Manager. Todos os direitos reservados.
