import { isSupabaseConfigured, getSupabase, isPgrstSchemaCacheError } from '../lib/supabase';
import { Listing, Booking, User } from '../types';

/**
 * Maps a Supabase property record to the Rentora frontend Listing model
 */
function mapPropertyToListing(row: any): Listing {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    pricePeriod: row.price_period || 'annual',
    localPrice: Number(row.local_price || row.price),
    currency: row.currency || 'NGN',
    annualDiscountPercentage: Number(row.annual_discount_percentage || 0),
    type: row.type,
    location: row.location,
    country: row.country,
    state: row.state,
    city: row.city,
    lat: Number(row.lat),
    lng: Number(row.lng),
    bedrooms: Number(row.bedrooms),
    bathrooms: Number(row.bathrooms),
    size: row.size ? Number(row.size) : undefined,
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    images: Array.isArray(row.images) ? row.images : [],
    videoUrl: row.video_url,
    landlordId: row.landlord_id,
    landlordName: row.landlord_name,
    contactRole: row.contact_role,
    agentCompany: row.agent_company,
    contactPhone: row.contact_phone,
    contactWhatsApp: row.contact_whatsapp,
    contactEmail: row.contact_email,
    agentLicense: row.agent_license,
    availableFrom: row.available_from,
    energyRating: row.energy_rating,
    estimatedMonthlyUtilitiesUSD: row.estimated_monthly_utilities_usd ? Number(row.estimated_monthly_utilities_usd) : undefined,
    solarPowered: Boolean(row.solar_powered),
    hvacType: row.hvac_type,
    insulationQuality: row.insulation_quality
  };
}

/**
 * Maps a Rentora frontend Listing model to a Supabase property database record
 */
function mapListingToPropertyRecord(listing: Listing): any {
  return {
    id: listing.id,
    landlord_name: listing.landlordName || 'Property Owner',
    contact_role: listing.contactRole || 'landlord',
    agent_company: listing.agentCompany || null,
    agent_license: listing.agentLicense || null,
    contact_phone: listing.contactPhone || '+234 800 000 0000',
    contact_whatsapp: listing.contactWhatsApp || null,
    contact_email: listing.contactEmail || 'contact@rentora.com',
    
    title: listing.title,
    description: listing.description,
    price: listing.price,
    price_period: listing.pricePeriod || 'annual',
    local_price: listing.localPrice || listing.price,
    currency: listing.currency || 'NGN',
    annual_discount_percentage: listing.annualDiscountPercentage || 0,
    
    type: listing.type,
    location: listing.location,
    country: listing.country || 'Nigeria',
    state: listing.state || null,
    city: listing.city || null,
    lat: listing.lat,
    lng: listing.lng,
    
    bedrooms: listing.bedrooms || 1,
    bathrooms: listing.bathrooms || 1,
    size: listing.size || null,
    amenities: listing.amenities || [],
    images: listing.images || [],
    video_url: listing.videoUrl || null,
    
    status: 'active',
    is_verified: true,
    available_from: listing.availableFrom || null,
    energy_rating: listing.energyRating || null,
    estimated_monthly_utilities_usd: listing.estimatedMonthlyUtilitiesUSD || null,
    solar_powered: Boolean(listing.solarPowered),
    hvac_type: listing.hvacType || null,
    insulation_quality: listing.insulationQuality || null
  };
}

/**
 * Fetch all properties permanently stored in Supabase
 */
export async function getListingsFromSupabase(): Promise<Listing[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (isPgrstSchemaCacheError(error)) {
        console.info('[Supabase Schema Notice] Table "public.properties" not found in schema cache (PGRST205). Using local store fallback.');
      } else {
        console.warn('Supabase fetch error:', error.message);
      }
      return null;
    }
    if (!data) return [];
    return data.map(mapPropertyToListing);
  } catch (err) {
    console.warn('Failed to fetch listings from Supabase:', err);
    return null;
  }
}


/**
 * Upsert property listing to Supabase
 */
export async function saveListingToSupabase(listing: Listing): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const supabase = getSupabase();
    const record = mapListingToPropertyRecord(listing);
    const { error } = await supabase
      .from('properties')
      .upsert(record, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase saveListing error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to save listing to Supabase:', err);
    return false;
  }
}

/**
 * Delete listing from Supabase
 */
export async function deleteListingFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase deleteListing error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to delete listing from Supabase:', err);
    return false;
  }
}

/**
 * Sync initial array of listings into Supabase if empty
 */
export async function syncListingsToSupabase(listings: Listing[]): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const supabase = getSupabase();
    const { count, error } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });

    if (error) return;

    if (count === 0 && listings.length > 0) {
      const records = listings.map(mapListingToPropertyRecord);
      await supabase.from('properties').insert(records);
      console.log(`Successfully seeded ${records.length} listings into Supabase database.`);
    }
  } catch (err) {
    console.warn('Supabase seed error:', err);
  }
}

/**
 * Fetch bookings from Supabase
 */
export async function getBookingsFromSupabase(): Promise<Booking[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map((b: any): Booking => ({
      id: b.id,
      listingId: b.listing_id,
      listingTitle: b.listing_title,
      listingImage: b.listing_image || '',
      listingPrice: Number(b.listing_price || 0),
      guestId: b.user_id || 'guest-1',
      guestName: b.user_name || 'Tenant Guest',
      guestEmail: b.user_email || 'guest@rentora.com',
      startDate: b.preferred_date || new Date().toISOString(),
      endDate: b.preferred_date || new Date().toISOString(),
      status: b.status || 'pending',
      totalAmount: Number(b.total_amount || b.listing_price || 0),
      createdAt: b.created_at
    }));
  } catch (err) {
    return null;
  }
}

/**
 * Create booking in Supabase
 */
export async function createBookingInSupabase(booking: Booking): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const supabase = getSupabase();
    const record = {
      id: booking.id,
      listing_id: booking.listingId,
      listing_title: booking.listingTitle,
      user_name: booking.guestName,
      user_email: booking.guestEmail,
      user_phone: '+234 800 000 0000',
      preferred_date: booking.startDate,
      preferred_time: '10:00 AM',
      status: booking.status || 'pending'
    };

    const { error } = await supabase.from('bookings').insert(record);
    return !error;
  } catch (err) {
    return false;
  }
}
