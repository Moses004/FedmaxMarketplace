import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, doublePrecision, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('guest').notNull(),
  avatar: text('avatar'),
  phone: text('phone'),
  city: text('city'),
  country: text('country'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const listings = pgTable('listings', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: doublePrecision('price').notNull(),
  location: text('location').notNull(),
  address: text('address'),
  city: text('city'),
  country: text('country'),
  type: text('type').default('apartment').notNull(),
  bedrooms: integer('bedrooms').default(1).notNull(),
  bathrooms: integer('bathrooms').default(1).notNull(),
  landlordUid: text('landlord_uid').notNull(),
  landlordName: text('landlord_name'),
  contactEmail: text('contact_email'),
  isVerified: boolean('is_verified').default(true),
  availableFrom: text('available_from'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  bookingCode: text('booking_code').notNull().unique(),
  listingId: integer('listing_id').references(() => listings.id),
  listingTitle: text('listing_title').notNull(),
  guestUid: text('guest_uid').notNull(),
  guestEmail: text('guest_email').notNull(),
  guestName: text('guest_name').notNull(),
  moveInDate: text('move_in_date').notNull(),
  moveOutDate: text('move_out_date'),
  status: text('status').default('pending').notNull(),
  totalPrice: doublePrecision('total_price').notNull(),
  landlordUid: text('landlord_uid'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const maintenanceRequests = pgTable('maintenance_requests', {
  id: serial('id').primaryKey(),
  ticketCode: text('ticket_code').notNull().unique(),
  listingTitle: text('listing_title').notNull(),
  tenantUid: text('tenant_uid').notNull(),
  tenantEmail: text('tenant_email').notNull(),
  tenantName: text('tenant_name').notNull(),
  issueTitle: text('issue_title').notNull(),
  description: text('description'),
  status: text('status').default('Pending Review').notNull(),
  landlordNote: text('landlord_note'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings),
  bookings: many(bookings),
}));

export const listingsRelations = relations(listings, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  listing: one(listings, {
    fields: [bookings.listingId],
    references: [listings.id],
  }),
}));
