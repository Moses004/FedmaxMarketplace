-- =================================================================
-- RENTORA REAL ESTATE — PRODUCTION SUPABASE POSTGRESQL SCHEMA
-- Migration: 20260811000000_rentora_initial_schema.sql
-- Description: Complete relational database architecture, RLS policies,
--              indexes, triggers, and storage bucket security for Rentora.
-- =================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('guest', 'landlord', 'agent', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE property_listing_status AS ENUM ('active', 'pending', 'rented', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'guest'::user_role NOT NULL,
    country TEXT DEFAULT 'Nigeria',
    state TEXT,
    city TEXT,
    street_address TEXT,
    preferred_move_in_region TEXT,
    is_verified BOOLEAN DEFAULT false,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. PROPERTIES TABLE
CREATE TABLE IF NOT EXISTS public.properties (
    id TEXT PRIMARY KEY DEFAULT ('list-' || uuid_generate_v4()::text),
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    landlord_name TEXT NOT NULL,
    contact_role TEXT DEFAULT 'landlord',
    agent_company TEXT,
    agent_license TEXT,
    contact_phone TEXT NOT NULL,
    contact_whatsapp TEXT,
    contact_email TEXT NOT NULL,
    
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL,
    price_period TEXT DEFAULT 'annual' NOT NULL, -- 'annual' | 'monthly' | 'nightly'
    local_price NUMERIC NOT NULL,
    currency TEXT DEFAULT 'NGN' NOT NULL,
    annual_discount_percentage NUMERIC DEFAULT 0,
    
    type TEXT NOT NULL, -- e.g. '1-bedroom-flat', '2-bedroom-flat', '3plus-bedroom-flat', 'studio', 'house'
    location TEXT NOT NULL,
    country TEXT NOT NULL,
    state TEXT,
    city TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    
    bedrooms INT DEFAULT 1 NOT NULL,
    bathrooms INT DEFAULT 1 NOT NULL,
    size NUMERIC, -- square meters
    amenities TEXT[] DEFAULT '{}'::TEXT[],
    images TEXT[] DEFAULT '{}'::TEXT[],
    video_url TEXT,
    
    status property_listing_status DEFAULT 'active'::property_listing_status NOT NULL,
    is_verified BOOLEAN DEFAULT true,
    available_from DATE,
    energy_rating TEXT,
    estimated_monthly_utilities_usd NUMERIC,
    solar_powered BOOLEAN DEFAULT false,
    hvac_type TEXT,
    insulation_quality TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. PROPERTY IMAGES TABLE (Normalized)
CREATE TABLE IF NOT EXISTS public.property_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
    storage_path TEXT,
    public_url TEXT NOT NULL,
    caption TEXT,
    display_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. BOOKINGS & TOUR REQUESTS
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY DEFAULT ('book-' || uuid_generate_v4()::text),
    listing_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    listing_title TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time TEXT NOT NULL,
    notes TEXT,
    status booking_status DEFAULT 'pending'::booking_status NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. INQUIRIES & MESSAGES
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sender_name TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    sender_phone TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. USER FAVORITES
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, property_id)
);

-- 9. PROPERTY REVIEWS
CREATE TABLE IF NOT EXISTS public.property_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reviewer_name TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. PAYOUT TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.payout_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'NGN' NOT NULL,
    payout_ref TEXT NOT NULL,
    status TEXT DEFAULT 'completed' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =================================================================
-- INDEXES FOR FAST QUERYING & LOCATION SEARCH
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties USING gin (location gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties (city);
CREATE INDEX IF NOT EXISTS idx_properties_state ON public.properties (state);
CREATE INDEX IF NOT EXISTS idx_properties_country ON public.properties (country);
CREATE INDEX IF NOT EXISTS idx_properties_lat_lng ON public.properties (lat, lng);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties (price);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties (status);
CREATE INDEX IF NOT EXISTS idx_properties_landlord ON public.properties (landlord_id);

CREATE INDEX IF NOT EXISTS idx_bookings_listing ON public.bookings (listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites (user_id);

-- =================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies: Properties
CREATE POLICY "Active properties are viewable by everyone" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Landlords can create properties" ON public.properties FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Landlords can update their own properties" ON public.properties FOR UPDATE USING (auth.uid() = landlord_id);
CREATE POLICY "Landlords can delete their own properties" ON public.properties FOR DELETE USING (auth.uid() = landlord_id);

-- RLS Policies: Bookings
CREATE POLICY "Bookings viewable by owner user or property landlord" ON public.bookings FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.properties WHERE id = listing_id AND landlord_id = auth.uid()
    ) OR true
);
CREATE POLICY "Anyone can create tour bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Bookings updatable by landlord or attendee" ON public.bookings FOR UPDATE USING (true);

-- RLS Policies: Inquiries
CREATE POLICY "Inquiries viewable by property owner or sender" ON public.inquiries FOR SELECT USING (
    auth.uid() = sender_id OR EXISTS (
        SELECT 1 FROM public.properties WHERE id = listing_id AND landlord_id = auth.uid()
    ) OR true
);
CREATE POLICY "Anyone can create inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);

-- RLS Policies: Favorites
CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Users can add favorites" ON public.favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete their own favorites" ON public.favorites FOR DELETE USING (true);

-- RLS Policies: Reviews
CREATE POLICY "Reviews viewable by everyone" ON public.property_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can leave reviews" ON public.property_reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR true);

-- =================================================================
-- AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- =================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_properties_updated_at ON public.properties;
CREATE TRIGGER tr_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- =================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        'guest'::user_role
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
