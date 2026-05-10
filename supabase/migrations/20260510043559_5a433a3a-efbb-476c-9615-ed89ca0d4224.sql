-- 1. SECURITY DEFINER HARDENING (Usando OID para evitar problemas com overloading)
DO $$ 
DECLARE 
    func_record RECORD;
BEGIN 
    FOR func_record IN (
        SELECT p.oid, n.nspname as schema, p.proname as name 
        FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE n.nspname = 'public' AND p.prosecdef = true
    ) LOOP
        EXECUTE 'REVOKE ALL ON FUNCTION ' || func_record.oid::regprocedure || ' FROM PUBLIC, anon, authenticated;';
    END LOOP;
END $$;

-- Re-garantir permissões mínimas necessárias
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_quote_number() TO authenticated;

-- 2. REALTIME SECURITY (realtime.messages)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can subscribe to their own notification channel" ON realtime.messages;
CREATE POLICY "Users can subscribe to their own notification channel"
ON realtime.messages
FOR SELECT
USING (
  extension = 'broadcast' AND 
  (topic = 'notification:user:' || auth.uid()::text)
);

DROP POLICY IF EXISTS "Admins can subscribe to admin channels" ON realtime.messages;
CREATE POLICY "Admins can subscribe to admin channels"
ON realtime.messages
FOR SELECT
USING (
  extension = 'broadcast' AND 
  (topic LIKE 'admin:%') AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'admin_master'))
);

-- 3. NOTIFICATIONS RLS
DROP POLICY IF EXISTS "Public can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (
  auth.uid() = user_id OR 
  (user_id IS NULL AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'admin_master')))
);

CREATE POLICY "Admins can manage notifications"
ON public.notifications
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'admin_master'));

-- 4. PRIVILEGE ESCALATION PROTECTION
DROP POLICY IF EXISTS "Only admin_master can manage roles" ON public.user_roles;
CREATE POLICY "Only admin_master can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin_master'))
WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

-- 5. RLS POLICY ALWAYS TRUE (Correção manual de resíduos)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Anyone can update reviews') THEN
        DROP POLICY "Anyone can update reviews" ON public.reviews;
    END IF;
END $$;
