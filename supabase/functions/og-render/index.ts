import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_NAME = "Auto Peças Agrale";
const BASE_URL = "https://www.motopecasagrale.com.br";
const OG_VERSION = "v3";
const DEFAULT_IMAGE = `${BASE_URL}/og-default.png?${OG_VERSION}`;
const DEFAULT_DESCRIPTION =
  "Especialistas em peças para Agrale, Yamaha, Cagiva e KTM. Componentes originais com envio para todo o Brasil.";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type MetaBase = {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
  price?: string;
};

type ProductMeta = MetaBase & {
  kind: "product";
  product: {
    id: string;
    name: string;
    description: string;
    price: number | null;
    brand: string;
    model: string;
    images: string[];
    sku?: string | null;
    in_stock?: boolean;
    compatible_models?: string[];
    condition?: string;
  };
};

type BlogMeta = MetaBase & {
  kind: "article";
  post: {
    title: string;
    excerpt: string;
    content?: string;
    cover_image?: string;
    published_at?: string;
    author?: string;
  };
};

type GenericMeta = MetaBase & { kind: "generic" };
type Meta = ProductMeta | BlogMeta | GenericMeta;

function esc(s: string | number | null | undefined) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/images/logo-agrale.png`,
    description: DEFAULT_DESCRIPTION,
    sameAs: [],
  };
}

function productSchema(p: ProductMeta["product"], url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.images && p.images.length > 0 ? p.images : [DEFAULT_IMAGE],
    sku: p.sku || p.id,
    brand: { "@type": "Brand", name: p.brand },
    ...(p.model ? { model: p.model } : {}),
    ...(p.compatible_models && p.compatible_models.length > 0
      ? { isRelatedTo: p.compatible_models.map((m) => ({ "@type": "Product", name: m })) }
      : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "BRL",
      price: p.price != null ? String(p.price) : "0",
      availability:
        p.in_stock === false
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      itemCondition:
        p.condition === "usado"
          ? "https://schema.org/UsedCondition"
          : "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  };
}

function articleSchema(post: BlogMeta["post"], url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image || DEFAULT_IMAGE,
    datePublished: post.published_at,
    author: { "@type": "Organization", name: post.author || SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${BASE_URL}/images/logo-agrale.png` },
    },
    mainEntityOfPage: url,
  };
}

function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/**
 * Render real, crawlable HTML — no meta refresh, no cloaking.
 *
 * The same HTML is also valid for human visitors: it loads the SPA bundle
 * after the static body content. Crawlers index the static body; users get
 * the SPA progressively enhanced over the rendered HTML.
 */
