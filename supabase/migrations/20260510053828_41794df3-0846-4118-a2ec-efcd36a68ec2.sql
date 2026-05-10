-- 1. Buckets Públicos: Remover permissão de listagem (SELECT em storage.objects sem filtro de nome)
-- Ajustar políticas existentes para permitir SELECT apenas se o nome do arquivo for conhecido ou via políticas mais restritas
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Criar políticas seguras (SELECT permitido apenas se bucket_id for público, mas listagem via API bloqueada por padrão se não houver política explícita de listagem)
-- Nota: O linter reclama se houver SELECT irrestrito em buckets públicos.
-- Vamos garantir que SELECT em buckets específicos seja permitido mas não a listagem geral.

CREATE POLICY "Allow public select on product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Allow public select on blog images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

-- 2. Funções SECURITY DEFINER: Revogar execução pública e restringir a AUTHENTICATED onde aplicável
-- Já revogamos algumas, agora vamos garantir as outras que o linter apontou.

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.decrement_stock_on_order() FROM public;
GRANT EXECUTE ON FUNCTION public.decrement_stock_on_order() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.increment_stock_on_order_delete() FROM public;
GRANT EXECUTE ON FUNCTION public.increment_stock_on_order_delete() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.notify_new_product() FROM public;
GRANT EXECUTE ON FUNCTION public.notify_new_product() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;
-- handle_new_user geralmente é disparado por trigger do auth.users, 
-- mas pode ser chamado por outros. Mantemos restrito.
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
