import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_NAME = "Auto Peças Agrale";
const BASE_URL = "https://motopecasagrale.com.br";
const DEFAULT_IMAGE = `${BASE_URL}/og-default.png`;
const DEFAULT_DESCRIPTION =
  "Especialistas em peças para Agrale, Yamaha, Cagiva e KTM. Componentes originais com envio para todo o Brasil.";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function html(meta: {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
  price?: string;
}) {
  const ogType = meta.type || "website";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>${esc(meta.title)}</title>
  <meta name="description" content="${esc(meta.description)}"/>

  <!-- Open Graph -->
  <meta property="og:title" content="${esc(meta.title)}"/>
  <meta property="og:description" content="${esc(meta.description)}"/>
  <meta property="og:image" content="${esc(meta.image)}"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:url" content="${esc(meta.url)}"/>
  <meta property="og:type" content="${ogType}"/>
  <meta property="og:site_name" content="${SITE_NAME}"/>
  <meta property="og:locale" content="pt_BR"/>
  ${meta.price ? `<meta property="product:price:amount" content="${esc(meta.price)}"/>\n  <meta property="product:price:currency" content="BRL"/>` : ""}

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${esc(meta.title)}"/>
  <meta name="twitter:description" content="${esc(meta.description)}"/>
  <meta name="twitter:image" content="${esc(meta.image)}"/>

  <!-- Redirect real users to the SPA -->
  <meta http-equiv="refresh" content="0;url=${esc(meta.url)}"/>
  <link rel="canonical" href="${esc(meta.url)}"/>
</head>
<body>
  <p>Redirecionando para <a href="${esc(meta.url)}">${esc(meta.title)}</a>…</p>
</body>
</html>`;
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "/";

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let meta = {
    title: `${SITE_NAME} — Peças para Agrale, Yamaha, Cagiva e KTM`,
    description: DEFAULT_DESCRIPTION,
    image: DEFAULT_IMAGE,
    url: `${BASE_URL}${path}`,
    type: "website",
    price: "",
  };

  try {
    // Product page: /produto/:id
    const productMatch = path.match(/^\/produto\/([a-zA-Z0-9-]+)/);
    if (productMatch) {
      const { data: product } = await supabase
        .from("products")
        .select("name, description, price, brand, model, images")
        .eq("id", productMatch[1])
        .single();

      if (product) {
        meta.title = `${product.name} | ${SITE_NAME}`;
        meta.description =
          product.description ||
          `Peça ${product.name} para ${product.brand} ${product.model}. Compre com envio para todo o Brasil.`;
        meta.image =
          product.images && product.images.length > 0
            ? product.images[0]
            : DEFAULT_IMAGE;
        meta.type = "product";
        meta.price = String(product.price);
      }
    }

    // Blog post: /blog/:slug
    const blogMatch = path.match(/^\/blog\/([a-zA-Z0-9-]+)/);
    if (blogMatch) {
      const { data: post } = await supabase
        .from("blog_posts")
        .select("title, excerpt, cover_image")
        .eq("slug", blogMatch[1])
        .single();

      if (post) {
        meta.title = `${post.title} | ${SITE_NAME}`;
        meta.description = post.excerpt || `Leia "${post.title}" no blog Auto Peças Agrale.`;
        meta.image = post.cover_image || DEFAULT_IMAGE;
        meta.type = "article";
      }
    }

    // Catalog: /catalogo
    if (path.startsWith("/catalogo")) {
      const params = new URL(`${BASE_URL}${path}`).searchParams;
      const marca = params.get("marca");
      meta.title = marca
        ? `Peças para ${marca.charAt(0).toUpperCase() + marca.slice(1)} | ${SITE_NAME}`
        : `Catálogo de Peças | ${SITE_NAME}`;
      meta.description = marca
        ? `Encontre peças para ${marca}: cilindros, carburadores, virabrequins e mais. Envio para todo o Brasil.`
        : "Catálogo completo de peças para Agrale, Yamaha, Cagiva e KTM.";
    }

    // Brand page: /marca/:slug
    const brandMatch = path.match(/^\/marca\/([a-zA-Z0-9-]+)/);
    if (brandMatch) {
      const brandName = brandMatch[1].charAt(0).toUpperCase() + brandMatch[1].slice(1);
      meta.title = `Peças ${brandName} | ${SITE_NAME}`;
      meta.description = `Catálogo completo de peças para ${brandName}. Componentes originais com envio nacional.`;
    }

    // Manuais
    if (path === "/manuais") {
      meta.title = `Manuais Técnicos | ${SITE_NAME}`;
      meta.description = "Baixe manuais de oficina, catálogos de peças e tutoriais técnicos para Agrale, Yamaha, Cagiva e KTM.";
    }
  } catch (e) {
    console.error("OG render error:", e);
  }

  return new Response(html(meta), {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
});
