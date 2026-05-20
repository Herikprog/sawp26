-- ============================================================
-- MIGRATION 028: POST REPORTS AND BAN/SUSPENSION LOGS
-- ============================================================

-- 1. Tabela para denúncias de posts
CREATE TABLE IF NOT EXISTS public.post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'replied', 'closed')),
  admin_reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para post_reports
DROP POLICY IF EXISTS "post_reports_insert_own" ON public.post_reports;
CREATE POLICY "post_reports_insert_own" ON public.post_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "post_reports_select_own" ON public.post_reports;
CREATE POLICY "post_reports_select_own" ON public.post_reports
  FOR SELECT USING (auth.uid() = reporter_id);


-- 2. Tabela para histórico/registro detalhado de banimentos e suspensões
CREATE TABLE IF NOT EXISTS public.ban_suspension_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_user_name TEXT NOT NULL,
  action TEXT NOT NULL, -- 'ban', 'unban', 'suspend'
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ban_suspension_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins leem (bypass via service role no client, mas criamos uma policy segura)
DROP POLICY IF EXISTS "admins_read_logs" ON public.ban_suspension_logs;
CREATE POLICY "admins_read_logs" ON public.ban_suspension_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );
