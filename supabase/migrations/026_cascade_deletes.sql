-- ============================================================
-- MIGRATION 026: CASCADE DELETES FOR USER REMOVAL
-- ============================================================

-- 1. Tabela: trades (relacionamento com profiles)
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_initiator_id_fkey;
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_receiver_id_fkey;

ALTER TABLE public.trades
  ADD CONSTRAINT trades_initiator_id_fkey FOREIGN KEY (initiator_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT trades_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Tabela: conversations (relacionamento com profiles)
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_user_a_id_fkey;
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_user_b_id_fkey;

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_user_a_id_fkey FOREIGN KEY (user_a_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT conversations_user_b_id_fkey FOREIGN KEY (user_b_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Tabela: conversations (relacionamento com trades - set null para manter o chat quando a troca é deletada)
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_trade_id_fkey;

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.trades(id) ON DELETE SET NULL;

-- 4. Tabela: messages (relacionamento com profiles)
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
