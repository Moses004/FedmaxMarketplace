import { supabase } from './supabaseClient';
import { Listing, PropertyType, PropertyRow, ListingStatus, CANONICAL_PROPERTY_STATUSES } from '../types';
import { deriveRegionFromLocation } from '../utils/location';
import { getProfile } from './profileService';

import { deletePropertyVideoFile, uploadPropertyVideo } from './propertyMediaService';

export type CanonicalPropertyStatus = ListingStatus;

/**
 * Validates a property status against canonical values ['active', 'pending', 'rented', 'inactive'].
 * If invalid or unrecognized, normalizes it to 'pending' before sending it to Supabase.
 */
export function validateAndNormalizePropertyStatus(status?: string | null): CanonicalPropertyStatus {
  if (!status) return 'active';
  const trimmed = status.trim().toLowerCase();
  if ((CANONICAL_PROPERTY_STATUSES as readonly string[]).includes(trimmed)) {
    return trimmed as CanonicalPropertyStatus;
  }
  // Invalid status normalized to 'pending' before sending to Supabase
  return 'pending';
}

/**
 * Maps database row status (including legacy compatibility) to canonical ListingStatus.
 */
export function mapDbStatusToListingStatus(status?: string | null): CanonicalPropertyStatus {
  if (!status) return 'active';
  const trimmed = status.trim().toLowerCase();
  if ((CANONICAL_PROPERTY_STATUSES as readonly string[]).includes(trimmed)) {
    return trimmed as CanonicalPropertyStatus;
  }
  if (trimmed === 'available' || trimmed === 'listed' || trimmed === 'published' || trimmed === 'live' || trimmed === 'approved' || trimmed === 'new') {
    return 'active';
  }
  if (trimmed === 'under_review' || trimmed === 'pending_review' || trimmed === 'draft') {
    return 'pending';
  }
  if (trimmed === 'unavailable' || trimmed === 'disabled' || trimmed === 'archived') {
    return 'inactive';
  }
  return 'pending';
}

