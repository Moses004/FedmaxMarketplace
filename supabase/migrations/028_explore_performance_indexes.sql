-- ====================================================================
-- 028: Explore Performance Indexes for Scoped Location & Feed Queries
-- Target Table: public.properties
-- Optimization: Accelerated country/state/city hierarchical filtering and feed sorting
-- ====================================================================

-- 1. Country index for launch market scoping
CREATE INDEX IF NOT EXISTS idx_properties_country 
ON public.properties USING btree (country);

-- 2. State index for regional filtering
CREATE INDEX IF NOT EXISTS idx_properties_state 
ON public.properties USING btree (state);

-- 3. Composite hierarchical location index for exact location scoping
CREATE INDEX IF NOT EXISTS idx_properties_country_state_city 
ON public.properties USING btree (country, state, city);

-- 4. Active launch market feed sorting index (status + country + created_at DESC)
CREATE INDEX IF NOT EXISTS idx_properties_status_country_created 
ON public.properties USING btree (status, country, created_at DESC);

-- 5. Landlord property list sorting index
CREATE INDEX IF NOT EXISTS idx_properties_landlord_created 
ON public.properties USING btree (landlord_id, created_at DESC);
