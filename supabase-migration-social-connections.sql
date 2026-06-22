-- ═══════════════════════════════════════════════════════════════════════
-- ContentFlow: social_connections table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Create the social_connections table
CREATE TABLE IF NOT EXISTS social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  
  -- Meta-specific fields
  meta_user_id TEXT,                -- Facebook User ID who authorized
  page_id TEXT,                     -- Facebook Page ID  
  page_name TEXT,                   -- Facebook Page display name
  page_access_token TEXT NOT NULL,  -- Long-lived Page Access Token (never expires!)
  ig_business_account_id TEXT,      -- Instagram Business Account ID (null if facebook-only)
  ig_username TEXT,                 -- Instagram @username
  profile_picture_url TEXT,         -- Profile pic for display
  
  -- Token health
  token_valid BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Audit
  connected_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One connection per platform per client
  UNIQUE(client_id, platform)
);

-- 2. Index for fast lookups during publish
CREATE INDEX IF NOT EXISTS idx_social_connections_client ON social_connections(client_id);

-- 3. Enable RLS
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Team & Admin: full access
CREATE POLICY "team_admin_all" ON social_connections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'team'))
  );

-- Clients: read-only on their own connections
CREATE POLICY "clients_read_own" ON social_connections
  FOR SELECT USING (
    client_id IN (SELECT u.client_id FROM users u WHERE u.id = auth.uid())
  );

-- 5. Service role bypass (for API routes using service role key)
-- Note: Service role key already bypasses RLS by default in Supabase,
-- so no additional policy is needed for server-side API routes.
