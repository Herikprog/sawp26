-- ============================================================
-- MIGRATION 001 — Schema Principal Swap26
-- ============================================================

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: profiles (extensão do auth.users do Supabase)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  cidade        TEXT,
  bairro        TEXT,
  location      GEOGRAPHY(POINT, 4326),
  descricao     TEXT,
  reputacao     NUMERIC(3,2) DEFAULT 5.00,
  total_trocas  INTEGER DEFAULT 0,
  plano         TEXT DEFAULT 'free' CHECK (plano IN ('free', 'premium')),
  is_online     BOOLEAN DEFAULT FALSE,
  last_seen     TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: stickers (figurinhas da copa — importada do bd.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS stickers (
  id       SERIAL PRIMARY KEY,
  codigo   VARCHAR(20) UNIQUE NOT NULL,
  nome     VARCHAR(150) NOT NULL,
  selecao  VARCHAR(100) NOT NULL,
  grupo    VARCHAR(10)  NOT NULL
);

-- ============================================================
-- TABELA: user_stickers
-- ============================================================
CREATE TABLE IF NOT EXISTS user_stickers (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sticker_id  INTEGER NOT NULL REFERENCES stickers(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  photo_url   TEXT,                         -- foto que o usuário fez upload
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sticker_id)
);

-- ============================================================
-- TABELA: trades
-- ============================================================
CREATE TABLE IF NOT EXISTS trades (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  initiator_id     UUID NOT NULL REFERENCES profiles(id),
  receiver_id      UUID NOT NULL REFERENCES profiles(id),
  status           TEXT DEFAULT 'pending'
                     CHECK (status IN ('pending','accepted','rejected','completed','cancelled')),
  offered_stickers INTEGER[] NOT NULL DEFAULT '{}',
  wanted_stickers  INTEGER[] NOT NULL DEFAULT '{}',
  match_score      NUMERIC(5,2),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: conversations
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_a_id    UUID NOT NULL REFERENCES profiles(id),
  user_b_id    UUID NOT NULL REFERENCES profiles(id),
  trade_id     UUID REFERENCES trades(id),
  last_message TEXT,
  last_msg_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_a_id, user_b_id)
);

-- ============================================================
-- TABELA: messages
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id),
  content         TEXT NOT NULL,
  read            BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: subscriptions (Stripe)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id   TEXT UNIQUE,
  stripe_sub_id        TEXT UNIQUE,
  plan                 TEXT DEFAULT 'free',
  status               TEXT DEFAULT 'active',
  current_period_end   TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('match','trade','message','system')),
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
