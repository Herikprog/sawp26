-- ============================================================
-- MIGRATION 013: TRADE NOTIFICATIONS
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_trade() RETURNS TRIGGER AS $$
BEGIN
    -- Notificar o destinatário da proposta de troca
    INSERT INTO public.social_notifications (user_id, actor_id, type)
    VALUES (NEW.receiver_id, NEW.initiator_id, 'trade');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_trade ON public.trades;
CREATE TRIGGER on_new_trade AFTER INSERT ON public.trades
FOR EACH ROW EXECUTE PROCEDURE handle_new_trade();
