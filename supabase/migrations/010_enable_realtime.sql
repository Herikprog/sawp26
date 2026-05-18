-- ============================================================
-- MIGRATION 010: ENABLE REALTIME FOR CHAT & NOTIFICATIONS
-- ============================================================

-- O sistema de chat (ChatWindow.tsx) depende das subscrições Realtime do Supabase.
-- Se estas tabelas não estiverem na publicação 'supabase_realtime', os sockets
-- nunca recebem eventos INSERT/UPDATE, quebrando a atualização ao vivo das mensagens
-- e obrigando os utilizadores a recarregar a página para verem respostas.

DO $$
BEGIN
  -- Habilitar o Realtime para mensagens e conversas (Bate-papo)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;

  -- Habilitar o Realtime para notificações sociais e seguidores
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'social_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.social_notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'follows'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
  END IF;

  -- Habilitar o Realtime para o Álbum (figurinhas)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_stickers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_stickers;
  END IF;

  -- Habilitar o Realtime para o Feed da Comunidade
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'post_likes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
  END IF;

  -- Habilitar o Realtime para Trocas
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'trades'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
  END IF;
END $$;