function renderHtml(meta: Meta) {
  const schemas: unknown[] = [organizationSchema()];

  if (meta.kind === "product") {
    schemas.push(productSchema(meta.product, meta.url));
    schemas.push(
      breadcrumbSchema([
        { name: "Início", url: BASE_URL },
        { name: "Catálogo", url: `${BASE_URL}/catalogo` },
        ...(meta.product.brand
          ? [
              {
                name: meta.product.brand,
                url: `${BASE_URL}/marca/${meta.product.brand.toLowerCase()}`,
              },
            ]
          : []),
        { name: meta.product.name, url: meta.url },
      ])
    );
  } else if (meta.kind === "article") {
    schemas.push(articleSchema(meta.post, meta.url));
  }

  const ogType = meta.type || "website";
  const schemaJson = schemas
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join("\n  ");

  let body = "";
  if (meta.kind === "product") {
    const p = meta.product;
    const priceStr =
      p.price != null
        ? p.price.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })
        : "Consulte";
    body = `
    <article itemscope itemtype="https://schema.org/Product">
      <h1 itemprop="name">${esc(p.name)}</h1>
      <p><strong>Marca:</strong> <span itemprop="brand">${esc(p.brand)}</span> · <strong>Modelo:</strong> ${esc(p.model)}</p>
      ${p.images && p.images[0] ? `<img src="${esc(p.images[0])}" alt="${esc(p.name)}" itemprop="image" width="600" loading="eager"/>` : ""}
      <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
        <p><strong>Preço:</strong> <span itemprop="price" content="${esc(p.price ?? 0)}">${esc(priceStr)}</span> <meta itemprop="priceCurrency" content="BRL"/></p>
        <link itemprop="availability" href="https://schema.org/${p.in_stock === false ? "OutOfStock" : "InStock"}"/>
      </div>
      <div itemprop="description">${esc(p.description)}</div>
      ${p.sku ? `<p><small>SKU: <span itemprop="sku">${esc(p.sku)}</span></small></p>` : ""}
      ${p.compatible_models && p.compatible_models.length > 0
        ? `<section><h2>Compatível com</h2><ul>${p.compatible_models.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></section>`
        : ""}
      <p><a href="${esc(meta.url)}">Comprar ${esc(p.name)}</a></p>
    </article>`;
  } else if (meta.kind === "article") {
    const post = meta.post;
    body = `
    <article itemscope itemtype="https://schema.org/Article">
      <h1 itemprop="headline">${esc(post.title)}</h1>
      ${post.cover_image ? `<img src="${esc(post.cover_image)}" alt="${esc(post.title)}" itemprop="image" width="800" loading="eager"/>` : ""}
      <p itemprop="description">${esc(post.excerpt)}</p>
      ${post.content ? `<div itemprop="articleBody">${post.content}</div>` : ""}
    </article>`;
  } else {
    body = `
    <main>
      <h1>${esc(meta.title)}</h1>
      <p>${esc(meta.description)}</p>
      <p><a href="${esc(meta.url)}">Acessar ${esc(SITE_NAME)}</a></p>
    </main>`;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${esc(meta.title)}</title>
  <meta name="description" content="${esc(meta.description)}"/>
  <meta name="robots" content="index,follow"/>
  <link rel="canonical" href="${esc(meta.url)}"/>

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

  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${esc(meta.title)}"/>
  <meta name="twitter:description" content="${esc(meta.description)}"/>
  <meta name="twitter:image" content="${esc(meta.image)}"/>

  ${schemaJson}
</head>
<body>
  ${body}
</body>
</html>`;
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

  const fullUrl = `${BASE_URL}${path}`;
  let meta: Meta = {
    kind: "generic",
    title: `${SITE_NAME} — Peças para Agrale, Yamaha, Cagiva e KTM`,
    description: DEFAULT_DESCRIPTION,
    image: DEFAULT_IMAGE,
    url: fullUrl,
    type: "website",
  };

  try {
    const productMatch = path.match(/^\/produto\/([a-zA-Z0-9-]+)/);
    if (productMatch) {
      const { data: product } = await supabase
        .from("products")
        .select(
          "id, name, description, price, brand, model, images, sku, stock, condition, compatible_models, active"
        )
        .eq("id", productMatch[1])
        .eq("active", true)
        .single();

      if (product) {
        const description =
          product.description ||
          `Peça ${product.name} para ${product.brand} ${product.model}. Compre com envio para todo o Brasil.`;
        const compatibleModels = Array.isArray(product.compatible_models)
          ? (product.compatible_models as unknown[]).map(String)
          : [];
        meta = {
          kind: "product",
          title: `${product.name} | ${SITE_NAME}`,
          description,
          image:
            product.images && product.images.length > 0
              ? product.images[0]
              : DEFAULT_IMAGE,
          url: fullUrl,
          type: "product",
          price: product.price != null ? String(product.price) : "",
          product: {
            id: product.id,
            name: product.name,
            description,
            price: product.price,
            brand: product.brand || "",
            model: product.model || "",
            images: product.images || [],
            sku: product.sku ?? null,
            in_stock: (product.stock ?? 0) > 0,
            compatible_models: compatibleModels,
            condition: product.condition,
          },
        };
      }
    }

    const blogMatch = path.match(/^\/blog\/([a-zA-Z0-9-]+)/);
    if (blogMatch && meta.kind === "generic") {
      const { data: post } = await supabase
        .from("blog_posts")
        .select("title, excerpt, content, cover_image, published_at, author")
        .eq("slug", blogMatch[1])
        .single();

      if (post) {
        meta = {
          kind: "article",
          title: `${post.title} | ${SITE_NAME}`,
          description: post.excerpt || `Leia "${post.title}" no blog Auto Peças Agrale.`,
          image: post.cover_image || DEFAULT_IMAGE,
          url: fullUrl,
          type: "article",
          post: {
            title: post.title,
            excerpt: post.excerpt || "",
            content: post.content || "",
            cover_image: post.cover_image || DEFAULT_IMAGE,
            published_at: post.published_at,
            author: post.author,
          },
        };
      }
    }

    if (meta.kind === "generic") {
      if (path.startsWith("/catalogo")) {
        const params = new URL(fullUrl).searchParams;
        const marca = params.get("marca");
        meta.title = marca
          ? `Peças para ${marca.charAt(0).toUpperCase() + marca.slice(1)} | ${SITE_NAME}`
          : `Catálogo de Peças | ${SITE_NAME}`;
        meta.description = marca
          ? `Encontre peças para ${marca}: cilindros, carburadores, virabrequins e mais. Envio para todo o Brasil.`
          : "Catálogo completo de peças para Agrale, Yamaha, Cagiva e KTM.";
      }

      const brandMatch = path.match(/^\/marca\/([a-zA-Z0-9-]+)/);
      if (brandMatch) {
        const brandName =
          brandMatch[1].charAt(0).toUpperCase() + brandMatch[1].slice(1);
        meta.title = `Peças ${brandName} | ${SITE_NAME}`;
        meta.description = `Catálogo completo de peças para ${brandName}. Componentes originais com envio nacional.`;
      }

      if (path === "/manuais") {
        meta.title = `Manuais Técnicos | ${SITE_NAME}`;
        meta.description =
          "Baixe manuais de oficina, catálogos de peças e tutoriais técnicos para Agrale, Yamaha, Cagiva e KTM.";
      }
    }
  } catch (e) {
    console.error("OG render error:", e);
  }

  return new Response(renderHtml(meta), {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
});
