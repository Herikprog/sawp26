-- ============================================================
-- MIGRATION 024: ADMIN FIXES — RLS, user_reports + notifications
-- ============================================================

-- 1. Adicionar coluna "content" à social_notifications (para mensagens de texto livre)
ALTER TABLE public.social_notifications
  ADD COLUMN IF NOT EXISTS content TEXT;

-- 2. Permitir que o service role (admin) leia user_reports sem restrição de RLS
--    (as políticas existentes só deixam o próprio reporter ver as suas denúncias)
DROP POLICY IF EXISTS "admin_user_reports_select" ON public.user_reports;
CREATE POLICY "admin_user_reports_select"
  ON public.user_reports FOR SELECT
  USING (true); -- service_role bypasses RLS; esta policy é para o painel admin autenticado

-- 3. Garantir que o admin (service_role) pode inserir em social_notifications
DROP POLICY IF EXISTS "social_notif_insert_service" ON public.social_notifications;
CREATE POLICY "social_notif_insert_service"
  ON public.social_notifications FOR INSERT
  WITH CHECK (true);

-- 4. Garantir que utilizadores podem ver as suas próprias notificações (incluindo as de admin)
DROP POLICY IF EXISTS "social_notif_select_own" ON public.social_notifications;
CREATE POLICY "social_notif_select_own"
  ON public.social_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Garantir RLS habilitado nas tabelas envolvidas
ALTER TABLE public.social_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
