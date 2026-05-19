-- ============================================================
-- MIGRATION 021: REGISTO DE SUBSCRIÇÕES DE NOTIFICAÇÕES PUSH
-- ============================================================

-- 1. Tabela para armazenar as credenciais de push de cada dispositivo/browser
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Evitar duplicar o mesmo browser para o mesmo utilizador
  CONSTRAINT unique_user_endpoint UNIQUE (user_id, endpoint)
);

-- 2. Ativar RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança (apenas o próprio utilizador gere as suas subscrições)
DROP POLICY IF EXISTS "push_subscriptions_select_own" ON push_subscriptions;
CREATE POLICY "push_subscriptions_select_own"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions_insert_own" ON push_subscriptions;
CREATE POLICY "push_subscriptions_insert_own"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions_delete_own" ON push_subscriptions;
CREATE POLICY "push_subscriptions_delete_own"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);
