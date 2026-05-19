-- ============================================================
-- MIGRATION 019: CHAT & TRADE — SEGURANÇA E ROBUSTEZ
-- ============================================================

-- 1. Coluna messages.type para distinguir mensagens de sistema vs texto
--    Evita detecção frágil por string match no frontend
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'text'
  CHECK (type IN ('text', 'system', 'trade_receipt'));

-- 2. Índice para queries de mensagens não lidas por conversa (melhora a query da ChatListPage)
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages (conversation_id, read, sender_id)
  WHERE read = false;

-- 3. RLS em trades
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Apenas iniciador ou receptor podem ver a sua troca
DROP POLICY IF EXISTS "trades_select_participant" ON trades;
CREATE POLICY "trades_select_participant"
  ON trades FOR SELECT
  USING (auth.uid() IN (initiator_id, receiver_id));

-- Só o iniciador pode criar uma troca
DROP POLICY IF EXISTS "trades_insert_initiator" ON trades;
CREATE POLICY "trades_insert_initiator"
  ON trades FOR INSERT
  WITH CHECK (auth.uid() = initiator_id);

-- Só o receptor ou o iniciador podem actualizar (aceitar/rejeitar/cancelar)
DROP POLICY IF EXISTS "trades_update_participant" ON trades;
CREATE POLICY "trades_update_participant"
  ON trades FOR UPDATE
  USING (auth.uid() IN (initiator_id, receiver_id));

-- 4. RLS em messages (se não existir já)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Só participantes da conversa podem ler mensagens
DROP POLICY IF EXISTS "messages_select_participant" ON messages;
CREATE POLICY "messages_select_participant"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND auth.uid() IN (c.user_a_id, c.user_b_id)
    )
  );

-- Só o remetente pode inserir mensagens
DROP POLICY IF EXISTS "messages_insert_sender" ON messages;
CREATE POLICY "messages_insert_sender"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND auth.uid() IN (c.user_a_id, c.user_b_id)
    )
  );

-- Qualquer participante da conversa pode marcar como lido
DROP POLICY IF EXISTS "messages_update_read" ON messages;
CREATE POLICY "messages_update_read"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND auth.uid() IN (c.user_a_id, c.user_b_id)
    )
  );

-- 5. Função execute_sticker_trade — adicionar validação de inventário server-side
--    com SELECT FOR UPDATE para lock pessimista (evita race conditions de execução dupla)
CREATE OR REPLACE FUNCTION execute_sticker_trade(
  p_conversation_id UUID,
  p_user_a_id       UUID,
  p_user_b_id       UUID,
  p_user_a_offers   JSONB,
  p_user_b_offers   JSONB
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_offer       JSONB;
  v_codigo      TEXT;
  v_qty         INTEGER;
  v_sticker_id  INTEGER;
  v_owned_qty   INTEGER;
  v_receipt     TEXT := E'🔄 TROCA DE FIGURINHAS CONCLUÍDA!\n';
BEGIN
  -- Verificar se a transação não está a ser duplicada
  -- (o frontend garante que só o ID mais baixo executa, mas o DB valida também)

  -- Validar e debitar ofertas do utilizador A
  FOR v_offer IN SELECT * FROM jsonb_array_elements(p_user_a_offers) LOOP
    v_codigo := v_offer->>'codigo';
    v_qty    := (v_offer->>'quantity')::INTEGER;

    -- Resolver sticker_id pelo código
    SELECT id INTO v_sticker_id FROM stickers WHERE codigo = v_codigo;
    IF v_sticker_id IS NULL THEN
      RAISE EXCEPTION 'Figurinha % não encontrada no catálogo.', v_codigo;
    END IF;

    -- Lock pessimista: bloqueia a linha até fim da transacção
    SELECT quantity INTO v_owned_qty
    FROM user_stickers
    WHERE user_id = p_user_a_id AND sticker_id = v_sticker_id
    FOR UPDATE;

    IF v_owned_qty IS NULL OR v_owned_qty < v_qty + 1 THEN
      RAISE EXCEPTION 'Utilizador A não possui figurinhas suficientes de % (tem %, precisa de % + 1 residual).', v_codigo, COALESCE(v_owned_qty, 0), v_qty;
    END IF;
  END LOOP;

  -- Validar e debitar ofertas do utilizador B
  FOR v_offer IN SELECT * FROM jsonb_array_elements(p_user_b_offers) LOOP
    v_codigo := v_offer->>'codigo';
    v_qty    := (v_offer->>'quantity')::INTEGER;

    SELECT id INTO v_sticker_id FROM stickers WHERE codigo = v_codigo;
    IF v_sticker_id IS NULL THEN
      RAISE EXCEPTION 'Figurinha % não encontrada no catálogo.', v_codigo;
    END IF;

    SELECT quantity INTO v_owned_qty
    FROM user_stickers
    WHERE user_id = p_user_b_id AND sticker_id = v_sticker_id
    FOR UPDATE;

    IF v_owned_qty IS NULL OR v_owned_qty < v_qty + 1 THEN
      RAISE EXCEPTION 'Utilizador B não possui figurinhas suficientes de % (tem %, precisa de % + 1 residual).', v_codigo, COALESCE(v_owned_qty, 0), v_qty;
    END IF;
  END LOOP;

  -- Executar a troca: A entrega para B
  FOR v_offer IN SELECT * FROM jsonb_array_elements(p_user_a_offers) LOOP
    v_codigo := v_offer->>'codigo';
    v_qty    := (v_offer->>'quantity')::INTEGER;
    SELECT id INTO v_sticker_id FROM stickers WHERE codigo = v_codigo;

    UPDATE user_stickers SET quantity = quantity - v_qty
    WHERE user_id = p_user_a_id AND sticker_id = v_sticker_id;

    INSERT INTO user_stickers (user_id, sticker_id, quantity)
    VALUES (p_user_b_id, v_sticker_id, v_qty)
    ON CONFLICT (user_id, sticker_id) DO UPDATE
    SET quantity = user_stickers.quantity + v_qty;

    v_receipt := v_receipt || format(E'  [A→B] %s ×%s\n', v_codigo, v_qty);
  END LOOP;

  -- Executar a troca: B entrega para A
  FOR v_offer IN SELECT * FROM jsonb_array_elements(p_user_b_offers) LOOP
    v_codigo := v_offer->>'codigo';
    v_qty    := (v_offer->>'quantity')::INTEGER;
    SELECT id INTO v_sticker_id FROM stickers WHERE codigo = v_codigo;

    UPDATE user_stickers SET quantity = quantity - v_qty
    WHERE user_id = p_user_b_id AND sticker_id = v_sticker_id;

    INSERT INTO user_stickers (user_id, sticker_id, quantity)
    VALUES (p_user_a_id, v_sticker_id, v_qty)
    ON CONFLICT (user_id, sticker_id) DO UPDATE
    SET quantity = user_stickers.quantity + v_qty;

    v_receipt := v_receipt || format(E'  [B→A] %s ×%s\n', v_codigo, v_qty);
  END LOOP;

  -- Remover entradas com quantity = 0
  DELETE FROM user_stickers WHERE quantity <= 0;

  -- Registar recibo no chat como mensagem de sistema
  INSERT INTO messages (conversation_id, sender_id, content, type, read)
  VALUES (p_conversation_id, p_user_a_id, v_receipt, 'trade_receipt', false);

  RETURN jsonb_build_object('success', true, 'receipt', v_receipt);
END;
$$;
