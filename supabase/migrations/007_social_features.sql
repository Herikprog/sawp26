-- ==============================================================================
-- MIGRATION 007: FUNCIONALIDADES SOCIAIS COMPLETAS (Usernames, Seguir, Notificações)
-- ==============================================================================

-- 1. ADICIONAR USERNAME AO PERFIL
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

-- Função para gerar um username aleatório caso não exista
UPDATE public.profiles
SET username = 'user_' || substr(id::text, 1, 8)
WHERE username IS NULL;

-- Tornar obrigatório e único
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);

-- 2. TABELA DE SEGUIDORES
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (follower_id, following_id)
);

-- Políticas RLS para Follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer um pode ver seguidores" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Utilizadores podem seguir outros" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Utilizadores podem deixar de seguir" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- 3. TABELA DE NOTIFICAÇÕES GERAIS (Substitui o enum antigo para maior flexibilidade)
CREATE TABLE IF NOT EXISTS public.social_notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- Quem recebe
    actor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- Quem causou a ação
    type text NOT NULL, -- 'like', 'reply', 'repost', 'follow'
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE, -- Opcional, o post envolvido
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas RLS para Notificações
ALTER TABLE public.social_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver próprias notificações" ON public.social_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Criar notificação" ON public.social_notifications FOR INSERT WITH CHECK (auth.uid() = actor_id);
CREATE POLICY "Atualizar próprias notificações" ON public.social_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Eliminar próprias notificações" ON public.social_notifications FOR DELETE USING (auth.uid() = user_id);

-- 4. TRIGGERS AUTOMÁTICOS PARA NOTIFICAÇÕES (Instagram Style)

-- A) Trigger para Likes
CREATE OR REPLACE FUNCTION handle_new_like() RETURNS TRIGGER AS $$
BEGIN
    -- Se eu próprio der like, não notifica
    IF NEW.user_id = (SELECT user_id FROM public.posts WHERE id = NEW.post_id) THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.social_notifications (user_id, actor_id, type, post_id)
    VALUES (
        (SELECT user_id FROM public.posts WHERE id = NEW.post_id),
        NEW.user_id,
        'like',
        NEW.post_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_like ON public.post_likes;
CREATE TRIGGER on_post_like AFTER INSERT ON public.post_likes
FOR EACH ROW EXECUTE PROCEDURE handle_new_like();

-- B) Trigger para Respostas (Replies) e Reposts
CREATE OR REPLACE FUNCTION handle_new_post_interaction() RETURNS TRIGGER AS $$
BEGIN
    -- Se for Resposta
    IF NEW.parent_id IS NOT NULL AND NEW.user_id != (SELECT user_id FROM public.posts WHERE id = NEW.parent_id) THEN
        INSERT INTO public.social_notifications (user_id, actor_id, type, post_id)
        VALUES (
            (SELECT user_id FROM public.posts WHERE id = NEW.parent_id),
            NEW.user_id,
            'reply',
            NEW.id
        );
    END IF;

    -- Se for Repost
    IF NEW.repost_id IS NOT NULL AND NEW.user_id != (SELECT user_id FROM public.posts WHERE id = NEW.repost_id) THEN
        INSERT INTO public.social_notifications (user_id, actor_id, type, post_id)
        VALUES (
            (SELECT user_id FROM public.posts WHERE id = NEW.repost_id),
            NEW.user_id,
            'repost',
            NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_interaction ON public.posts;
CREATE TRIGGER on_post_interaction AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE PROCEDURE handle_new_post_interaction();

-- C) Trigger para Seguir
CREATE OR REPLACE FUNCTION handle_new_follow() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.social_notifications (user_id, actor_id, type)
    VALUES (NEW.following_id, NEW.follower_id, 'follow');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_follow ON public.follows;
CREATE TRIGGER on_new_follow AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE PROCEDURE handle_new_follow();
