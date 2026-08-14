import { supabase, isSupabaseConfigured, isPgrstSchemaCacheError } from './supabaseClient';
import { Listing, Booking, User, PropertyReview, BookingMessage } from '../types';
import {
  getListings as getLocalListings,
  createListing as createLocalListing,
  updateListing as updateLocalListing,
  deleteListing as deleteLocalListing,
  getBookings as getLocalBookings,
  createBooking as createLocalBooking,
  updateBookingStatus as updateLocalBookingStatus,
  getReviews as getLocalReviews,
  saveOrUpdateReview as saveLocalReview,
  getFavorites as getLocalFavorites,
  saveFavorites as saveLocalFavorites
} from './store';

/**
 * DATABASE SERVICE FOR RENTORA
 * Standard CRUD operations powered by Supabase PostgreSQL backend
 * with local reactive store fallback for offline/development environments.
 */

// ==========================================
// PROPERTIES CRUD
// ==========================================

export async function getProperties(): Promise<Listing[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getLocalListings();
  }

  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      if (error) {
        if (isPgrstSchemaCacheError(error)) {
          console.info('[Supabase Schema Notice] Table "public.properties" is not in PostgREST schema cache (PGRST205). Using local store fallback. Execute /supabase/migrations/008_properties.sql in your Supabase SQL Editor if remote database sync is desired.');
        } else {
          console.warn('Supabase properties fetch warning, falling back to local store:', error.message);
        }
      }
      return getLocalListings();
    }

    return data.map((row: any): Listing => ({
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
      country: row.country || 'Nigeria',
      state: row.state,
      city: row.city,
      lat: Number(row.lat),
      lng: Number(row.lng),
      bedrooms: Number(row.bedrooms),
      bathrooms: Number(row.bathrooms),
      size: Number(row.size || 0),
      amenities: Array.isArray(row.amenities) ? row.amenities : [],
      images: Array.isArray(row.images) ? row.images : [],
      videoUrl: row.video_url,
      landlordId: row.landlord_id || 'system',
      landlordName: row.landlord_name || 'Property Landlord',
      contactRole: row.contact_role || 'landlord',
      agentCompany: row.agent_company,
      contactPhone: row.contact_phone || '+234 800 000 0000',
      contactWhatsApp: row.contact_whatsapp,
      contactEmail: row.contact_email || 'landlord@rentora.com',
      agentLicense: row.agent_license,
      availableFrom: row.available_from || new Date().toISOString(),
      energyRating: row.energy_rating,
      estimatedMonthlyUtilitiesUSD: row.estimated_monthly_utilities_usd ? Number(row.estimated_monthly_utilities_usd) : undefined,
      solarPowered: Boolean(row.solar_powered),
      hvacType: row.hvac_type,
      insulationQuality: row.insulation_quality
    }));
  } catch (err) {
    console.warn('Supabase getProperties exception, using local store:', err);
    return getLocalListings();
  }
}


export async function getPropertyById(id: string): Promise<Listing | null> {
  const properties = await getProperties();
  return properties.find(p => p.id === id) || null;
}

export async function createProperty(propertyInput: Omit<Listing, 'id' | 'landlordId'> & { landlordId?: string }): Promise<Listing> {
  // Always create in local store first for instant UI response
  const newListing = createLocalListing(propertyInput);

  if (isSupabaseConfigured && supabase) {
    try {
      const dbRecord = {
        id: newListing.id,
        landlord_name: newListing.landlordName || 'Property Owner',
        contact_role: newListing.contactRole || 'landlord',
        agent_company: newListing.agentCompany || null,
        agent_license: newListing.agentLicense || null,
        contact_phone: newListing.contactPhone || '+234 800 000 0000',
        contact_whatsapp: newListing.contactWhatsApp || null,
        contact_email: newListing.contactEmail || 'contact@rentora.com',
        
        title: newListing.title,
        description: newListing.description,
        price: newListing.price,
        price_period: newListing.pricePeriod || 'annual',
        local_price: newListing.localPrice || newListing.price,
        currency: newListing.currency || 'NGN',
        annual_discount_percentage: newListing.annualDiscountPercentage || 0,
        
        type: newListing.type,
        location: newListing.location,
        country: newListing.country || 'Nigeria',
        state: newListing.state || null,
        city: newListing.city || null,
        lat: newListing.lat,
        lng: newListing.lng,
        
        bedrooms: newListing.bedrooms || 1,
        bathrooms: newListing.bathrooms || 1,
        size: newListing.size || null,
        amenities: newListing.amenities || [],
        images: newListing.images || [],
        video_url: newListing.videoUrl || null,
        
        status: 'active',
        is_verified: true,
        available_from: newListing.availableFrom || null,
        energy_rating: newListing.energyRating || null,
        estimated_monthly_utilities_usd: newListing.estimatedMonthlyUtilitiesUSD || null,
        solar_powered: Boolean(newListing.solarPowered),
        hvac_type: newListing.hvacType || null,
        insulation_quality: newListing.insulationQuality || null
      };

      await supabase.from('properties').insert(dbRecord);
    } catch (err) {
      console.warn('Failed to insert property in Supabase:', err);
    }
  }

  return newListing;
}

export async function updateProperty(id: string, updates: Partial<Listing>): Promise<Listing | null> {
  const updatedListing = updateLocalListing(id, updates);

  if (isSupabaseConfigured && supabase) {
    try {
      const payload: any = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.price !== undefined) payload.price = updates.price;
      if (updates.localPrice !== undefined) payload.local_price = updates.localPrice;
      if (updates.currency !== undefined) payload.currency = updates.currency;
      if (updates.location !== undefined) payload.location = updates.location;
      if (updates.city !== undefined) payload.city = updates.city;
      if (updates.state !== undefined) payload.state = updates.state;
      if (updates.country !== undefined) payload.country = updates.country;
      if (updates.bedrooms !== undefined) payload.bedrooms = updates.bedrooms;
      if (updates.bathrooms !== undefined) payload.bathrooms = updates.bathrooms;
      if (updates.amenities !== undefined) payload.amenities = updates.amenities;
      if (updates.images !== undefined) payload.images = updates.images;

      await supabase.from('properties').update(payload).eq('id', id);
    } catch (err) {
      console.warn('Failed to update property in Supabase:', err);
    }
  }

  return updatedListing;
}

export async function deleteProperty(id: string): Promise<boolean> {
  deleteLocalListing(id);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('properties').delete().eq('id', id);
    } catch (err) {
      console.warn('Failed to delete property from Supabase:', err);
    }
  }

  return true;
}

// ==========================================
// BOOKINGS CRUD
// ==========================================

export async function getBookings(): Promise<Booking[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getLocalBookings();
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      if (error) {
        if (isPgrstSchemaCacheError(error)) {
          console.info('[Supabase Schema Notice] Table "public.bookings" is not in PostgREST schema cache (PGRST205). Using local store fallback.');
        } else {
          console.warn('Supabase bookings fetch warning, falling back to local store:', error.message);
        }
      }
      return getLocalBookings();
    }

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
    console.warn('Supabase getBookings exception, using local store:', err);
    return getLocalBookings();
  }
}

export async function createBooking(bookingInput: Omit<Booking, 'id' | 'createdAt' | 'status'> & { id?: string; status?: Booking['status'] }): Promise<Booking> {
  const newBooking = createLocalBooking(bookingInput);

  if (isSupabaseConfigured && supabase) {
    try {
      const record = {
        id: newBooking.id,
        listing_id: newBooking.listingId,
        listing_title: newBooking.listingTitle,
        user_name: newBooking.guestName,
        user_email: newBooking.guestEmail,
        user_phone: '+234 800 000 0000',
        preferred_date: newBooking.startDate,
        preferred_time: '10:00 AM',
        status: newBooking.status || 'pending'
      };

      await supabase.from('bookings').insert(record);
    } catch (err) {
      console.warn('Failed to insert booking in Supabase:', err);
    }
  }

  return newBooking;
}

export async function updateBookingStatus(id: string, status: 'approved' | 'rejected' | 'confirmed' | 'pending' | 'cancelled' | 'completed'): Promise<Booking | null> {
  const updatedBooking = updateLocalBookingStatus(id, status as any);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('bookings').update({ status }).eq('id', id);
    } catch (err) {
      console.warn('Failed to update booking status in Supabase:', err);
    }
  }

  return updatedBooking;
}

export async function deleteBooking(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('bookings').delete().eq('id', id);
    } catch (err) {
      console.warn('Failed to delete booking from Supabase:', err);
    }
  }

  return true;
}

// ==========================================
// REVIEWS & RATINGS CRUD
// ==========================================

export async function getReviewsForListing(listingId: string): Promise<PropertyReview[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getLocalReviews().filter(r => r.listingId === listingId);
  }

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return getLocalReviews().filter(r => r.listingId === listingId);
    }

    return data.map((r: any): PropertyReview => ({
      id: r.id,
      listingId: r.listing_id,
      bookingId: r.booking_id,
      guestId: r.guest_id || 'guest-1',
      guestName: r.guest_name || 'Guest User',
      rating: Number(r.rating || 5),
      comment: r.comment || '',
      createdAt: r.created_at
    }));
  } catch {
    return getLocalReviews().filter(r => r.listingId === listingId);
  }
}

export async function saveOrUpdateReview(reviewData: Omit<PropertyReview, 'id' | 'createdAt'>): Promise<PropertyReview> {
  const localRev = saveLocalReview(reviewData);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('reviews').upsert({
        id: localRev.id,
        listing_id: localRev.listingId,
        booking_id: localRev.bookingId,
        guest_id: localRev.guestId,
        guest_name: localRev.guestName,
        rating: localRev.rating,
        comment: localRev.comment,
        created_at: localRev.createdAt
      }, { onConflict: 'booking_id' });
    } catch (err) {
      console.warn('Failed to save review to Supabase:', err);
    }
  }

  return localRev;
}

