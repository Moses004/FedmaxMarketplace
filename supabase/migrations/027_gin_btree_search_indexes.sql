-- ====================================================================
-- 027: GIN and B-Tree Performance Indexes for Marketplace Filtering
-- Target Table: public.properties
-- Optimization Focus: Sub-millisecond queries on price, city, status, and amenities
-- ====================================================================

-- 1. B-TREE INDEXES FOR FREQUENT SINGLE-COLUMN FILTERS & RANGE SCANS
-- Sub-millisecond exact-match and range queries for core search dimensions

CREATE INDEX IF NOT EXISTS idx_properties_btree_city 
ON public.properties USING btree (city);

CREATE INDEX IF NOT EXISTS idx_properties_btree_price 
ON public.properties USING btree (price);

CREATE INDEX IF NOT EXISTS idx_properties_btree_status 
ON public.properties USING btree (status);

CREATE INDEX IF NOT EXISTS idx_properties_btree_type 
ON public.properties USING btree (type);

CREATE INDEX IF NOT EXISTS idx_properties_btree_bedrooms 
ON public.properties USING btree (bedrooms);

CREATE INDEX IF NOT EXISTS idx_properties_btree_bathrooms 
ON public.properties USING btree (bathrooms);

-- 2. GIN INDEX ON AMENITIES JSONB ARRAY
-- Enables ultra-fast containment searches (e.g. amenities @> '["Solar Power", "Pool"]')
CREATE INDEX IF NOT EXISTS idx_properties_gin_amenities 
ON public.properties USING gin (amenities jsonb_path_ops);

-- 3. HIGH-PERFORMANCE MULTI-COLUMN B-TREE INDEXES FOR COMBINED FILTERS
-- Optimizes popular tenant filter queries: Active properties in a specific city within price bounds
CREATE INDEX IF NOT EXISTS idx_properties_btree_status_city_price 
ON public.properties USING btree (status, city, price);

CREATE INDEX IF NOT EXISTS idx_properties_btree_status_city_type_price 
ON public.properties USING btree (status, city, type, price);

CREATE INDEX IF NOT EXISTS idx_properties_btree_status_city_beds 
ON public.properties USING btree (status, city, bedrooms);
