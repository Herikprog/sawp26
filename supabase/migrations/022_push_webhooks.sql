-- ============================================================
-- MIGRATION 022: AUTOMATIC PUSH NOTIFICATION WEBHOOKS VIA SQL
-- ============================================================

-- 1. Certificar que a extensão de rede pg_net está ativa
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Função de Trigger para efetuar a chamada POST HTTP para a API da Vercel
CREATE OR REPLACE FUNCTION public.handle_push_notification_trigger()
RETURNS TRIGGER AS $$
DECLARE
  payload text;
BEGIN
  -- Construir o payload JSON com o nome da tabela e o novo registro
  payload := json_build_object(
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW)
  )::text;

  -- Efetuar chamada assíncrona POST HTTP em background
  PERFORM net.http_post(
    url := 'https://sawp2026.vercel.app/api/push/send',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := payload
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Triggers para a tabela de mensagens (messages)
DROP TRIGGER IF EXISTS on_new_message_push ON public.messages;
CREATE TRIGGER on_new_message_push
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_push_notification_trigger();

-- 4. Triggers para a tabela de notificações (social_notifications)
DROP TRIGGER IF EXISTS on_new_social_notification_push ON public.social_notifications;
CREATE TRIGGER on_new_social_notification_push
AFTER INSERT ON public.social_notifications
FOR EACH ROW
EXECUTE FUNCTION public.handle_push_notification_trigger();
