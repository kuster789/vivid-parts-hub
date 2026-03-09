INSERT INTO public.role_permissions (role, module, can_view, can_create, can_edit, can_delete) VALUES
  ('admin_master', 'stock', true, true, true, true),
  ('supervisor', 'stock', true, true, true, false),
  ('operator', 'stock', true, false, false, false),
  ('employee', 'stock', true, false, false, false)
ON CONFLICT DO NOTHING;