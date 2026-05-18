-- ============================================================
-- MIGRATION 012: IMPROVE CONVERSATION REALTIME SYNC
-- ============================================================

-- A função update_conv_last_message deve também atualizar o timestamp
-- quando uma mensagem é marcada como lida, para que o Realtime do Sidebar dispare.

CREATE OR REPLACE FUNCTION update_conv_on_message_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE conversations
    SET last_message = NEW.content,
        last_msg_at  = NEW.created_at,
        updated_at   = NOW()
    WHERE id = NEW.conversation_id;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Se apenas o status 'read' mudou, tocamos no 'updated_at' da conversa
    -- para avisar o Sidebar via Realtime.
    IF (OLD.read IS DISTINCT FROM NEW.read) THEN
      UPDATE conversations
      SET updated_at = NOW()
      WHERE id = NEW.conversation_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_conv_last_message ON public.messages;

CREATE TRIGGER trg_conv_realtime_sync
  AFTER INSERT OR UPDATE OF read ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_conv_on_message_change();
