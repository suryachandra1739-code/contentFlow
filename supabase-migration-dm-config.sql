-- =====================================================
-- Migration: Add dm_config column to projects table
-- Run this in: Supabase Dashboard → SQL Editor
-- =====================================================

-- Add dm_config JSONB column to store per-project DM Bot settings
-- This allows the server-side webhook handler to read the config
-- without needing localStorage (which is client-side only)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS dm_config JSONB DEFAULT NULL;

-- Optional: add an index for faster lookups (only needed at large scale)
-- CREATE INDEX IF NOT EXISTS idx_projects_dm_config ON projects USING gin(dm_config);

-- That's it! The PATCH /api/projects/[id] route will write to this column.
-- The webhook at /api/instagram/webhook will read from it.
