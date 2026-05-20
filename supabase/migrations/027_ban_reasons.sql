-- ============================================================
-- MIGRATION 027: BAN AND SUSPEND REASONS
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ban_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspend_reason TEXT;
