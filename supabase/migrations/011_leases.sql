-- ==========================================
-- 011: Leases & Lease Documents
-- ==========================================

CREATE TABLE IF NOT EXISTS public.leases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.properties(id) ON DELETE RESTRICT,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  landlord_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  rent_amount NUMERIC(12, 2) NOT NULL,
  deposit_amount NUMERIC(12, 2) DEFAULT 0,
  payment_frequency TEXT DEFAULT 'annual',
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'terminated', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lease_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
