-- ═══════════════════════════════════════════════════════════════════════
-- ContentFlow: Add YouTube support to social_connections table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Drop the existing platform check constraint
ALTER TABLE social_connections DROP CONSTRAINT IF EXISTS social_connections_platform_check;

-- 2. Add the updated check constraint supporting facebook, instagram, and youtube
ALTER TABLE social_connections ADD CONSTRAINT social_connections_platform_check 
  CHECK (platform IN ('facebook', 'instagram', 'youtube'));

-- 3. Add refresh_token column if it does not already exist
ALTER TABLE social_connections ADD COLUMN IF NOT EXISTS refresh_token TEXT;

-- 4. Verify/Modify RLS: No changes needed since existing policies apply automatically to the platform 'youtube'.
