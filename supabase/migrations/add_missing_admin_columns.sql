-- ============================================
-- Migração: Adicionar colunas em falta na tabela profiles
-- Necessárias para o sistema RBAC funcionar correctamente
-- ============================================

-- Super Admin flag (pode fazer tudo sem permissões granulares)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Email do utilizador (cache local para evitar consultar auth.users)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Permissões granulares que podem estar em falta
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspend_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_trocas INTEGER DEFAULT 0;

-- Permissões de admin granulares
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS perm_ban BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS perm_suspend BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS perm_delete_user BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS perm_grant_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS perm_grant_premium BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS perm_impersonate BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS perm_tickets BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS perm_announcements BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS perm_logs BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS perm_view_reports BOOLEAN DEFAULT false;

-- ============================================
-- Ativar is_super_admin para o Administrador Principal
-- (substitua o email se necessário)
-- ============================================
UPDATE profiles
SET is_super_admin = true,
    is_admin = true,
    perm_ban = true,
    perm_suspend = true,
    perm_delete_user = true,
    perm_grant_admin = true,
    perm_grant_premium = true,
    perm_impersonate = true,
    perm_tickets = true,
    perm_announcements = true,
    perm_logs = true,
    perm_view_reports = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'bragawork01@gmail.com'
);

-- Preencher o campo email em profiles a partir de auth.users (para todos os utilizadores)
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL;

-- ============================================
-- Resultado esperado: 
-- Todas as colunas necessárias para o RBAC existem
-- O admin principal tem todas as permissões ativas
-- ============================================
