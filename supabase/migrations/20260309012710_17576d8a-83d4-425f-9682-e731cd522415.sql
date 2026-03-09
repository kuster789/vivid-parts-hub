
-- Insert coupons module permissions for all roles
INSERT INTO public.role_permissions (role, module, can_view, can_create, can_edit, can_delete)
VALUES
  ('admin_master', 'coupons', true, true, true, true),
  ('supervisor',   'coupons', true, true, true, true),
  ('operator',     'coupons', true, false, false, false),
  ('admin',        'coupons', true, true, true, true),
  ('employee',     'coupons', true, false, false, false)
ON CONFLICT DO NOTHING;

-- Drop old restrictive policy and add granular ones
DROP POLICY IF EXISTS "Only admins can manage coupons" ON public.coupons;

-- Admins (admin_master included via has_role) have full access
CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Supervisors can manage coupons (view/create/edit/delete)
CREATE POLICY "Supervisors can manage coupons"
  ON public.coupons FOR ALL
  USING (has_role(auth.uid(), 'supervisor'::app_role));

-- Operators can only view coupons
CREATE POLICY "Operators can view coupons"
  ON public.coupons FOR SELECT
  USING (has_role(auth.uid(), 'operator'::app_role));
