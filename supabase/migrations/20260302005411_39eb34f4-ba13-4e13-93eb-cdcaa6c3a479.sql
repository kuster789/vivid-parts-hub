
-- Migrate existing roles to new hierarchy
UPDATE public.user_roles SET role = 'admin_master' WHERE role = 'admin';
UPDATE public.user_roles SET role = 'operator' WHERE role = 'employee';

-- Update has_role for backward compatibility with all existing RLS policies
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND (
      role = _role
      OR (_role = 'admin' AND role = 'admin_master')
      OR (_role = 'employee' AND role IN ('supervisor', 'operator'))
    )
  )
$$;

-- Role permissions baseline table
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  module text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  UNIQUE(role, module)
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin master can manage role_permissions" ON public.role_permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin_master'));

-- User-level permission overrides
CREATE TABLE public.user_permission_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module text NOT NULL,
  can_view boolean,
  can_create boolean,
  can_edit boolean,
  can_delete boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, module)
);
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin master can manage overrides" ON public.user_permission_overrides FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can view own overrides" ON public.user_permission_overrides FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Audit logs
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_by uuid NOT NULL,
  action text NOT NULL,
  target_user uuid,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin master can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Staff can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = performed_by);

-- Seed baseline permissions
INSERT INTO public.role_permissions (role, module, can_view, can_create, can_edit, can_delete) VALUES
  ('admin_master', 'dashboard', true, true, true, true),
  ('admin_master', 'products', true, true, true, true),
  ('admin_master', 'orders', true, true, true, true),
  ('admin_master', 'sales', true, true, true, true),
  ('admin_master', 'leads', true, true, true, true),
  ('admin_master', 'users', true, true, true, true),
  ('admin_master', 'notifications', true, true, true, true),
  ('admin_master', 'audit_logs', true, false, false, false),
  ('supervisor', 'dashboard', true, false, false, false),
  ('supervisor', 'products', true, true, true, true),
  ('supervisor', 'orders', true, true, true, true),
  ('supervisor', 'sales', true, true, true, true),
  ('supervisor', 'leads', true, true, true, true),
  ('supervisor', 'users', true, true, true, false),
  ('supervisor', 'notifications', true, true, false, true),
  ('supervisor', 'audit_logs', false, false, false, false),
  ('operator', 'dashboard', true, false, false, false),
  ('operator', 'products', true, true, true, false),
  ('operator', 'orders', true, true, true, false),
  ('operator', 'sales', true, false, false, false),
  ('operator', 'leads', true, false, false, false),
  ('operator', 'users', false, false, false, false),
  ('operator', 'notifications', true, false, false, false),
  ('operator', 'audit_logs', false, false, false, false);

-- Prevent deleting last admin_master
CREATE OR REPLACE FUNCTION public.prevent_last_admin_master_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.role = 'admin_master' THEN
    IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin_master' AND id != OLD.id) = 0 THEN
      RAISE EXCEPTION 'Não é possível remover o último Admin Master';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_prevent_last_admin_master
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_last_admin_master_delete();

-- Allow staff to view all profiles for user management
CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));

-- Supervisors can manage operator roles
CREATE POLICY "Supervisors can insert operator roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'supervisor') AND role = 'operator');

CREATE POLICY "Supervisors can delete operator roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'supervisor') AND role = 'operator');

CREATE POLICY "Supervisors can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'supervisor'));
