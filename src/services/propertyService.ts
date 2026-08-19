import { supabase } from './supabaseClient';
import { Listing, PropertyType } from '../types';
import { deriveRegionFromLocation } from '../utils/location';

export function mapRowToListing(row: any): Listing {
  const country = row.country || '';
  const state = row.state || '';
  const city = row.city || '';
  const region = row.region || deriveRegionFromLocation({ country, state, city });

  return {
    id: String(row.id),
    title: row.title || 'Untitled Property',
    description: row.description || '',
    price: Number(row.price || row.local_price || 0),
    pricePeriod: row.price_period || row.pricePeriod || 'annual',
    currency: row.currency || 'NGN',
    localPrice: row.local_price != null ? Number(row.local_price) : (row.localPrice != null ? Number(row.localPrice) : Number(row.price || 0)),
    annualDiscountPercentage: Number(row.annual_discount_percentage || row.annualDiscountPercentage || 0),
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
    size: Number(row.size || 25),
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    images: Array.isArray(row.images) && row.images.length > 0 
      ? row.images 
      : ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'],
    videoUrl: row.video_url || row.videoUrl || undefined,
    landlordId: String(row.landlord_id || row.landlordId || ''),
    landlordEmail: row.landlord_email || row.landlordEmail || undefined,
    landlordName: row.landlord_name || row.landlordName || undefined,
    contactRole: row.contact_role || row.contactRole || 'landlord',
    contactPhone: row.contact_phone || row.contactPhone || undefined,
    contactEmail: row.contact_email || row.contactEmail || undefined,
    contactWhatsApp: row.contact_whatsapp || row.contactWhatsApp || undefined,
    agentCompany: row.agent_company || row.agentCompany || undefined,
    agentLicense: row.agent_license || row.agentLicense || undefined,
    availableFrom: row.available_from || row.availableFrom || new Date().toISOString().split('T')[0],
    status: row.status || 'available',
    energyRating: row.energy_rating || row.energyRating || 'A+',
    solarPowered: row.solar_powered != null ? !!row.solar_powered : (row.solarPowered != null ? !!row.solarPowered : true),
    views: Number(row.views || 0)
  };
}

export function mapListingToDbPayload(listing: Partial<Listing> & { landlordId?: string }) {
  const country = listing.country || '';
  const state = listing.state || '';
  const city = listing.city || '';
  const region = listing.region || deriveRegionFromLocation({ country, state, city });

  return {
    title: listing.title,
    description: listing.description || '',
    price: listing.price != null ? Number(listing.price) : 0,
    price_period: listing.pricePeriod || 'annual',
    currency: listing.currency || 'NGN',
    local_price: listing.localPrice != null ? Number(listing.localPrice) : (listing.price != null ? Number(listing.price) : 0),
    annual_discount_percentage: listing.annualDiscountPercentage != null ? Number(listing.annualDiscountPercentage) : 0,
    property_type: listing.type || 'single-room',
    location: listing.location || [city, state, country].filter(Boolean).join(', '),
    country,
    region,
    state,
    city,
    lat: listing.lat != null ? Number(listing.lat) : 6.5244,
    lng: listing.lng != null ? Number(listing.lng) : 3.3792,
    bedrooms: listing.bedrooms != null ? Number(listing.bedrooms) : 1,
    bathrooms: listing.bathrooms != null ? Number(listing.bathrooms) : 1,
    size: listing.size != null ? Number(listing.size) : 25,
    amenities: Array.isArray(listing.amenities) ? listing.amenities : [],
    images: Array.isArray(listing.images) ? listing.images : [],
    video_url: listing.videoUrl || null,
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
    status: listing.status || 'available',
    energy_rating: listing.energyRating || 'A+',
    solar_powered: listing.solarPowered !== undefined ? listing.solarPowered : true
  };
}

export interface PropertyLocationFilter {
  country?: string;
  region?: string;
  state?: string;
  city?: string;
}

/**
 * Fetch properties directly from Supabase Database.
 * Supports location-based scoping (country, region, state, city) and landlord ID filter.
 */
export async function getProperties(
  locationFilter?: PropertyLocationFilter,
  landlordId?: string
): Promise<Listing[]> {
  try {
    let query = supabase.from('properties').select('*');

    if (landlordId) {
      query = query.eq('landlord_id', landlordId);
    } else if (locationFilter) {
      if (locationFilter.country && locationFilter.country.trim()) {
        query = query.ilike('country', `%${locationFilter.country.trim()}%`);
      }
      if (locationFilter.region && locationFilter.region.trim()) {
        query = query.ilike('region', `%${locationFilter.region.trim()}%`);
      }
      if (locationFilter.state && locationFilter.state.trim() && locationFilter.state !== 'all') {
        query = query.ilike('state', `%${locationFilter.state.trim()}%`);
      }
      if (locationFilter.city && locationFilter.city.trim() && locationFilter.city !== 'all') {
        query = query.ilike('city', `%${locationFilter.city.trim()}%`);
      }
    }

    // Sort newest first
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Supabase getProperties query error:', error);
      throw new Error(error.message || 'Failed to fetch properties from Supabase');
    }

    if (!data) {
      return [];
    }

    return data.map(mapRowToListing);
  } catch (err: any) {
    console.error('getProperties service error:', err);
    throw err;
  }
}

/**
 * Fetch single property by ID from Supabase.
 */
export async function getPropertyById(id: string): Promise<Listing | null> {
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
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    throw new Error('Authentication required: You must be signed in to list a property on Rentora.');
  }

  const landlordId = authData.user.id;
  const landlordEmail = listingData.landlordEmail || authData.user.email || '';
  const landlordName = listingData.landlordName || authData.user.user_metadata?.name || 'Property Owner';

  const payload = mapListingToDbPayload({
    ...listingData,
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

  return mapRowToListing(data);
}

/**
 * Update an existing property in Supabase.
 */
export async function updateProperty(
  id: string,
  updates: Partial<Listing>
): Promise<Listing> {
  const payload = mapListingToDbPayload(updates);

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

  return mapRowToListing(data);
}

/**
 * Delete a property from Supabase.
 */
export async function deleteProperty(id: string): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Supabase deleteProperty error (${id}):`, error);
    throw new Error(error.message || 'Failed to delete property from Supabase.');
  }
}

/**
 * Increment view count for a property in Supabase.
 */
export async function incrementPropertyViews(id: string): Promise<number> {
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
