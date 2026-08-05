-- ============================================================
-- Property Listing Management System - Supabase Schema
-- ============================================================
-- Run this SQL in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Table: allowed_users (Web Dashboard whitelist)
-- ============================================================
CREATE TABLE IF NOT EXISTS allowed_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert your first admin user (change email!)
-- INSERT INTO allowed_users (email, role) VALUES ('your-email@gmail.com', 'admin');

-- 2. Table: allowed_telegram_users (Telegram Bot whitelist)
-- ============================================================
CREATE TABLE IF NOT EXISTS allowed_telegram_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert allowed Telegram users (get user ID from @userinfobot on Telegram)
-- INSERT INTO allowed_telegram_users (telegram_user_id, name) VALUES ('123456789', 'Agent Name');

-- 3. Table: listings (Property listings)
-- ============================================================
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kawasan TEXT,
  alamat TEXT,
  lt INTEGER,              -- Luas Tanah (m²)
  lb INTEGER,              -- Luas Bangunan (m²)
  kt INTEGER,              -- Kamar Tidur
  km INTEGER,              -- Kamar Mandi
  hadap TEXT,              -- Hadap (Utara, Selatan, Timur, Barat, dll)
  lantai INTEGER,          -- Jumlah Lantai
  sertifikat TEXT,         -- Sertifikat (SHM, SHGB, AJB, dll)
  furnished TEXT,          -- Status furnished (Furnished, Semi-Furnished, Unfurnished)
  harga BIGINT,            -- Harga dalam Rupiah (contoh: 850000000)
  harga_text TEXT,          -- Harga display (contoh: "850 Juta (Nego)")
  keterangan TEXT,          -- Keterangan tambahan
  photo_link TEXT,
  agent_name TEXT NOT NULL, -- Nama agent (field manual)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'inactive')),
  source TEXT DEFAULT 'web' CHECK (source IN ('web', 'telegram')),
  telegram_user_id TEXT,    -- Telegram user ID (jika dari bot)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Indexes for search performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_listings_kawasan ON listings (kawasan);
CREATE INDEX IF NOT EXISTS idx_listings_harga ON listings (harga);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings (status);
CREATE INDEX IF NOT EXISTS idx_listings_agent_name ON listings (agent_name);
CREATE INDEX IF NOT EXISTS idx_listings_kt ON listings (kt);
CREATE INDEX IF NOT EXISTS idx_listings_km ON listings (km);

-- 5. Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Row Level Security (RLS)
-- ============================================================
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_telegram_users ENABLE ROW LEVEL SECURITY;

-- Policy: listings - SELECT for allowed users only
CREATE POLICY "Allowed users can view listings"
  ON listings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM allowed_users
      WHERE allowed_users.email = auth.jwt() ->> 'email'
    )
  );

-- Policy: listings - INSERT for allowed users only
CREATE POLICY "Allowed users can insert listings"
  ON listings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM allowed_users
      WHERE allowed_users.email = auth.jwt() ->> 'email'
    )
  );

-- Policy: listings - UPDATE for allowed users only
CREATE POLICY "Allowed users can update listings"
  ON listings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM allowed_users
      WHERE allowed_users.email = auth.jwt() ->> 'email'
    )
  );

-- Policy: listings - DELETE for allowed users only
CREATE POLICY "Allowed users can delete listings"
  ON listings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM allowed_users
      WHERE allowed_users.email = auth.jwt() ->> 'email'
    )
  );

-- Policy: allowed_users - any authenticated user can view (avoid infinite recursion)
CREATE POLICY "Users can view allowed users"
  ON allowed_users FOR SELECT
  USING ( auth.role() = 'authenticated' );

-- Policy: allowed_telegram_users - only allowed web users can view
CREATE POLICY "Allowed users can view telegram whitelist"
  ON allowed_telegram_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM allowed_users
      WHERE allowed_users.email = auth.jwt() ->> 'email'
    )
  );

-- ============================================================
-- IMPORTANT: For Telegram Bot API routes (server-side, no auth context),
-- we use the Supabase service_role key which bypasses RLS.
-- This is handled in the application code, NOT in SQL policies.
-- ============================================================

-- 7. Grant service_role full access (for Telegram bot operations)
-- The service_role key already bypasses RLS by default in Supabase.
-- No additional grants needed.

-- ============================================================
-- 8. Auto-delete Sold Listings via pg_cron (Optional Setup)
-- ============================================================
-- To automatically delete sold listings older than 14 days directly in the DB:
-- Enable pg_cron extension (requires superuser access in Supabase Dashboard -> Database -> Extensions)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the job to run every day at midnight
-- SELECT cron.schedule(
--   'cleanup-sold-listings',
--   '0 0 * * *',
--   $$
--     DELETE FROM listings
--     WHERE status = 'sold'
--     AND updated_at < (NOW() - INTERVAL '14 days');
--   $$
-- );

-- ============================================================
-- 9. Add photo_link column
-- ============================================================
-- Run this manually to add the new optional photo link column
-- ALTER TABLE listings ADD COLUMN photo_link TEXT;
