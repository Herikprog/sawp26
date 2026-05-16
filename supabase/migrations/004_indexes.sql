-- ============================================================
-- MIGRATION 004 — Índices de Performance
-- ============================================================

-- Índice espacial crítico para PostGIS
CREATE INDEX IF NOT EXISTS idx_profiles_location
  ON profiles USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_profiles_plano
  ON profiles (plano);

CREATE INDEX IF NOT EXISTS idx_profiles_is_online
  ON profiles (is_online);

-- user_stickers
CREATE INDEX IF NOT EXISTS idx_us_user
  ON user_stickers (user_id);

CREATE INDEX IF NOT EXISTS idx_us_sticker
  ON user_stickers (sticker_id);

CREATE INDEX IF NOT EXISTS idx_us_user_qty
  ON user_stickers (user_id, quantity);

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_conv
  ON messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON messages (sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages (conversation_id, read) WHERE read = FALSE;

-- notifications
CREATE INDEX IF NOT EXISTS idx_notif_user
  ON notifications (user_id, read, created_at DESC);

-- trades
CREATE INDEX IF NOT EXISTS idx_trades_initiator
  ON trades (initiator_id);

CREATE INDEX IF NOT EXISTS idx_trades_receiver
  ON trades (receiver_id);

CREATE INDEX IF NOT EXISTS idx_trades_status
  ON trades (status);

-- stickers
CREATE INDEX IF NOT EXISTS idx_stickers_codigo
  ON stickers (codigo);

CREATE INDEX IF NOT EXISTS idx_stickers_grupo
  ON stickers (grupo);

CREATE INDEX IF NOT EXISTS idx_stickers_selecao
  ON stickers (selecao);

-- conversations
CREATE INDEX IF NOT EXISTS idx_conv_user_a
  ON conversations (user_a_id, last_msg_at DESC);

CREATE INDEX IF NOT EXISTS idx_conv_user_b
  ON conversations (user_b_id, last_msg_at DESC);
