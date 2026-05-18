-- ============================================================
-- MIGRATION 014: ADD COLUMN updated_at TO conversations
-- ============================================================

ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
