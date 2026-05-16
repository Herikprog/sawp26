-- ============================================================
-- MIGRATION 005 — Configuração de Storage (Avatars)
-- ============================================================

-- 1. Criar o bucket de avatars como público
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir acesso público para leitura
CREATE POLICY "Avatar Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- 3. Permitir upload apenas para o próprio usuário (na sua pasta)
CREATE POLICY "Avatar User Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Permitir atualização apenas para o próprio usuário
CREATE POLICY "Avatar User Update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. Permitir delete apenas para o próprio usuário
CREATE POLICY "Avatar User Delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );
