-- ============================================================
-- MIGRATION 020: DENÚNCIAS E LIMPEZA DE CONVERSA
-- ============================================================

-- 1. Permitir que participantes excluam mensagens para limpar a conversa
DROP POLICY IF EXISTS "messages_delete_participant" ON messages;
CREATE POLICY "messages_delete_participant"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND auth.uid() IN (c.user_a_id, c.user_b_id)
    )
  );

-- 2. Tabela de Denúncias (user_reports)
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reported_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Um utilizador não se pode denunciar a si mesmo
  CONSTRAINT chk_no_self_report CHECK (reporter_id <> reported_id)
);

-- 3. Ativar RLS nas denúncias
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Permitir inserção apenas para utilizadores autenticados e que sejam o reporter_id
DROP POLICY IF EXISTS "user_reports_insert_own" ON user_reports;
CREATE POLICY "user_reports_insert_own"
  ON user_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Permitir visualizar apenas as próprias denúncias efetuadas
DROP POLICY IF EXISTS "user_reports_select_own" ON user_reports;
CREATE POLICY "user_reports_select_own"
  ON user_reports FOR SELECT
  USING (auth.uid() = reporter_id);
