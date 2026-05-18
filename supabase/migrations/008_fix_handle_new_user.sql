-- ============================================================
-- MIGRATION 008: FIX HANDLE NEW USER FUNCTION
-- ============================================================

-- A coluna 'username' foi definida como NOT NULL na migration 007, 
-- no entanto a função handle_new_user não a estava a preencher,
-- causando erro 500 no registo de novos utilizadores.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, avatar_url, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    'user_' || substr(NEW.id::text, 1, 8) -- Gera username padrão seguro
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
