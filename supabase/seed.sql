-- ====================================================================
-- RENTORA SUPABASE INITIAL SEED DATA SET
-- Relational Seed file for production database provisioning
-- Maps legacy local JSON store entities to Supabase PostgreSQL schema
-- ====================================================================

-- 1. SEED PROFILES
INSERT INTO public.profiles (id, email, name, role, phone, avatar_url)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@rentora.ng', 'Rentora Platform Admin', 'admin', '+234 800 111 0000', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'),
  ('00000000-0000-0000-0000-000000000002', 'landlord@rentora.ng', 'Chief Babatunde Real Estate', 'landlord', '+234 803 222 1111', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'),
  ('00000000-0000-0000-0000-000000000003', 'tenant@rentora.ng', 'Alex Morgan', 'tenant', '+234 802 333 2222', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone;

-- 2. SEED PROPERTIES
INSERT INTO public.properties (
  id, landlord_id, title, description, price, location, city, state, country,
  bedrooms, bathrooms, area_sqft, type, status, is_verified, lat, lng,
  image, images, amenities
)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'Luxury 4-Bedroom Detached Duplex',
    'Exquisite modern duplex with automated smart home features, private swimming pool, solar power installation, and 24/7 security in an exclusive gated community.',
    12000000.00,
    'Chevron Alternative Route, Lekki Phase 1',
    'Lekki',
    'Lagos State',
    'Nigeria',
    4,
    5,
    3800,
    'duplex',
    'active',
    true,
    6.4474,
    3.4723,
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["24/7 Power Supply", "Swimming Pool", "Solar Inverter", "CCTV Security", "Smart Home Automation", "Fitted Kitchen"]'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Contemporary Waterfront Penthouse',
    'Breathtaking waterfront views, floor-to-ceiling panoramic glass windows, rooftop lounge deck, and elevator access in high-brow Victoria Island.',
    25000000.00,
    'Ahmadu Bello Way, Victoria Island',
    'Victoria Island',
    'Lagos State',
    'Nigeria',
    3,
    4,
    2900,
    'penthouse',
    'active',
    true,
    6.4281,
    3.4219,
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["Waterfront View", "Private Elevator", "Rooftop Terrace", "24/7 Security", "Gymnasium"]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  price = EXCLUDED.price,
  status = EXCLUDED.status,
  is_verified = EXCLUDED.is_verified;

-- 3. SEED BOOKINGS
INSERT INTO public.bookings (
  id, listing_id, listing_title, listing_image, listing_price,
  user_id, user_name, user_email, user_phone, preferred_date, preferred_time, status, total_amount
)
VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Luxury 4-Bedroom Detached Duplex',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    12000000.00,
    '00000000-0000-0000-0000-000000000003',
    'Alex Morgan',
    'tenant@rentora.ng',
    '+234 802 333 2222',
    NOW() + INTERVAL '3 days',
    '10:00 AM',
    'approved',
    12000000.00
  )
ON CONFLICT (id) DO NOTHING;