export function mapRowToListing(row: Partial<PropertyRow> & Record<string, any>): Listing {
  const country = row.country || '';
  const state = row.state || '';
  const city = row.city || '';
  const region = row.region || deriveRegionFromLocation({ country, state, city });

  const rawImages = Array.isArray(row.images) && row.images.length > 0
    ? row.images
    : (row.image ? [row.image] : ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80']);

  return {
    id: String(row.id),
    title: row.title || 'Untitled Property',
    description: row.description || '',
    price: Number(row.price || row.local_price || 0),
    pricePeriod: (row.price_period as any) || 'annual',
    currency: row.currency || 'NGN',
    localPrice: row.local_price != null ? Number(row.local_price) : Number(row.price || 0),
    annualDiscountPercentage: Number(row.annual_discount_percentage || 0),
    type: (row.property_type || row.type || 'single-room') as PropertyType,
    location: row.location || [city, state, country].filter(Boolean).join(', ') || 'Nigeria',
    country,
    region,
    state,
    city,
    lat: Number(row.lat != null ? row.lat : 6.5244),
    lng: Number(row.lng != null ? row.lng : 3.3792),
    bedrooms: Number(row.bedrooms || 1),
    bathrooms: Number(row.bathrooms || 1),
    size: Number(row.size || row.area_sqft || 25),
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    images: rawImages,
    videoUrl: row.video_url || undefined,
    videoMetadata: row.video_metadata || undefined,
    landlordId: String(row.landlord_id || ''),
    landlordEmail: row.landlord_email || undefined,
    landlordName: row.landlord_name || undefined,
    contactRole: (row.contact_role as any) || 'landlord',
    contactPhone: row.contact_phone || undefined,
    contactEmail: row.contact_email || undefined,
    contactWhatsApp: row.contact_whatsapp || undefined,
    agentCompany: row.agent_company || undefined,
    agentLicense: row.agent_license || undefined,
    availableFrom: row.available_from || new Date().toISOString().split('T')[0],
    status: mapDbStatusToListingStatus(row.status),
    energyRating: (row.energy_rating as any) || 'A+',
    solarPowered: row.solar_powered != null ? !!row.solar_powered : true,
    views: Number(row.views || 0)
  };
}

export const mapPropertyRowToListing = mapRowToListing;

export function mapListingToDbPayload(listing: Partial<Listing> & { landlordId?: string }): Partial<PropertyRow> {
  const country = listing.country || '';
  const state = listing.state || '';
  const city = listing.city || '';
  const region = listing.region || deriveRegionFromLocation({ country, state, city });
  const propType = listing.type || 'single-room';
  const sizeNum = listing.size != null ? Number(listing.size) : 25;
  const imgs = Array.isArray(listing.images) ? listing.images : [];

  // Strictly validate status against ['active', 'pending', 'rented', 'inactive']
  // Default to 'active' for new listings, and normalize any invalid value to 'pending'
  const rawStatus = listing.status !== undefined ? listing.status : 'active';
  const canonicalStatus = validateAndNormalizePropertyStatus(rawStatus);

  return {
    title: listing.title || 'Untitled Property',
    description: listing.description || '',
    price: listing.price != null ? Number(listing.price) : 0,
    price_period: listing.pricePeriod || 'annual',
    currency: listing.currency || 'NGN',
    local_price: listing.localPrice != null ? Number(listing.localPrice) : (listing.price != null ? Number(listing.price) : 0),
    annual_discount_percentage: listing.annualDiscountPercentage != null ? Number(listing.annualDiscountPercentage) : 0,
    type: propType,
    property_type: propType,
    location: listing.location || [city, state, country].filter(Boolean).join(', '),
    country,
    region,
    state,
    city,
    lat: listing.lat != null ? Number(listing.lat) : 6.5244,
    lng: listing.lng != null ? Number(listing.lng) : 3.3792,
    bedrooms: listing.bedrooms != null ? Number(listing.bedrooms) : 1,
    bathrooms: listing.bathrooms != null ? Number(listing.bathrooms) : 1,
    size: sizeNum,
    area_sqft: sizeNum,
    amenities: listing.amenities || [],
    images: imgs,
    image: imgs.length > 0 ? imgs[0] : null,
    video_url: listing.videoUrl || null,
    video_metadata: listing.videoMetadata || {},
    virtual_tour_url: null,
    landlord_id: listing.landlordId || null,
    landlord_email: listing.landlordEmail || null,
    landlord_name: listing.landlordName || null,
    contact_role: listing.contactRole || 'landlord',
    contact_phone: listing.contactPhone || null,
    contact_email: listing.contactEmail || null,
    contact_whatsapp: listing.contactWhatsApp || null,
    agent_company: listing.agentCompany || null,
    agent_license: listing.agentLicense || null,
    available_from: listing.availableFrom || new Date().toISOString().split('T')[0],
    status: canonicalStatus,
    is_verified: true,
    energy_rating: listing.energyRating || 'A+',
    solar_powered: listing.solarPowered !== undefined ? listing.solarPowered : true
  };
}

export const mapListingToPropertyInsert = mapListingToDbPayload;

/**
 * Maps partial listing updates into a database payload, ensuring only provided
 * properties are updated and untouched fields are not overwritten with defaults.
 */
export function mapListingUpdatesToDbPayload(updates: Partial<Listing>): Partial<PropertyRow> {
  const payload: Partial<PropertyRow> = {};

  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.price !== undefined) payload.price = Number(updates.price);
  if (updates.pricePeriod !== undefined) payload.price_period = updates.pricePeriod;
  if (updates.currency !== undefined) payload.currency = updates.currency;
  if (updates.localPrice !== undefined) payload.local_price = Number(updates.localPrice);
  if (updates.annualDiscountPercentage !== undefined) payload.annual_discount_percentage = Number(updates.annualDiscountPercentage);
  if (updates.type !== undefined) {
    payload.type = updates.type;
    payload.property_type = updates.type;
  }
  if (updates.location !== undefined) payload.location = updates.location;
  if (updates.country !== undefined) payload.country = updates.country;
  if (updates.region !== undefined) payload.region = updates.region;
  if (updates.state !== undefined) payload.state = updates.state;
  if (updates.city !== undefined) payload.city = updates.city;
  if (updates.lat !== undefined) payload.lat = Number(updates.lat);
  if (updates.lng !== undefined) payload.lng = Number(updates.lng);
  if (updates.bedrooms !== undefined) payload.bedrooms = Number(updates.bedrooms);
  if (updates.bathrooms !== undefined) payload.bathrooms = Number(updates.bathrooms);
  if (updates.size !== undefined) {
    payload.size = Number(updates.size);
    payload.area_sqft = Number(updates.size);
  }
  if (updates.amenities !== undefined) payload.amenities = updates.amenities;
  if (updates.images !== undefined) {
    payload.images = updates.images;
    payload.image = updates.images && updates.images.length > 0 ? updates.images[0] : null;
  }
  if (updates.videoUrl !== undefined) {
    payload.video_url = updates.videoUrl ? updates.videoUrl.trim() : null;
  }
  if (updates.videoMetadata !== undefined) {
    payload.video_metadata = updates.videoMetadata || {};
  }
  if (updates.landlordEmail !== undefined) payload.landlord_email = updates.landlordEmail;
  if (updates.landlordName !== undefined) payload.landlord_name = updates.landlordName;
  if (updates.contactRole !== undefined) payload.contact_role = updates.contactRole;
  if (updates.contactPhone !== undefined) payload.contact_phone = updates.contactPhone;
  if (updates.contactEmail !== undefined) payload.contact_email = updates.contactEmail;
  if (updates.contactWhatsApp !== undefined) payload.contact_whatsapp = updates.contactWhatsApp;
  if (updates.agentCompany !== undefined) payload.agent_company = updates.agentCompany;
  if (updates.agentLicense !== undefined) payload.agent_license = updates.agentLicense;
  if (updates.availableFrom !== undefined) payload.available_from = updates.availableFrom;
  if (updates.status !== undefined) payload.status = validateAndNormalizePropertyStatus(updates.status);
  if (updates.energyRating !== undefined) payload.energy_rating = updates.energyRating;
  if (updates.solarPowered !== undefined) payload.solar_powered = updates.solarPowered;

  return payload;
}

