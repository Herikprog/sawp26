-- ============================================================
-- MIGRATION 003 — Funções SQL (PostGIS + Álbum)
-- ============================================================

-- ============================================================
-- FUNÇÃO: handle_new_user
-- Cria profile automaticamente ao registar
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNÇÃO: get_nearby_matches
-- Retorna matches próximos — NUNCA expõe coordenadas reais
-- ============================================================
CREATE OR REPLACE FUNCTION get_nearby_matches(
  p_user_id   UUID,
  p_radius_km FLOAT DEFAULT 10
)
RETURNS TABLE (
  user_id          UUID,
  nome             TEXT,
  avatar_url       TEXT,
  bairro           TEXT,
  cidade           TEXT,
  distancia_km     FLOAT,
  stickers_tem     INTEGER[],
  stickers_precisa INTEGER[],
  score            FLOAT,
  is_premium       BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_location GEOGRAPHY;
  v_plano    TEXT;
BEGIN
  SELECT location, plano INTO v_location, v_plano
  FROM profiles WHERE id = p_user_id;

  IF v_location IS NULL THEN
    RETURN;
  END IF;

  -- Premium tem raio dobrado
  IF v_plano = 'premium' THEN
    p_radius_km := p_radius_km * 2;
  END IF;

  RETURN QUERY
  WITH meus_faltantes AS (
    SELECT sticker_id FROM user_stickers
    WHERE user_id = p_user_id AND quantity = 0
  ),
  minhas_repetidas AS (
    SELECT sticker_id FROM user_stickers
    WHERE user_id = p_user_id AND quantity > 1
  )
  SELECT
    p.id,
    p.nome,
    p.avatar_url,
    p.bairro,
    p.cidade,
    ROUND(ST_Distance(p.location, v_location) / 1000.0, 1)::FLOAT,
    ARRAY(
      SELECT us.sticker_id FROM user_stickers us
      WHERE us.user_id = p.id AND us.quantity >= 1
        AND us.sticker_id IN (SELECT sticker_id FROM meus_faltantes)
    ),
    ARRAY(
      SELECT us.sticker_id FROM user_stickers us
      WHERE us.user_id = p.id AND us.quantity = 0
        AND us.sticker_id IN (SELECT sticker_id FROM minhas_repetidas)
    ),
    (
      COALESCE(ARRAY_LENGTH(ARRAY(
        SELECT us.sticker_id FROM user_stickers us
        WHERE us.user_id = p.id AND us.quantity >= 1
          AND us.sticker_id IN (SELECT sticker_id FROM meus_faltantes)
      ), 1), 0) * 10.0
      + p.reputacao * 5.0
      + CASE WHEN p.plano = 'premium' THEN 20.0 ELSE 0.0 END
      - ROUND(ST_Distance(p.location, v_location) / 1000.0, 1)
    )::FLOAT,
    (p.plano = 'premium')
  FROM profiles p
  WHERE
    p.id != p_user_id
    AND p.location IS NOT NULL
    AND ST_DWithin(p.location, v_location, p_radius_km * 1000)
  ORDER BY 9 DESC
  LIMIT 50;
END;
$$;

-- ============================================================
-- FUNÇÃO: get_album_stats
-- ============================================================
CREATE OR REPLACE FUNCTION get_album_stats(p_user_id UUID)
RETURNS TABLE (
  total_stickers INTEGER,
  obtained       INTEGER,
  missing        INTEGER,
  duplicates     INTEGER,
  completion_pct NUMERIC
) LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM stickers;

  RETURN QUERY
  SELECT
    v_total,
    COUNT(*) FILTER (WHERE us.quantity >= 1)::INTEGER,
    (v_total - COUNT(*) FILTER (WHERE us.quantity >= 1)::INTEGER),
    COUNT(*) FILTER (WHERE us.quantity > 1)::INTEGER,
    ROUND(
      COUNT(*) FILTER (WHERE us.quantity >= 1)::NUMERIC / NULLIF(v_total, 0) * 100,
      1
    )
  FROM user_stickers us
  WHERE us.user_id = p_user_id;
END;
$$;

-- ============================================================
-- FUNÇÃO: update_last_seen trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_online != OLD.is_online THEN
    NEW.last_seen = NOW();
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_update_last_seen
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_last_seen();

-- ============================================================
-- FUNÇÃO: update_conversation_last_message trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_conv_last_message()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE conversations
  SET last_message = NEW.content,
      last_msg_at  = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_conv_last_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conv_last_message();
