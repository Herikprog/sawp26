-- ============================================================
-- MIGRATION 025: ADMIN DETAILED PERMISSIONS
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS perm_ban             BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS perm_suspend         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS perm_delete_user     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS perm_grant_admin     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS perm_grant_premium   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS perm_impersonate     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS perm_tickets         BOOLEAN DEFAULT FALSE;

-- Garantir que bragawork01@gmail.com tem todas as permissões ativas
UPDATE public.profiles
SET 
  is_admin = TRUE,
  perm_ban = TRUE,
  perm_suspend = TRUE,
  perm_delete_user = TRUE,
  perm_grant_admin = TRUE,
  perm_grant_premium = TRUE,
  perm_impersonate = TRUE,
  perm_tickets = TRUE
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'bragawork01@gmail.com' LIMIT 1
);
