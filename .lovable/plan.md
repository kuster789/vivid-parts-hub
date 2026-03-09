
# Plano: Corrigir Build + Gerar Capas para os 4 Novos Posts

## Problema de Build
O arquivo `public/blog/esquema-eletrico-elefantre.png` tem 3.17 MB, ultrapassando o limite de 3 MB do cache PWA (Workbox). Isso causa falha no build.

**Solucao:** Aumentar o `maximumFileSizeToCacheInBytes` de 3 MB para 4 MB no `vite.config.ts` (linha 25).

---

## Geracao de Imagens de Capa

Criar uma edge function temporaria que usa a API de geracao de imagens do Lovable AI para gerar 4 capas tematicas, salvar no Storage e atualizar o campo `cover_image` de cada post no banco.

### Capas planejadas:

| Post | Tema da Capa |
|------|-------------|
| Tabela de Resistencia de Bobinas | Multimetro digital medindo bobina de ignicao de moto, tons escuros com destaque em laranja |
| Guia de Retentores Agrale | Retentores de motor dispostos em fundo escuro, estilo catalogo tecnico |
| Agrale WXT 125 - Motocross 1985 | Moto de motocross estilo anos 80 em pista de terra, visual vintage |
| Esquema Eletrico Elefantre | Diagrama eletrico estilizado com fios coloridos em fundo escuro |

### Passos de implementacao:

1. **Corrigir build** -- aumentar limite PWA de 3 MB para 4 MB no `vite.config.ts`
2. **Criar edge function `generate-blog-cover`** que:
   - Recebe o slug do post e o prompt da imagem
   - Chama a API Lovable AI (modelo `google/gemini-2.5-flash-image`) com o prompt
   - Faz upload da imagem base64 gerada para o bucket `product-images` (ou um bucket dedicado)
   - Atualiza o campo `cover_image` do post no banco de dados
3. **Chamar a edge function** 4 vezes para gerar as capas
4. **Verificar** que as capas aparecem corretamente na listagem `/blog` e nos posts individuais

### Detalhes tecnicos

- Modelo: `google/gemini-2.5-flash-image` via `https://ai.gateway.lovable.dev/v1/chat/completions`
- Formato de saida: base64 PNG
- Armazenamento: bucket Supabase Storage
- Atualizacao: SQL UPDATE no campo `cover_image` da tabela `blog_posts`
- A edge function sera chamada via `supabase--curl_edge_functions` para testar