export interface PropertyLocationFilter {
  country?: string;
  region?: string;
  state?: string;
  city?: string;
}

/**
 * Structured error class for property fetching and database operations.
 * Preserves details, RLS hints, and network failure flags while presenting safe user messages.
 */
export class PropertyServiceError extends Error {
  public code?: string;
  public details?: string;
  public hint?: string;
  public userMessage: string;
  public isNetworkError: boolean;
  public isRlsError: boolean;
  public originalError: any;

  constructor(message: string, options?: {
    code?: string;
    details?: string;
    hint?: string;
    userMessage?: string;
    isNetworkError?: boolean;
    isRlsError?: boolean;
    originalError?: any;
  }) {
    super(message);
    this.name = 'PropertyServiceError';
    this.code = options?.code;
    this.details = options?.details;
    this.hint = options?.hint;
    this.isNetworkError = options?.isNetworkError || false;
    this.isRlsError = options?.isRlsError || false;
    this.originalError = options?.originalError;
    this.userMessage = options?.userMessage || "We couldn't load properties. Please try again.";
  }
}

/**
 * Explicit columns retrieved for explore feed and property card catalogue.
 * Prevents retrieving heavy payloads (uncompressed video metadata, large documents) unnecessarily.
 */
export const EXPLORE_PROPERTY_COLUMNS = [
  'id',
  'landlord_id',
  'landlord_name',
  'contact_role',
  'agent_company',
  'agent_license',
  'contact_phone',
  'contact_whatsapp',
  'contact_email',
  'title',
  'description',
  'price',
  'price_period',
  'local_price',
  'currency',
  'annual_discount_percentage',
  'type',
  'location',
  'country',
  'state',
  'city',
  'lat',
  'lng',
  'bedrooms',
  'bathrooms',
  'size',
  'area_sqft',
  'amenities',
  'images',
  'image',
  'video_url',
  'status',
  'is_verified',
  'available_from',
  'energy_rating',
  'solar_powered',
  'views',
  'created_at'
].join(', ');

export interface PropertyQueryOptions {
  locationFilter?: PropertyLocationFilter;
  landlordId?: string;
  status?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: string | number;
  limit?: number;
  offset?: number;
  page?: number;
  searchQuery?: string;
  signal?: AbortSignal;
  skipCache?: boolean;
  exactMatch?: boolean;
}

export interface PropertyQueryResult {
  properties: Listing[];
  totalCount: number;
  hasMore: boolean;
  page: number;
  pageSize: number;
  fromCache?: boolean;
}

interface CacheEntry {
  result: PropertyQueryResult;
  timestamp: number;
}

const PROPERTY_CACHE_TTL_MS = 45 * 1000; // 45 seconds TTL
const propertyQueryCache = new Map<string, CacheEntry>();

/**
 * Invalidates the client-side property query cache.
 * Called automatically on property creates, updates, deletes, and realtime events.
 */