// ==========================================
// FAVORITES / SAVED PROPERTIES
// ==========================================

export async function getFavorites(userId?: string): Promise<string[]> {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('listing_id')
        .eq('user_id', userId);

      if (!error && data && data.length > 0) {
        return data.map((row: any) => row.listing_id);
      }
    } catch (err) {
      console.warn('Failed to fetch favorites from Supabase:', err);
    }
  }

  return getLocalFavorites();
}

export async function toggleFavorite(listingId: string, userId?: string): Promise<boolean> {
  const localFavs = getLocalFavorites();
  const exists = localFavs.includes(listingId);
  let favorited = false;

  if (exists) {
    saveLocalFavorites(localFavs.filter(id => id !== listingId));
    favorited = false;
  } else {
    saveLocalFavorites([...localFavs, listingId]);
    favorited = true;
  }

  if (isSupabaseConfigured && supabase && userId) {
    try {
      if (favorited) {
        await supabase.from('favorites').insert({ user_id: userId, listing_id: listingId });
      } else {
        await supabase.from('favorites').delete().eq('user_id', userId).eq('listing_id', listingId);
      }
    } catch (err) {
      console.warn('Failed to toggle favorite in Supabase:', err);
    }
  }

  return favorited;
}

// ==========================================
// MAINTENANCE REQUESTS CRUD
// ==========================================

export interface MaintenanceRequestRecord {
  id: string;
  ticketCode: string;
  listingTitle: string;
  tenantName: string;
  tenantEmail: string;
  issueTitle: string;
  description: string;
  status: string;
  landlordNote?: string;
  createdAt: string;
}

export async function getMaintenanceRequests(): Promise<MaintenanceRequestRecord[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((r: any): MaintenanceRequestRecord => ({
      id: String(r.id),
      ticketCode: r.ticket_code || `MT-${r.id}`,
      listingTitle: r.listing_title,
      tenantName: r.tenant_name,
      tenantEmail: r.tenant_email,
      issueTitle: r.issue_title,
      description: r.description || '',
      status: r.status || 'Pending Review',
      landlordNote: r.landlord_note || '',
      createdAt: r.created_at
    }));
  } catch {
    return [];
  }
}

export async function createMaintenanceRequest(input: Omit<MaintenanceRequestRecord, 'id' | 'createdAt'>): Promise<MaintenanceRequestRecord> {
  const newId = `maint-${Date.now()}`;
  const record: MaintenanceRequestRecord = {
    ...input,
    id: newId,
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('maintenance_requests').insert({
        ticket_code: record.ticketCode,
        listing_title: record.listingTitle,
        tenant_uid: 'tenant-1',
        tenant_name: record.tenantName,
        tenant_email: record.tenantEmail,
        issue_title: record.issueTitle,
        description: record.description,
        status: record.status,
        landlord_note: record.landlordNote || ''
      });
    } catch (err) {
      console.warn('Failed to insert maintenance request in Supabase:', err);
    }
  }

  return record;
}

// ==========================================
// PAYOUT TRANSACTIONS CRUD
// ==========================================

export async function getPayoutTransactions(): Promise<any[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('payout_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

// ==========================================
// REAL-TIME LISTENER FOR SUPABASE
// ==========================================

export function subscribeToSupabaseChanges(tableName: string, callback: () => void, schema = 'public'): (() => void) | null {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const channel = supabase
      .channel(`${schema}:${tableName}`)
      .on(
        'postgres_changes',
        { event: '*', schema, table: tableName },
        () => callback()
      )
      .subscribe((status, err) => {
        if (err || status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Quietly handle channel closure or WebSocket disconnects without unhandled rejections
          console.info(`[Supabase Realtime Channel Status: ${status} for ${schema}.${tableName}]`, err?.message || '');
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  } catch (err) {
    console.info(`[Supabase ${schema}.${tableName} Subscription Notice]:`, err);
    return null;
  }
}

export function subscribeToStorageObjects(bucketId: string, callback: () => void): (() => void) | null {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const channel = supabase
      .channel(`storage:${bucketId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'storage', table: 'objects', filter: `bucket_id=eq.${bucketId}` },
        () => callback()
      )
      .subscribe((status, err) => {
        if (err || status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Quietly handle channel closure or WebSocket disconnects without unhandled rejections
          console.info(`[Supabase Storage Channel Status: ${status} for ${bucketId}]`, err?.message || '');
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  } catch (err) {
    console.info(`[Supabase Storage Bucket ${bucketId} Subscription Notice]:`, err);
    return null;
  }
}

