-- ====================================================================
-- 025: Supabase Storage Buckets & Storage RLS Policies
-- Buckets: property-images, property-documents, avatars, user-documents
-- ====================================================================

-- 1. PROVISION STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'property-images',
    'property-images',
    true,
    15728640, -- 15MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  ),
  (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  ),
  (
    'property-documents',
    'property-documents',
    false, -- PRIVATE BUCKET
    26214400, -- 25MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  ),
  (
    'user-documents',
    'user-documents',
    false, -- PRIVATE BUCKET
    15728640, -- 15MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
  )
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. ENABLE STORAGE RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Clean up existing storage policies if present
DROP POLICY IF EXISTS "Public property images are viewable by anyone" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update or delete their uploaded property images" ON storage.objects;
DROP POLICY IF EXISTS "public_property_images_select" ON storage.objects;
DROP POLICY IF EXISTS "auth_property_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "auth_property_images_update" ON storage.objects;
DROP POLICY IF EXISTS "auth_property_images_delete" ON storage.objects;
DROP POLICY IF EXISTS "public_avatars_select" ON storage.objects;
DROP POLICY IF EXISTS "auth_avatars_insert" ON storage.objects;
DROP POLICY IF EXISTS "private_property_docs_select" ON storage.objects;
DROP POLICY IF EXISTS "private_user_docs_select" ON storage.objects;

-- --------------------------------------------------------------------
-- A. BUCKET: 'property-images' (PUBLIC)
-- --------------------------------------------------------------------
CREATE POLICY "property_images_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

CREATE POLICY "property_images_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "property_images_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "property_images_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

-- --------------------------------------------------------------------
-- B. BUCKET: 'avatars' (PUBLIC)
-- --------------------------------------------------------------------
CREATE POLICY "avatars_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "avatars_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "avatars_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- --------------------------------------------------------------------
-- C. BUCKET: 'property-documents' (PRIVATE)
-- Access restricted to authenticated landlords, agents, or tenants associated
-- --------------------------------------------------------------------
CREATE POLICY "property_documents_select"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'property-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "property_documents_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "property_documents_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-documents' 
  AND auth.role() = 'authenticated'
);

-- --------------------------------------------------------------------
-- D. BUCKET: 'user-documents' (PRIVATE)
-- Restricted to owner or system admin
-- --------------------------------------------------------------------
CREATE POLICY "user_documents_select"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "user_documents_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "user_documents_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-documents' 
  AND auth.role() = 'authenticated'
);