export function clearPropertyCache(): void {
  propertyQueryCache.clear();
}

/**
 * Builds a deterministic cache key for property query options.
 */
function buildCacheKey(options: PropertyQueryOptions): string {
  const loc = options.locationFilter || {};
  return [
    'rentora:properties',
    loc.country || 'all',
    loc.state || 'all',
    loc.city || 'all',
    loc.region || 'all',
    options.landlordId || 'none',
    options.status || 'default',
    options.propertyType || 'all',
    options.minPrice ?? 'none',
    options.maxPrice ?? 'none',
    options.minBedrooms ?? 'all',
    options.page ?? 1,
    options.limit ?? 24
  ].join(':').toLowerCase();
}

/**
 * High-performance, paginated property fetcher with explicit column selection,
 * client-side caching, and structured error reporting.
 */
export async function getExploreProperties(options: PropertyQueryOptions = {}): Promise<PropertyQueryResult> {
  if (!supabase) {
    throw new PropertyServiceError('Supabase is not configured', {
      userMessage: 'Property service is currently unavailable. Please check your setup.'
    });
  }

  const page = Math.max(1, options.page || 1);
  const limit = Math.min(48, Math.max(1, options.limit || 24)); // Cap page size safely
  const offset = options.offset !== undefined ? options.offset : (page - 1) * limit;
  const cacheKey = buildCacheKey({ ...options, page, limit });

  // 1. Check client-side memory cache
  if (!options.skipCache) {
    const cached = propertyQueryCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < PROPERTY_CACHE_TTL_MS)) {
      return { ...cached.result, fromCache: true };
    }
  }

  const startTime = typeof performance !== 'undefined' ? performance.now() : 0;

  try {
    let query = supabase
      .from('properties')
      .select(EXPLORE_PROPERTY_COLUMNS, { count: 'exact' });

    // Landlord specific query vs public explore feed
    if (options.landlordId) {
      query = query.eq('landlord_id', options.landlordId);
    } else {
      // For explore feed, default to 'active' status if not specified
      if (options.status && options.status !== 'all') {
        query = query.eq('status', options.status);
      } else if (!options.status) {
        query = query.eq('status', 'active');
      }
    }

    // Explicit location filters with exact matching (no greedy wildcard wrap)
    const loc = options.locationFilter;
    if (loc) {
      if (loc.country && loc.country.trim() && loc.country !== 'all') {
        query = query.ilike('country', loc.country.trim());
      }
      if (loc.state && loc.state.trim() && loc.state !== 'all') {
        query = query.ilike('state', loc.state.trim());
      }
      if (loc.city && loc.city.trim() && loc.city !== 'all') {
        query = query.ilike('city', loc.city.trim());
      }
      if (loc.region && loc.region.trim() && loc.region !== 'all') {
        query = query.ilike('region', loc.region.trim());
      }
    }

    // Housing Type filter if specified
    if (options.propertyType && options.propertyType !== 'all') {
      query = query.eq('type', options.propertyType);
    }

    // Price filters
    if (options.minPrice !== undefined && options.minPrice > 0) {
      query = query.gte('price', options.minPrice);
    }
    if (options.maxPrice !== undefined && options.maxPrice > 0) {
      query = query.lte('price', options.maxPrice);
    }

    // Bedrooms filter
    if (options.minBedrooms !== undefined && options.minBedrooms !== 'all') {
      const bedNum = Number(options.minBedrooms);
      if (!isNaN(bedNum)) {
        query = query.gte('bedrooms', bedNum);
      }
    }

    // Ordering: Newest first using the indexed created_at column
    query = query.order('created_at', { ascending: false });

    // Pagination bounds: MAXIMUM 24 on initial load
    query = query.range(offset, offset + limit - 1);

    if (options.signal && 'abortSignal' in (query as any)) {
      try {
        (query as any).abortSignal(options.signal);
      } catch {}
    }

    const { data, count, error } = await query;
    const duration = startTime ? Math.round(performance.now() - startTime) : 0;

    // Development telemetry
    if (typeof window !== 'undefined' && (import.meta as any).env?.DEV) {
      console.log(
        `%c[Rentora Property Query]%c ${duration}ms | Count: ${data?.length ?? 0} (Total: ${count ?? 'unknown'})`,
        'color: #10b981; font-weight: bold;',
        'color: inherit;',
        { options, duration, resultCount: data?.length }
      );
    }

    if (error) {
      const isRls = error.code === '42501';
      const isNetwork = !navigator.onLine || error.message?.toLowerCase().includes('failed to fetch');
      const userMessage = isRls
        ? 'Access restricted. Please sign in or check your account permissions.'
        : isNetwork
        ? 'Unable to connect to the Rentora network. Please check your internet connection.'
        : "We couldn't load properties. Please try again.";

      throw new PropertyServiceError(error.message || 'Failed to fetch properties from Supabase', {
        code: error.code,
        details: error.details,
        hint: error.hint,
        userMessage,
        isRlsError: isRls,
        isNetworkError: isNetwork,
        originalError: error
      });
    }

    const rawRows = data || [];
    const listings = rawRows.map(mapRowToListing);
    const totalCount = count !== null ? count : listings.length;
    const hasMore = offset + listings.length < totalCount;

    const result: PropertyQueryResult = {
      properties: listings,
      totalCount,
      hasMore,
      page,
      pageSize: limit,
      fromCache: false
    };

    // Store in client-side memory cache
    propertyQueryCache.set(cacheKey, { result, timestamp: Date.now() });

    return result;
  } catch (err: any) {
    if (err instanceof PropertyServiceError) {
      throw err;
    }
    const isNetwork = typeof navigator !== 'undefined' && !navigator.onLine;
    throw new PropertyServiceError(err.message || 'An unexpected error occurred while loading properties', {
      userMessage: isNetwork ? 'Network connection offline. Please check your connection.' : "We couldn't load properties. Please try again.",
      isNetworkError: isNetwork,
      originalError: err
    });
  }
}

