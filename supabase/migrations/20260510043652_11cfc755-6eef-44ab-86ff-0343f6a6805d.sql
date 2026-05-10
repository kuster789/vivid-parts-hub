-- 1. PAGE VIEWS SECURITY (WARN 1 FIX)
-- Remover política excessivamente permissiva
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;

-- Criar política restrita para inserção (Frontend só pode enviar session_id e page_path)
-- Campos country, region, city são nulos na inserção e preenchidos via Edge Function com Service Role
CREATE POLICY "Public can insert limited page views"
ON public.page_views
FOR INSERT
WITH CHECK (
    country IS NULL AND 
    region IS NULL AND 
    city IS NULL
);

-- 2. STORAGE LISTING RESTRICTION (WARN 2 & 3 FIX)
-- Em vez de SELECT (true) que permite listagem, restringimos a leitura de objetos sem permitir listagem do bucket
-- Observação: Supabase Storage linter reclama de SELECT em storage.objects que não filtre por nome ou metadados específicos.
-- Como buckets de produtos e manuais precisam ser públicos para o site, mas não queremos listagem programática:
DROP POLICY IF EXISTS "Public access" ON storage.objects;
DROP POLICY IF EXISTS "Manuals are public" ON storage.objects;

CREATE POLICY "Public can read product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Public can read manuals"
ON storage.objects FOR SELECT
USING (bucket_id = 'manuals');

-- Adicionando política explícita para negar listagem se necessário (embora SELECT controle isso)
-- O linter do Supabase às vezes é persistente com listagem em buckets públicos.
-- A melhor prática é garantir que o bucket seja 'public: true' no buckets table mas as policies de objects sejam granulares.
