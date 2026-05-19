-- ============================================================
-- MIGRATION 022: AUTOMATIC PUSH NOTIFICATION WEBHOOKS VIA SQL
-- ============================================================

-- 1. Certificar que a extensão de rede pg_net está ativa
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1.5. Função auxiliar SECURITY DEFINER para obter subscrições push ignorando RLS
CREATE OR REPLACE FUNCTION public.get_user_push_subscriptions(p_user_id UUID)
RETURNS TABLE (
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT ps.endpoint, ps.p256dh, ps.auth
  FROM public.push_subscriptions ps
  WHERE ps.user_id = p_user_id;
END;
$$;

-- 1.6. Função auxiliar SECURITY DEFINER para deletar subscrições expiradas ignorando RLS
CREATE OR REPLACE FUNCTION public.delete_expired_push_subscription(p_endpoint TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.push_subscriptions
  WHERE endpoint = p_endpoint;
END;
$$;

-- 2. Remover quaisquer triggers baseados em pg_net para usar Webhooks Nativos do Painel do Supabase
DROP TRIGGER IF EXISTS on_new_message_push ON public.messages;
DROP TRIGGER IF EXISTS on_new_social_notification_push ON public.social_notifications;
DROP FUNCTION IF EXISTS public.handle_push_notification_trigger();
