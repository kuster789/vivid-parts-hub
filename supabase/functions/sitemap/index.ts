import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BASE_URL = "https://motopecasagrale.com.br";

const staticRoutes = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/catalogo", priority: "0.9", changefreq: "daily" },
  { path: "/blog", priority: "0.8", changefreq: "weekly" },
  { path: "/sobre", priority: "0.6", changefreq: "monthly" },
  { path: "/manuais", priority: "0.6", changefreq: "monthly" },
  { path: "/suporte-tecnico", priority: "0.5", changefreq: "monthly" },
  { path: "/envio", priority: "0.5", changefreq: "monthly" },
  { path: "/qualidade", priority: "0.5", changefreq: "monthly" },
];

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date().toISOString().split("T")[0];

  // Fetch active products
  const { data: products } = await supabase
    .from("products")
    .select("id, updated_at")
    .eq("active", true);

  // Fetch published blog posts
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("published", true);

  const urls: string[] = [];

  // Static routes
  for (const route of staticRoutes) {
    urls.push(`
  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`);
  }

  // Product pages
  for (const product of products ?? []) {
    const lastmod = product.updated_at?.split("T")[0] ?? now;
    urls.push(`
  <url>
    <loc>${BASE_URL}/produto/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  // Blog posts
  for (const post of posts ?? []) {
    const lastmod = post.updated_at?.split("T")[0] ?? now;
    urls.push(`
  <url>
    <loc>${BASE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