/**
 * Fetch properties directly from Supabase Database.
 * Backward compatible with existing callers, using optimized field selection and pagination under the hood.
 */
export async function getProperties(
  locationFilterOrOptions?: PropertyLocationFilter | PropertyQueryOptions,
  landlordId?: string
): Promise<Listing[]> {
  if (!supabase) {
    return [];
  }

  // Detect whether caller passed PropertyQueryOptions or legacy PropertyLocationFilter
  let options: PropertyQueryOptions = {};
  if (locationFilterOrOptions) {
    if ('country' in locationFilterOrOptions || 'state' in locationFilterOrOptions || 'city' in locationFilterOrOptions || 'region' in locationFilterOrOptions) {
      options = {
        locationFilter: locationFilterOrOptions as PropertyLocationFilter,
        landlordId,
        limit: landlordId ? 100 : 24
      };
    } else {
      options = {
        ...(locationFilterOrOptions as PropertyQueryOptions),
        landlordId: landlordId || (locationFilterOrOptions as PropertyQueryOptions).landlordId
      };
    }
  } else if (landlordId) {
    options = { landlordId, limit: 100 };
  } else {
    options = { limit: 24 };
  }

  try {
    const result = await getExploreProperties(options);
    return result.properties;
  } catch (err: any) {
    console.error('getProperties service error:', err);
    throw err;
  }
}

/**
 * Fetch single property by ID from Supabase.
 */
export async function getPropertyById(id: string): Promise<Listing | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`Supabase getPropertyById error (${id}):`, error);
      throw new Error(error.message || 'Failed to fetch property details');
    }

    if (!data) return null;
    return mapRowToListing(data);
  } catch (err: any) {
    console.error('getPropertyById service error:', err);
    throw err;
  }
}

/**
 * Create a new property listing directly in Supabase.
 * Enforces authenticated landlord session and region derivation.
 */
export async function createProperty(
  listingData: Omit<Listing, 'id' | 'landlordId'> & { landlordId?: string }
): Promise<Listing> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    throw new Error('Authentication required: You must be signed in to list a property on Rentora.');
  }

  const landlordId = authData.user.id;
  const profile = await getProfile(landlordId);
  const landlordEmail = listingData.landlordEmail || profile?.email || authData.user.email || '';
  const landlordName = listingData.landlordName || profile?.name || authData.user.user_metadata?.name || 'Property Owner';

  const country = listingData.country || profile?.country || 'Nigeria';
  const state = listingData.state || profile?.state || '';
  const city = listingData.city || profile?.city || '';
  const region = listingData.region || profile?.region || deriveRegionFromLocation({ country, state, city });

  const payload = mapListingToDbPayload({
    ...listingData,
    country,
    state,
    city,
    region,
    landlordId,
    landlordEmail,
    landlordName
  });

  const { data, error } = await supabase
    .from('properties')
    .insert([payload])
    .select('*')
    .single();

  if (error) {
    console.error('Supabase createProperty error:', error);
    throw new Error(error.message || 'Database error: Failed to save property listing to Supabase.');
  }

  if (!data) {
    throw new Error('Database error: No data returned after creating property.');
  }

  clearPropertyCache();
  return mapRowToListing(data);
}

