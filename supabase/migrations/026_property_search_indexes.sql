-- ====================================================================
-- 026: Advanced Search Performance & Composite Indexes
-- Target Table: public.properties
-- Optimization Focus: Trigram text search, multi-column composite filtering,
-- price sorting, capacity queries, and map viewport coordinates.
-- ====================================================================

-- 1. TRIGRAM GIN INDEXES FOR FAST FUZZY TEXT SEARCH & ILIKE QUERIES
-- Enables instant ILIKE '%location%' and fuzzy text search without sequential scans
CREATE INDEX IF NOT EXISTS idx_properties_title_trgm 
ON public.properties USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_properties_location_trgm 
ON public.properties USING gin (location gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_properties_city_state_trgm 
ON public.properties USING gin ((COALESCE(city, '') || ' ' || COALESCE(state, '')) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_properties_description_trgm 
ON public.properties USING gin (description gin_trgm_ops);

-- 2. COMPOSITE INDEXES FOR COMBINED SEARCH FILTERS
-- Optimizes common filter combinations (e.g. Active properties within a price range)
CREATE INDEX IF NOT EXISTS idx_properties_status_price 
ON public.properties(status, price);

CREATE INDEX IF NOT EXISTS idx_properties_status_type_price 
ON public.properties(status, type, price);

CREATE INDEX IF NOT EXISTS idx_properties_status_beds_baths 
ON public.properties(status, bedrooms, bathrooms);

CREATE INDEX IF NOT EXISTS idx_properties_status_verified 
ON public.properties(status, is_verified) 
WHERE status = 'active';

-- 3. GEO-COORDINATES COMPOSITE INDEX FOR MAP VIEWPORT SEARCH
-- Accelerates bounding-box map queries: lat BETWEEN min_lat AND max_lat AND lng BETWEEN min_lng AND max_lng
CREATE INDEX IF NOT EXISTS idx_properties_geo_coords 
ON public.properties(lat, lng);

-- 4. PARTIAL INDEX FOR ACTIVE LISTINGS ORDERED BY CREATION DATE
-- Optimizes default listing feed queries
CREATE INDEX IF NOT EXISTS idx_properties_active_latest 
ON public.properties(created_at DESC) 
WHERE status = 'active';
