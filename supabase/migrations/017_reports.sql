-- ==========================================
-- 017: Reports & Maintenance Requests
-- ==========================================

CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_code TEXT NOT NULL UNIQUE,
  listing_title TEXT NOT NULL,
  tenant_uid UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tenant_name TEXT NOT NULL,
  tenant_email TEXT NOT NULL,
  issue_title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'Pending Review',
  landlord_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
