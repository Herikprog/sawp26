-- ============================================================
-- MIGRATION 017: SYSTEM FOR TRANSACTIONAL STICKER TRADING IN CHAT
-- ============================================================

CREATE OR REPLACE FUNCTION execute_sticker_trade(
  p_conversation_id UUID,
  p_user_a_id        UUID,
  p_user_b_id        UUID,
  p_user_a_offers    JSONB, -- Array de objetos: [{"codigo": "BRA-1", "quantity": 1}]
  p_user_b_offers    JSONB  -- Array de objetos: [{"codigo": "ARG-5", "quantity": 2}]
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_offer            RECORD;
  v_sticker_id       INTEGER;
  v_sticker_code     TEXT;
  v_qty              INTEGER;
  v_current_qty      INTEGER;
  v_nome_a           TEXT;
  v_nome_b           TEXT;
  v_system_msg       TEXT;
  v_trade_details_a  TEXT := '';
  v_trade_details_b  TEXT := '';
BEGIN
  -- 1. Obter nomes dos utilizadores para o recibo e logs de erro
  SELECT nome INTO v_nome_a FROM profiles WHERE id = p_user_a_id;
  SELECT nome INTO v_nome_b FROM profiles WHERE id = p_user_b_id;

  -- 2. Validar ofertas do Utilizador A
  FOR v_offer IN SELECT * FROM jsonb_to_recordset(p_user_a_offers) AS x(codigo TEXT, quantity INTEGER) LOOP
    v_sticker_code := v_offer.codigo;
    v_qty := v_offer.quantity;
    
    -- Obter o ID correspondente da figurinha pelo código
    SELECT id INTO v_sticker_id FROM stickers WHERE codigo = v_sticker_code;
    IF v_sticker_id IS NULL THEN
      RAISE EXCEPTION 'A figurinha com o código "%" não existe no sistema.', v_sticker_code;
    END IF;

    -- Obter a quantidade atual que o Utilizador A possui
    SELECT quantity INTO v_current_qty 
    FROM user_stickers 
    WHERE user_id = p_user_a_id AND sticker_id = v_sticker_id;

    IF v_current_qty IS NULL OR v_current_qty < v_qty THEN
      RAISE EXCEPTION 'Quantidade insuficiente: % possui apenas % unidades da figurinha % e tentou oferecer %.', v_nome_a, COALESCE(v_current_qty, 0), v_sticker_code, v_qty;
    END IF;

    -- APLICAR REGRA CRÍTICA: Manter pelo menos 1 unidade no álbum
    IF (v_current_qty - v_qty) < 1 THEN
      RAISE EXCEPTION 'A figurinha % não pode ser trocada porque % ficaria sem nenhuma unidade no álbum (deve manter pelo menos 1 unidade residual).', v_sticker_code, v_nome_a;
    END IF;

    -- Registrar para o recibo de texto
    v_trade_details_a := v_trade_details_a || v_sticker_code || ' (x' || v_qty || '), ';
  END LOOP;

  -- 3. Validar ofertas do Utilizador B
  FOR v_offer IN SELECT * FROM jsonb_to_recordset(p_user_b_offers) AS x(codigo TEXT, quantity INTEGER) LOOP
    v_sticker_code := v_offer.codigo;
    v_qty := v_offer.quantity;
    
    -- Obter o ID correspondente da figurinha pelo código
    SELECT id INTO v_sticker_id FROM stickers WHERE codigo = v_sticker_code;
    IF v_sticker_id IS NULL THEN
      RAISE EXCEPTION 'A figurinha com o código "%" não existe no sistema.', v_sticker_code;
    END IF;

    -- Obter a quantidade atual que o Utilizador B possui
    SELECT quantity INTO v_current_qty 
    FROM user_stickers 
    WHERE user_id = p_user_b_id AND sticker_id = v_sticker_id;

    IF v_current_qty IS NULL OR v_current_qty < v_qty THEN
      RAISE EXCEPTION 'Quantidade insuficiente: % possui apenas % unidades da figurinha % e tentou oferecer %.', v_nome_b, COALESCE(v_current_qty, 0), v_sticker_code, v_qty;
    END IF;

    -- APLICAR REGRA CRÍTICA: Manter pelo menos 1 unidade no álbum
    IF (v_current_qty - v_qty) < 1 THEN
      RAISE EXCEPTION 'A figurinha % não pode ser trocada porque % ficaria sem nenhuma unidade no álbum (deve manter pelo menos 1 unidade residual).', v_sticker_code, v_nome_b;
    END IF;

    -- Registrar para o recibo de texto
    v_trade_details_b := v_trade_details_b || v_sticker_code || ' (x' || v_qty || '), ';
  END LOOP;

  -- 4. PROCESSAR DE FATO A TROCA DOS PRODUTOS
  -- 4a. Processar saídas e entradas do Utilizador A para o B
  FOR v_offer IN SELECT * FROM jsonb_to_recordset(p_user_a_offers) AS x(codigo TEXT, quantity INTEGER) LOOP
    v_sticker_code := v_offer.codigo;
    v_qty := v_offer.quantity;
    SELECT id INTO v_sticker_id FROM stickers WHERE codigo = v_sticker_code;

    -- Diminuir do álbum de A
    UPDATE user_stickers 
    SET quantity = quantity - v_qty, updated_at = NOW()
    WHERE user_id = p_user_a_id AND sticker_id = v_sticker_id;

    -- Adicionar ou atualizar no álbum de B
    INSERT INTO user_stickers (user_id, sticker_id, quantity, updated_at)
    VALUES (p_user_b_id, v_sticker_id, v_qty, NOW())
    ON CONFLICT (user_id, sticker_id) 
    DO UPDATE SET quantity = user_stickers.quantity + v_qty, updated_at = NOW();
  END LOOP;

  -- 4b. Processar saídas e entradas do Utilizador B para o A
  FOR v_offer IN SELECT * FROM jsonb_to_recordset(p_user_b_offers) AS x(codigo TEXT, quantity INTEGER) LOOP
    v_sticker_code := v_offer.codigo;
    v_qty := v_offer.quantity;
    SELECT id INTO v_sticker_id FROM stickers WHERE codigo = v_sticker_code;

    -- Diminuir do álbum de B
    UPDATE user_stickers 
    SET quantity = quantity - v_qty, updated_at = NOW()
    WHERE user_id = p_user_b_id AND sticker_id = v_sticker_id;

    -- Adicionar ou atualizar no álbum de A
    INSERT INTO user_stickers (user_id, sticker_id, quantity, updated_at)
    VALUES (p_user_a_id, v_sticker_id, v_qty, NOW())
    ON CONFLICT (user_id, sticker_id) 
    DO UPDATE SET quantity = user_stickers.quantity + v_qty, updated_at = NOW();
  END LOOP;

  -- 5. INCREMENTAR O NÚMERO TOTAL DE TROCAS DOS PERFIS
  UPDATE profiles SET total_trocas = total_trocas + 1 WHERE id = p_user_a_id;
  UPDATE profiles SET total_trocas = total_trocas + 1 WHERE id = p_user_b_id;

  -- 6. CRIAR A MENSAGEM DE RECIBO DO SISTEMA NO CHAT
  IF v_trade_details_a = '' THEN
    v_trade_details_a := 'Nenhuma figurinha';
  ELSE
    v_trade_details_a := rtrim(v_trade_details_a, ', ');
  END IF;

  IF v_trade_details_b = '' THEN
    v_trade_details_b := 'Nenhuma figurinha';
  ELSE
    v_trade_details_b := rtrim(v_trade_details_b, ', ');
  END IF;

  v_system_msg := '🔄 TROCA DE FIGURINHAS CONCLUÍDA!' || CHR(10) || 
                  '🤝 ' || v_nome_a || ' enviou: ' || v_trade_details_a || CHR(10) || 
                  '🤝 ' || v_nome_b || ' enviou: ' || v_trade_details_b;

  INSERT INTO messages (conversation_id, sender_id, content, read, created_at)
  VALUES (p_conversation_id, p_user_a_id, v_system_msg, false, NOW());

  -- Atualizar o histórico da conversa
  UPDATE conversations 
  SET last_message = v_system_msg, last_msg_at = NOW(), updated_at = NOW()
  WHERE id = p_conversation_id;

  RETURN jsonb_build_object('success', true, 'message', v_system_msg);
END;
$$;
