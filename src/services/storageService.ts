import { isSupabaseConfigured, getSupabase } from '../lib/supabase';

export type StorageBucket = 'property-images' | 'avatars' | 'property-documents' | 'user-documents';

export interface UploadResult {
  path: string;
  publicUrl?: string;
  error?: string;
}

/**
 * Uploads a File object to a specified Supabase Storage bucket.
 * Returns public URL for public buckets, or storage path for private buckets.
 */
export async function uploadFileToStorage(
  bucket: StorageBucket,
  file: File,
  folderPath: string = ''
): Promise<UploadResult> {
  const client = getSupabase();
  if (!isSupabaseConfigured || !client) {
    return {
      path: '',
      error: 'Supabase storage client is not configured.'
    };
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    const { data, error } = await client.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error(`Supabase Storage upload error (${bucket}):`, error.message);
      return { path: '', error: error.message };
    }

    let publicUrl: string | undefined = undefined;

    if (bucket === 'property-images' || bucket === 'avatars') {
      const { data: urlData } = client.storage
        .from(bucket)
        .getPublicUrl(data.path);
      publicUrl = urlData.publicUrl;
    }

    return {
      path: data.path,
      publicUrl
    };
  } catch (err: any) {
    console.error(`Unexpected storage upload exception (${bucket}):`, err);
    return { path: '', error: err.message || 'Upload failed' };
  }
}

/**
 * Generates a temporary signed URL for viewing private documents (PDFs, identity certificates).
 */
export async function getSignedDocumentUrl(
  bucket: 'property-documents' | 'user-documents',
  path: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  const client = getSupabase();
  if (!isSupabaseConfigured || !client) {
    return path.startsWith('blob:') || path.startsWith('http') ? path : null;
  }

  try {
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error || !data) {
      console.warn('Failed to generate signed document URL:', error?.message);
      return null;
    }

    return data.signedUrl;
  } catch {
    return null;
  }
}

/**
 * Deletes a file from Supabase Storage.
 */
export async function deleteFileFromStorage(
  bucket: StorageBucket,
  path: string
): Promise<boolean> {
  const client = getSupabase();
  if (!isSupabaseConfigured || !client) return true;

  try {
    const { error } = await client.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.warn(`Failed to delete file ${path} from ${bucket}:`, error.message);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
