-- ============================================================
-- MIGRATION 029: CONSENT LOGS AND PRIVACY CONSTRAINTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.consent_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type  TEXT NOT NULL,
  consented     BOOLEAN NOT NULL,
  ip_address    TEXT,
  user_agent    TEXT,
  terms_version TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS na consent_logs
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança para consent_logs
DROP POLICY IF EXISTS consent_logs_select_policy ON public.consent_logs;
CREATE POLICY consent_logs_select_policy ON public.consent_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS consent_logs_insert_policy ON public.consent_logs;
CREATE POLICY consent_logs_insert_policy ON public.consent_logs
  FOR INSERT WITH CHECK (true);

-- Garantir ON DELETE CASCADE na push_subscriptions
ALTER TABLE public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_fkey;
ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Garantir ON DELETE CASCADE na social_notifications
ALTER TABLE public.social_notifications DROP CONSTRAINT IF EXISTS social_notifications_user_id_fkey;
ALTER TABLE public.social_notifications DROP CONSTRAINT IF EXISTS social_notifications_actor_id_fkey;
ALTER TABLE public.social_notifications
  ADD CONSTRAINT social_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT social_notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
