-- ============================================================
-- MIGRATION 023: ADMIN PANEL, ANNOUNCEMENTS, SUPPORT & LAUNCH
-- ============================================================

-- 1. Novas colunas na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin        BOOLEAN     DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_banned       BOOLEAN     DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ban_expires_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;

-- 2. Tabela de avisos globais
CREATE TABLE IF NOT EXISTS public.global_announcements (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  type        TEXT        DEFAULT 'info' CHECK (type IN ('info','warning','success','danger')),
  active      BOOLEAN     DEFAULT TRUE,
  created_by  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ
);

-- 3. Tabela de tickets de suporte e denúncias
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT        DEFAULT 'support' CHECK (type IN ('support','report')),
  subject     TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  status      TEXT        DEFAULT 'open' CHECK (status IN ('open','replied','closed')),
  admin_reply TEXT,
  replied_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de log de auditoria admin
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action      TEXT        NOT NULL,
  target_user UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata    JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS: global_announcements (leitura pública, escrita apenas admin via service role)
ALTER TABLE public.global_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Announcements visíveis a todos" ON public.global_announcements;
CREATE POLICY "Announcements visíveis a todos"
  ON public.global_announcements FOR SELECT
  USING (true);

-- 6. RLS: support_tickets (utilizador vê os seus; admin não precisa de policy - usa service role)
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utilizador vê os seus tickets" ON public.support_tickets;
CREATE POLICY "Utilizador vê os seus tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Utilizador cria os seus tickets" ON public.support_tickets;
CREATE POLICY "Utilizador cria os seus tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 7. RLS: admin_audit_log (apenas service role)
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- 8. Dar permissão de admin ao email bragawork01@gmail.com
UPDATE public.profiles
SET is_admin = TRUE
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'bragawork01@gmail.com' LIMIT 1
);

-- 9. Índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin  ON public.profiles(is_admin)  WHERE is_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON public.profiles(is_banned) WHERE is_banned = TRUE;
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.global_announcements(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON public.admin_audit_log(admin_id);
