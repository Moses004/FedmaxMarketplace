-- ==========================================
-- 003: Roles and User Permissions
-- ==========================================

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL CHECK (name IN ('tenant', 'landlord', 'agent', 'admin')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

INSERT INTO public.roles (name, description) VALUES
  ('tenant', 'Standard renter looking for property listings and viewings'),
  ('landlord', 'Property owner managing listings and lease contracts'),
  ('agent', 'Verified real estate broker or property management firm'),
  ('admin', 'Platform administrator with system governance capabilities')
ON CONFLICT (name) DO NOTHING;
