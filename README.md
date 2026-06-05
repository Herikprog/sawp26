# 🚀 Troca Stickers — Plataforma SaaS de Troca de Cromos

[![Next.js Version](https://img.shields.io/badge/Next.js-16.2.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React Version](https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payment-635bff?style=for-the-badge&logo=stripe)](https://stripe.com/)

**Troca Stickers** é uma plataforma SaaS moderna e responsiva projetada para conectar colecionadores de cromos (ex: Cadernetas de Futebol, Copas do Mundo, Animes, etc.), facilitando a troca física e local através de geolocalização, matchmaking automático de cromos repetidos/em falta e chat em tempo real.

---

## 📋 Índice

- [Funcionalidades Principais](#-funcionalidades-principais)
- [Arquitetura & Stack Tecnológica](#-arquitetura--stack-tecnológica)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Configuração do Ambiente (Variáveis `.env`)](#-configuração-do-ambiente)
- [Base de Dados & Migrações](#-base-de-dados--migrações)
- [Como Executar o Projeto](#-como-executar-o-projeto)
- [Segurança & Boas Práticas](#-segurança--boas-práticas)
- [Autores & Licença](#-autores--licença)

---

## ✨ Funcionalidades Principais

*   🗺️ **Mapa Interativo (Geolocalização)**: Integração com Leaflet para visualizar colecionadores ativos na sua região em tempo real e combinar trocas próximas.
*   ⚡ **Algoritmo de Matchmaking**: Sistema inteligente que cruza automaticamente a lista de cromos repetidos com os cromos em falta de outros colecionadores próximos.
*   💬 **Chat em Tempo Real**: Chat direto e seguro entre utilizadores para fechar negócios, integrado na plataforma.
*   🔔 **Notificações Push**: Alertas e avisos via Web Push para novas mensagens, correspondências (matches) e ações de suporte.
*   ⭐ **Plano Premium (SaaS)**: Fluxo de checkout com Stripe contendo suporte internacional a moedas (EUR, BRL) e geodetecção de preços, desbloqueando vantagens exclusivas.
*   🛡️ **Painel Administrativo Completo (RBAC)**: Painel de gestão robusto com controle granular de permissões (banir, suspender, impersonate, gerir tickets de suporte e estatísticas financeiras).

---

## 🛠️ Arquitetura & Stack Tecnológica

*   **Framework**: [Next.js 16.2](https://nextjs.org/) (App Router, Server Actions e Middlewares).
*   **Biblioteca de UI**: [React 19](https://react.dev/) com componentes modulares.
*   **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) (moderno, ultra-rápido, baseado em CSS nativo).
*   **Base de Dados & Autenticação**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security (RLS) e SSR Session Manager).
*   **Processamento de Pagamentos**: [Stripe](https://stripe.com/) (SDK de checkout, Webhooks resilientes e APIs de pricing dinâmico).
*   **Mapas**: [Leaflet](https://leafletjs.com/) & [React Leaflet](https://react-leaflet.js.org/).
*   **Notificações**: [Web-Push](https://www.npmjs.com/package/web-push) com Service Worker dedicado.
*   **Animações**: [Framer Motion](https://www.framer.com/motion/) para micro-interações fluidas.
*   **Gestão de Estado**: [Zustand](https://github.com/pmndrs/zustand) para store global leve.

---

## 📂 Estrutura do Projeto

```text
├── app/                  # Estrutura do App Router de Next.js
│   ├── (app)/            # Páginas autenticadas (dashboard, feed, chat, map, matches)
│   ├── admin/            # Painel Administrativo e gestão
│   ├── api/              # Endpoints de API (stripe, push notifications, admin endpoints)
│   ├── auth/             # Rotas de callback e redirecionamento de login/registo
│   ├── banned/           # Página de bloqueio de utilizadores suspensos/banidos
│   ├── layout.tsx        # Layout global da aplicação
│   └── page.tsx          # Landing page institucional
├── components/           # Componentes reutilizáveis de UI
├── hooks/                # Custom React Hooks (Push Notifications, Geolocation, etc.)
├── lib/                  # Utilitários, Supabase Server/Client, RBAC, Validação de Schemas
├── public/               # Ativos estáticos e Service Workers (sw.js)
├── supabase/             # Ficheiros SQL de migrações e triggers da base de dados
├── types/                # Definições globais de TypeScript
├── proxy.ts              # Middleware centralizado de autenticação e proteção contra bans
└── package.json          # Dependências do projeto
```

---

## ⚙️ Configuração do Ambiente

Crie um ficheiro `.env.local` na raiz do projeto e configure as seguintes chaves obrigatórias:

```env
# ------------------------------------------------------------------------------
# Configurações do Supabase
# ------------------------------------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_WEBHOOK_SECRET=your-supabase-db-webhook-secret

# ------------------------------------------------------------------------------
# Configurações do Stripe (Pagamentos & Planos)
# ------------------------------------------------------------------------------
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=your-default-stripe-price-id

# Configurações de Preço por Região (Geodetecção de Moeda)
STRIPE_PREMIUM_PRICE_EUR=price_eur_...
STRIPE_PREMIUM_PRICE_BRL=price_brl_...

# ------------------------------------------------------------------------------
# Notificações Push (Web Push / VAPID Keys)
# ------------------------------------------------------------------------------
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# ------------------------------------------------------------------------------
# Gerais da Aplicação
# ------------------------------------------------------------------------------
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🗄️ Base de Dados & Migrações

O projeto corre em cima da infraestrutura do Supabase. Certifique-se de aplicar as definições de RLS e migrações contidas na pasta `/supabase`.

### Migrações Recomendadas:
1. Aplique a migração de suporte ao sistema RBAC para administradores:
   ```bash
   # Execute o conteúdo do ficheiro no editor SQL do Supabase:
   supabase/migrations/add_missing_admin_columns.sql
   ```
   Esta migração ativa as permissões granulares (`perm_ban`, `perm_suspend`, `perm_tickets`, `is_super_admin`) e sincroniza os emails das contas na tabela `profiles`.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
*   Node.js (v18 ou superior recomendado)
*   NPM / PNPM / Yarn

### Desenvolvimento
Instale as dependências e inicie o servidor local:

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### Produção
Para compilar a aplicação otimizada para produção:

```bash
# Compilar projeto
npm run build

# Iniciar servidor de produção
npm run start
```

---

## 🛡️ Segurança & Boas Práticas

Esta plataforma implementa mecanismos de segurança rigorosos com base nos padrões atuais:

*   **Role-Based Access Control (RBAC)**: O acesso administrativo não é baseado apenas em emails fixos (hardcoded), mas sim num sistema de permissões granulares persistido na base de dados (`lib/rbac.ts`).
*   **Session Timeout & Middleware**: O ficheiro `proxy.ts` enforça sessões ativas e realiza deslog automático após 30 minutos de inatividade do utilizador.
*   **Rate Limiting**: Proteção integrada contra ataques de força bruta e spam em endpoints sensíveis (autenticação, publicação e painel administrativo).
*   **Row Level Security (RLS)**: Todas as tabelas no Supabase possuem políticas RLS ativas para garantir que utilizadores comuns apenas leiam ou alterem os seus próprios dados.
*   **Validação Estrita de Input**: Uso de validação e tipagem de schemas JSON via `validateRequest` para mitigar ataques de injeção e payloads corrompidos.

---

## 📄 Licença

Este projeto é privado e de uso restrito de desenvolvimento. Todos os direitos reservados.
