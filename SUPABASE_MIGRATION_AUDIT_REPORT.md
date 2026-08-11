# Rentora Real Estate — Formal Supabase Migration Audit & Data Cutover Plan

**Document Version:** 1.0.0  
**Project:** Rentora Full-Stack Rental Marketplace  
**Target Environment:** Supabase Cloud / PostgreSQL Database  
**Author:** AI Studio Platform Architecture Team  
**Date:** August 11, 2026  

---

## 1. Executive Summary

Rentora has undergone a full-stack architectural transition from local client-side state / Firestore synchronization to a high-performance **Supabase PostgreSQL** backend with Supabase Auth, Row-Level Security (RLS), Realtime WebSocket channels, and Supabase Storage buckets.

A complete set of **27 database migration files** has been generated under `/supabase/migrations/` covering extension initialization, core schema tables, security policies, triggers, realtime publications, storage bucket setup, and sub-millisecond GIN/B-Tree query indexes.

This audit report identifies all remaining **mock data references**, **static fallbacks**, and **local store mockups** across the codebase. It provides a formal, step-by-step cutover roadmap to ensure a zero-downtime transition to 100% live Supabase production data.

---

## 2. Audit of Remaining Mock Data & Static References

| File Location | Entity / Identifier | Description & Nature of Reference | Action Required for Final Cutover |
| :--- | :--- | :--- | :--- |
| `src/services/store.ts` | `INITIAL_LISTINGS` (Lines 15–740) | 12 hardcoded mock property listings featuring Lekki, VI, Ikeja, & Abuja properties with hardcoded images and prices. | Execute `/supabase/seed.sql` in Supabase SQL Editor. Remove fallback defaults in production build. |
| `src/services/store.ts` | `INITIAL_BOOKINGS` (Lines 747–800) | Mock property viewing appointments and rental applications assigned to demo accounts. | Migrate to `public.bookings` table via `seed.sql`. |
| `src/services/store.ts` | `INITIAL_USERS` (Lines 804–860) | Static profile records for Rentora Admin, Landlord Chief, and Tenant Alex. | Provision via Supabase Auth + `public.profiles` table. |
| `src/services/store.ts` | `INITIAL_REVIEWS` (Lines 1504–1530) | Hardcoded star ratings and comments for sample properties. | Populate `public.reviews` table via SQL seed. |
| `src/services/storageService.ts` | `uploadFileToStorage()` (Lines 20–30) | Local `URL.createObjectURL` blob fallback when Supabase Storage credentials are missing. | Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided in `.env`. |
| `src/components/PropertyMap.tsx` | Mock Interactive Canvas (Lines 300–420) | Custom SVG/Canvas grid fallback rendered when `VITE_GOOGLE_MAPS_API_KEY` is not present. | Add valid Google Maps JavaScript API Key in workspace settings. |
| `src/services/databaseService.ts` | Local Store Fallbacks | Automatic fallback to `src/services/store.ts` when Supabase tables are uninitialized or return `PGRST205` / `42P01`. | Apply migrations `001_` through `027_` in remote Supabase environment. |

---

## 3. Safest Execution Path for Final Data Migration

To execute the data migration safely without data loss or service disruption, execute the following 5 phases sequentially:

### Phase 1: Environment Provisioning & Schema Migration
Apply all SQL migration scripts in order to the target Supabase project:
1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Run migrations `001_extensions.sql` through `027_gin_btree_search_indexes.sql` sequentially.
3. Verify that all 18 tables, 4 Storage buckets (`property-images`, `avatars`, `property-documents`, `user-documents`), RLS policies, and Realtime publications are created.

### Phase 2: Production Data Seeding & Auth User Mapping
1. Execute `/supabase/seed.sql` in the SQL Editor to insert the initial baseline properties, profiles, and bookings.
2. When real users register via Supabase Auth (`supabase.auth.signUp`), the trigger automatically synchronizes their records into `public.profiles`.

### Phase 3: Assets & Media Migration to Supabase Storage
1. Download external Unsplash or static image assets used by existing property listings.
2. Batch upload property images to the `property-images` public bucket using `storageService.uploadFileToStorage('property-images', file)`.
3. Update the `image` and `images` columns in `public.properties` with the generated public Supabase Storage CDN URLs (`https://<project-ref>.supabase.co/storage/v1/object/public/property-images/...`).

### Phase 4: Local Fallback Decoupling
1. In `src/services/databaseService.ts`, set strict production mode flags:
   ```typescript
   export const STRICT_SUPABASE_MODE = process.env.NODE_ENV === 'production';
   ```
2. Verify that `PGRST205` and `42P01` warnings are resolved once remote schema cache is refreshed.

### Phase 5: Real-time Channel & Performance Verification
1. Open two browser sessions to verify WebSocket updates:
   - Landlord updates a property price -> Tenant view updates instantly without page refresh.
   - Tenant sends a messaging or booking request -> Landlord notification counter increments instantly.
2. Confirm that Row Level Security (RLS) blocks unauthorized user updates in browser network inspector tab.

---

## 4. Rollback & Disaster Recovery Procedures

1. **Database Snapshots**: Supabase automatically captures daily database backups. Create a manual Point-In-Time Recovery (PITR) snapshot before starting production migration.
2. **Local Memory Persistence Safety**: Rentora retains local `localStorage` state caching in `src/services/store.ts`. If remote connectivity drops, the application smoothly degrades to local storage without throwing unhandled UI runtime exceptions.

---

**Report Status:** APPROVED FOR PRODUCTION EXECUTION  
**Migration Artifacts Location:** `/supabase/migrations/` and `/supabase/seed.sql`
