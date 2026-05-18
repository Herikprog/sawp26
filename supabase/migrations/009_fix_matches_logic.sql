-- ============================================================
-- MIGRATION 009: FIX GET NEARBY MATCHES LOGIC
-- ============================================================

-- A função get_nearby_matches estava a assumir que as figurinhas faltantes 
-- tinham um registo na tabela user_stickers com quantity = 0.
-- No entanto, por omissão, se um utilizador não tem a figurinha,
-- simplesmente não existe registo na tabela.

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
#variable_conflict use_column
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
  WITH minhas_obtidas AS (
    SELECT sticker_id FROM user_stickers
    WHERE user_id = p_user_id AND quantity >= 1
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
    ROUND((ST_Distance(p.location, v_location) / 1000.0)::numeric, 1)::FLOAT,
    ARRAY(
      SELECT us.sticker_id FROM user_stickers us
      WHERE us.user_id = p.id AND us.quantity >= 1
        AND us.sticker_id NOT IN (SELECT sticker_id FROM minhas_obtidas) -- Ele tem o que eu NÃO tenho
    ),
    ARRAY(
      SELECT s.id FROM stickers s
      WHERE s.id NOT IN (SELECT sticker_id FROM user_stickers WHERE user_id = p.id AND quantity >= 1) -- O que ele NÃO tem
        AND s.id IN (SELECT sticker_id FROM minhas_repetidas) -- Mas eu tenho repetido
    ),
    (
      -- Score = 10 pontos por cada figurinha que ele tem e eu preciso
      COALESCE(ARRAY_LENGTH(ARRAY(
        SELECT us.sticker_id FROM user_stickers us
        WHERE us.user_id = p.id AND us.quantity >= 1
          AND us.sticker_id NOT IN (SELECT sticker_id FROM minhas_obtidas)
      ), 1), 0) * 10.0
      + COALESCE(p.reputacao, 5.0) * 5.0
      + CASE WHEN p.plano = 'premium' THEN 20.0 ELSE 0.0 END
      - ROUND((ST_Distance(p.location, v_location) / 1000.0)::numeric, 1)
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
