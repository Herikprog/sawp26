-- ============================================================
-- MIGRATION 002 — Row Level Security Policies
-- ============================================================

-- Habilitar RLS
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stickers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades         ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- USER_STICKERS
-- ============================================================
-- Dono pode ver/editar os seus stickers
CREATE POLICY "us_all_own"
  ON user_stickers FOR ALL USING (auth.uid() = user_id);

-- Outros podem ver stickers de qualquer usuário (para matching)
CREATE POLICY "us_select_others"
  ON user_stickers FOR SELECT USING (true);

-- ============================================================
-- TRADES
-- ============================================================
CREATE POLICY "trades_select_participant"
  ON trades FOR SELECT
  USING (auth.uid() = initiator_id OR auth.uid() = receiver_id);

CREATE POLICY "trades_insert_initiator"
  ON trades FOR INSERT WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY "trades_update_participant"
  ON trades FOR UPDATE
  USING (auth.uid() = initiator_id OR auth.uid() = receiver_id);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE POLICY "conv_select_participant"
  ON conversations FOR SELECT
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "conv_insert_participant"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "conv_update_participant"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE POLICY "msg_select_participant"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.user_a_id = auth.uid() OR c.user_b_id = auth.uid())
    )
  );

CREATE POLICY "msg_insert_sender"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "msg_update_participant"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.user_a_id = auth.uid() OR c.user_b_id = auth.uid())
    )
  );

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE POLICY "sub_select_own"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Service role insere/atualiza via webhook Stripe

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE POLICY "notif_select_own"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notif_update_own"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);
