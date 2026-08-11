-- ====================================================================
-- 024: Strict Row-Level Security (RLS) Policies for Phase 23 Migration
-- Tables: profiles, properties, bookings
-- Enforces strict role-based access control (RBAC) and resource ownership
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. PROFILES TABLE RLS
-- --------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- SELECT: Profiles are viewable publicly for landlord/agent verification & property attribution
CREATE POLICY "profiles_select_policy" 
ON public.profiles FOR SELECT 
USING (true);

-- INSERT: Authenticated users can only create their own profile entry matching their Auth ID
CREATE POLICY "profiles_insert_policy" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- UPDATE: Users can only update their own profile, or admins can update any profile
CREATE POLICY "profiles_update_policy" 
ON public.profiles FOR UPDATE 
USING (
  auth.uid() = id 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- DELETE: Users can delete own profile or Admins can manage
CREATE POLICY "profiles_delete_policy" 
ON public.profiles FOR DELETE 
USING (
  auth.uid() = id 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- --------------------------------------------------------------------
-- 2. PROPERTIES TABLE RLS
-- --------------------------------------------------------------------
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.properties;
DROP POLICY IF EXISTS "Properties are publicly viewable" ON public.properties;
DROP POLICY IF EXISTS "Landlords can create properties" ON public.properties;
DROP POLICY IF EXISTS "Landlords can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Landlords can delete own properties" ON public.properties;

-- SELECT: Public can view active listings; Landlords & Admins can view draft/inactive listings they own
CREATE POLICY "properties_select_policy" 
ON public.properties FOR SELECT 
USING (
  status = 'active'
  OR landlord_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- INSERT: Authenticated Landlords, Agents, or Admins can insert listings assigned to themselves
CREATE POLICY "properties_insert_policy" 
ON public.properties FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' 
  AND (landlord_id = auth.uid() OR landlord_id IS NULL)
);

-- UPDATE: Only the owning landlord/agent or an Admin can update property details
CREATE POLICY "properties_update_policy" 
ON public.properties FOR UPDATE 
USING (
  landlord_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  landlord_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- DELETE: Only the owning landlord/agent or an Admin can delete a property
CREATE POLICY "properties_delete_policy" 
ON public.properties FOR DELETE 
USING (
  landlord_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- --------------------------------------------------------------------
-- 3. BOOKINGS TABLE RLS
-- --------------------------------------------------------------------
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants and Landlords can view their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Tenants can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Parties can update booking status" ON public.bookings;
DROP POLICY IF EXISTS "View bookings" ON public.bookings;
DROP POLICY IF EXISTS "Create bookings" ON public.bookings;

-- SELECT: Tenants view their own bookings; Landlords view bookings for their listed properties; Admins view all
CREATE POLICY "bookings_select_policy" 
ON public.bookings FOR SELECT 
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = bookings.listing_id 
    AND properties.landlord_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- INSERT: Authenticated Tenants can create bookings for themselves
CREATE POLICY "bookings_insert_policy" 
ON public.bookings FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' 
  AND (user_id = auth.uid() OR user_id IS NULL)
);

-- UPDATE: Tenants can update (cancel) own bookings; Landlords can update (approve/reject) bookings for their properties
CREATE POLICY "bookings_update_policy" 
ON public.bookings FOR UPDATE 
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = bookings.listing_id 
    AND properties.landlord_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = bookings.listing_id 
    AND properties.landlord_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- DELETE: Tenant who created the booking or property Landlord or Admin
CREATE POLICY "bookings_delete_policy" 
ON public.bookings FOR DELETE 
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = bookings.listing_id 
    AND properties.landlord_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
