-- ============================================================
-- MIGRATION 009: FIX GET NEARBY MATCHES LOGIC & GPS SUPPORT
-- ============================================================

CREATE OR REPLACE FUNCTION get_nearby_matches(
  p_user_id   UUID,
  p_radius_km FLOAT DEFAULT 10,
  p_lat       FLOAT DEFAULT NULL,
  p_lon       FLOAT DEFAULT NULL
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
  -- Obter plano do utilizador
  SELECT plano INTO v_plano
  FROM profiles WHERE id = p_user_id;

  -- Construir ou carregar a localização
  IF p_lat IS NOT NULL AND p_lon IS NOT NULL THEN
    -- Usar as coordenadas do navegador em tempo real
    v_location := ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography;
    
    -- Atualizar o perfil do utilizador no banco em background
    UPDATE profiles 
    SET location = v_location, last_seen = NOW()
    WHERE id = p_user_id;
  ELSE
    -- Fallback para a localização salva no perfil
    SELECT location INTO v_location
    FROM profiles WHERE id = p_user_id;
  END IF;

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
        AND us.sticker_id NOT IN (SELECT sticker_id FROM minhas_obtidas)
    ),
    ARRAY(
      SELECT s.id FROM stickers s
      WHERE s.id NOT IN (SELECT sticker_id FROM user_stickers WHERE user_id = p.id AND quantity >= 1)
        AND s.id IN (SELECT sticker_id FROM minhas_repetidas)
    ),
    (
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
