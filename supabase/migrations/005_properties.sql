-- ==========================================
-- 005: Properties Table
-- ==========================================

CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  landlord_name TEXT NOT NULL DEFAULT 'Property Owner',
  contact_role TEXT DEFAULT 'landlord',
  agent_company TEXT,
  agent_license TEXT,
  contact_phone TEXT DEFAULT '+234 800 000 0000',
  contact_whatsapp TEXT,
  contact_email TEXT DEFAULT 'contact@rentora.com',

  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  price_period TEXT DEFAULT 'annual',
  local_price NUMERIC(12, 2),
  currency TEXT DEFAULT 'NGN',
  annual_discount_percentage NUMERIC(5, 2) DEFAULT 0,

  type TEXT NOT NULL,
  location TEXT NOT NULL,
  country TEXT DEFAULT 'Nigeria',
  state TEXT,
  city TEXT,
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,

  bedrooms INT DEFAULT 1,
  bathrooms INT DEFAULT 1,
  size NUMERIC(8, 2),
  amenities JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  video_url TEXT,

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rented', 'inactive')),
  is_verified BOOLEAN DEFAULT true,
  available_from TIMESTAMPTZ DEFAULT NOW(),
  energy_rating TEXT,
  estimated_monthly_utilities_usd NUMERIC(8, 2),
  solar_powered BOOLEAN DEFAULT false,
  hvac_type TEXT,
  insulation_quality TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
