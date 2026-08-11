-- ==========================================
-- 022: Supabase Realtime Subscriptions Setup
-- Enable postgres_changes publication on high-priority tables
-- ==========================================

-- Ensure publication exists or alter publication to include real-time entities
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE 
      public.properties,
      public.bookings,
      public.messages,
      public.maintenance_requests,
      public.notifications;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
