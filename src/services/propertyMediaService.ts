import { supabase } from './supabaseClient';
import { VideoMetadata } from '../types';

export const PROPERTY_MEDIA_BUCKET = 'property-media';
export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
export const SUPPORTED_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];

export interface VideoUploadResult {
  url: string;
  metadata: VideoMetadata;
  storagePath: string;
}

export interface ImageUploadResult {
  url: string;
  storagePath: string;
}

/**
 * Validates a video file for format and size before uploading.
 * Throws a descriptive user-friendly error if validation fails.
 */
export function validateVideoFile(file: File): void {
  if (!file) {
    throw new Error('No video file selected.');
  }

  // Validate MIME type & file extension
  const fileNameLower = file.name.toLowerCase();
  const hasValidExt = SUPPORTED_VIDEO_EXTENSIONS.some(ext => fileNameLower.endsWith(ext));
  const hasValidMime = SUPPORTED_VIDEO_MIME_TYPES.includes(file.type);

  if (!hasValidExt && !hasValidMime) {
    throw new Error('Unsupported video format. Please upload MP4, WebM or MOV.');
  }

  // Validate size <= 100 MB
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    throw new Error('Video must not exceed 100 MB.');
  }
}

/**
 * Safely extracts video duration in seconds from a File in browser environment.
 * Cleans up temporary object URLs immediately.
 */
export async function getVideoDuration(file: File): Promise<number | undefined> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return undefined;
  }

  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      const objectUrl = URL.createObjectURL(file);

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
        video.onloadedmetadata = null;
        video.onerror = null;
      };

      video.onloadedmetadata = () => {
        const duration = Math.round(video.duration);
        cleanup();
        resolve(duration > 0 ? duration : undefined);
      };

      video.onerror = () => {
        cleanup();
        resolve(undefined);
      };

      // Set timeout fallback in case loadedmetadata doesn't fire
      setTimeout(() => {
        cleanup();
        resolve(undefined);
      }, 4000);

      video.src = objectUrl;
    } catch {
      resolve(undefined);
    }
  });
}

/**
 * Uploads a property video file to Supabase Storage in the property-media bucket.
 * 
 * Storage path: `${user.id}/${propertyId}/video/${Date.now()}-${randomId}.${ext}`
 */
export async function uploadPropertyVideo(
  file: File,
  userId: string,
  propertyId: string
): Promise<VideoUploadResult> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  // 1. Validate file exists
  if (!file) {
    throw new Error('No video file selected.');
  }

  // 2. Validate format & 3. Validate size
  validateVideoFile(file);

  // Auth check: verify current authenticated user
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in to upload property media.');
  }

  const authenticatedUserId = user.id;

  // 4. Generate safe unique filename
  const originalExt = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : 'mp4';
  const safeExt = originalExt || 'mp4';
  const randomId = Math.random().toString(36).substring(2, 10);
  const uniqueFileName = `${Date.now()}-${randomId}.${safeExt}`;
  const storagePath = `${authenticatedUserId}/${propertyId}/video/${uniqueFileName}`;

  // Try to determine duration
  const duration = await getVideoDuration(file);

  // 5. Upload to property-media bucket
  const { data, error } = await supabase.storage
    .from(PROPERTY_MEDIA_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'video/mp4'
    });

  // 6. Check for upload errors
  if (error) {
    console.error('Supabase Storage video upload error:', error);
    if (error.message?.includes('violates row-level security') || error.message?.includes('Permission denied')) {
      throw new Error('Storage permission denied. Please ensure you are logged in with the correct property owner account.');
    }
    throw new Error(`Video upload failed: ${error.message}`);
  }

  // 7. Get public URL
  const { data: urlData } = supabase.storage
    .from(PROPERTY_MEDIA_BUCKET)
    .getPublicUrl(storagePath);

  if (!urlData?.publicUrl) {
    throw new Error('Unable to retrieve public URL for uploaded video.');
  }

  const metadata: VideoMetadata = {
    name: file.name,
    mime_type: file.type || 'video/mp4',
    size: file.size,
    ...(duration !== undefined ? { duration } : {})
  };

  // 8. Return { url, metadata, storagePath }
  return {
    url: urlData.publicUrl,
    metadata,
    storagePath
  };
}

/**
 * Uploads a property image file to Supabase Storage in the property-media bucket.
 * 
 * Storage path: `${user.id}/${propertyId}/images/${Date.now()}-${randomId}.${ext}`
 */
export async function uploadPropertyImage(
  file: File,
  userId: string,
  propertyId: string
): Promise<ImageUploadResult> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in to upload property media.');
  }

  const authenticatedUserId = user.id;
  const originalExt = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : 'jpg';
  const safeExt = originalExt || 'jpg';
  const randomId = Math.random().toString(36).substring(2, 10);
  const uniqueFileName = `${Date.now()}-${randomId}.${safeExt}`;
  const storagePath = `${authenticatedUserId}/${propertyId}/images/${uniqueFileName}`;

  const { error } = await supabase.storage
    .from(PROPERTY_MEDIA_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg'
    });

  if (error) {
    console.error('Supabase Storage image upload error:', error);
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(PROPERTY_MEDIA_BUCKET)
    .getPublicUrl(storagePath);

  return {
    url: urlData.publicUrl,
    storagePath
  };
}

/**
 * Safely extracts the Supabase Storage path from a public URL.
 */
export function extractStoragePathFromUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    // Standard Supabase public URL format:
    // https://[project].supabase.co/storage/v1/object/public/property-media/[userId]/[propertyId]/video/[file]
    const marker = `/storage/v1/object/public/${PROPERTY_MEDIA_BUCKET}/`;
    if (url.includes(marker)) {
      const parts = url.split(marker);
      return parts[1] || null;
    }

    // Alternative format:
    // /property-media/[userId]/[propertyId]/video/[file]
    const altMarker = `/${PROPERTY_MEDIA_BUCKET}/`;
    if (url.includes(altMarker)) {
      const parts = url.split(altMarker);
      return parts[1] || null;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Safely deletes a video file from the property-media bucket if its path can be identified.
 */
export async function deletePropertyVideoFile(
  videoUrl?: string | null
): Promise<boolean> {
  if (!supabase || !videoUrl) return true;

  const storagePath = extractStoragePathFromUrl(videoUrl);
  if (!storagePath) {
    // If not identifiable as a Supabase Storage path (e.g. external link), treat as safe non-op
    return true;
  }

  try {
    const { error } = await supabase.storage
      .from(PROPERTY_MEDIA_BUCKET)
      .remove([storagePath]);

    if (error) {
      console.warn(`Failed to delete storage file ${storagePath}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`Exception deleting storage file ${storagePath}:`, err);
    return false;
  }
}