/**
 * Update an existing property in Supabase.
 * Uses selective update mapping to ensure untouched fields (images, amenities,
 * description, price, location) are never accidentally overwritten.
 */
export async function updateProperty(
  id: string,
  updates: Partial<Listing>
): Promise<Listing> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const payload = mapListingUpdatesToDbPayload(updates);

  const { data, error } = await supabase
    .from('properties')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error(`Supabase updateProperty error (${id}):`, error);
    throw new Error(error.message || 'Failed to update property in Supabase.');
  }

  clearPropertyCache();
  return mapRowToListing(data);
}

/**
 * Removes a property's video from Supabase Storage and resets database fields.
 */
export async function removePropertyVideo(
  propertyId: string,
  currentVideoUrl?: string | null
): Promise<Listing> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  // 1. Delete storage object if path can be safely identified
  if (currentVideoUrl) {
    await deletePropertyVideoFile(currentVideoUrl);
  }

  // 2. Update database record: video_url = null, video_metadata = {}
  const { data, error } = await supabase
    .from('properties')
    .update({
      video_url: null,
      video_metadata: {}
    })
    .eq('id', propertyId)
    .select('*')
    .single();

  if (error) {
    console.error(`Failed to remove property video in database (${propertyId}):`, error);
    throw new Error(error.message || 'Unable to update property video status.');
  }

  return mapRowToListing(data);
}

/**
 * Replaces a property's video: uploads new video first, updates DB,
 * and only after DB succeeds deletes old storage file.
 */
export async function replacePropertyVideo(
  propertyId: string,
  newVideoFile: File,
  oldVideoUrl?: string | null
): Promise<Listing> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in to upload property media.');
  }

  // 1. Upload new video successfully
  const uploaded = await uploadPropertyVideo(newVideoFile, user.id, propertyId);

  // 2. Update database with new URL and metadata
  const { data, error } = await supabase
    .from('properties')
    .update({
      video_url: uploaded.url,
      video_metadata: uploaded.metadata
    })
    .eq('id', propertyId)
    .select('*')
    .single();

  if (error) {
    console.error(`Failed to update property record with new video (${propertyId}):`, error);
    throw new Error(error.message || 'Unable to save new property video.');
  }

  // 3. Only after DB update succeeds, safely delete old storage file
  if (oldVideoUrl && oldVideoUrl !== uploaded.url) {
    deletePropertyVideoFile(oldVideoUrl).catch(err => {
      console.warn('Non-blocking: Failed to delete old video storage file:', err);
    });
  }

  return mapRowToListing(data);
}

/**
 * Delete a property from Supabase.
 */
export async function deleteProperty(id: string): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Supabase deleteProperty error (${id}):`, error);
    throw new Error(error.message || 'Failed to delete property from Supabase.');
  }

  clearPropertyCache();
}

/**
 * Increment view count for a property in Supabase.
 */
export async function incrementPropertyViews(id: string): Promise<number> {
  if (!supabase) {
    return 0;
  }

  try {
    const { data: prop, error: fetchErr } = await supabase
      .from('properties')
      .select('views')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) {
      console.warn('Could not fetch property views:', fetchErr);
      return 0;
    }

    const nextViews = ((prop?.views as number) || 0) + 1;
    const { error: updateErr } = await supabase
      .from('properties')
      .update({ views: nextViews })
      .eq('id', id);

    if (updateErr) {
      console.warn('Could not update property views in database:', updateErr);
    }
    return nextViews;
  } catch (err) {
    console.warn('incrementPropertyViews error:', err);
    return 0;
  }
}

/**
 * Get views count for a property.
 */
export async function getPropertyViews(id: string): Promise<number> {
  if (!supabase) {
    return 0;
  }

  try {
    const { data, error } = await supabase
      .from('properties')
      .select('views')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return 0;
    return (data.views as number) || 0;
  } catch (err) {
    console.warn('getPropertyViews error:', err);
    return 0;
  }
}
