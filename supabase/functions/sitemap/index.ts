import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BASE_URL = "https://www.motopecasagrale.com.br";

const staticRoutes = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/catalogo", priority: "0.9", changefreq: "daily" },
  { path: "/blog", priority: "0.8", changefreq: "weekly" },
  { path: "/kits-revisao", priority: "0.7", changefreq: "weekly" },
  { path: "/sobre", priority: "0.6", changefreq: "monthly" },
  { path: "/manuais", priority: "0.6", changefreq: "monthly" },
  { path: "/suporte-tecnico", priority: "0.5", changefreq: "monthly" },
  { path: "/envio", priority: "0.5", changefreq: "monthly" },
  { path: "/qualidade", priority: "0.5", changefreq: "monthly" },
];

const brandSlugs = ["agrale", "yamaha", "cagiva", "ktm"];

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date().toISOString().split("T")[0];

  // Fetch active products with images
  const { data: products } = await supabase
    .from("products")
    .select("id, name, updated_at, images, brand, model")
    .eq("active", true);

  // Fetch published blog posts
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at, cover_image, title")
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

  // Brand pages
  for (const slug of brandSlugs) {
    urls.push(`
  <url>
    <loc>${BASE_URL}/marca/${slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  // Product pages with image sitemap
  for (const product of products ?? []) {
    const lastmod = product.updated_at?.split("T")[0] ?? now;
    const images = (product.images as string[] | null) ?? [];
    const imageEntries = images
      .filter((img: string) => img && img.startsWith("http"))
      .map((img: string) => `
      <image:image>
        <image:loc>${escapeXml(img)}</image:loc>
        <image:title>${escapeXml(product.name)} - ${escapeXml(product.brand)} ${escapeXml(product.model)}</image:title>
      </image:image>`)
      .join("");

    urls.push(`
  <url>
    <loc>${BASE_URL}/produto/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${imageEntries}
  </url>`);
  }

  // Blog posts with cover images
  for (const post of posts ?? []) {
    const lastmod = post.updated_at?.split("T")[0] ?? now;
    const coverImage = post.cover_image
      ? `
      <image:image>
        <image:loc>${escapeXml(post.cover_image.startsWith("http") ? post.cover_image : BASE_URL + post.cover_image)}</image:loc>
        <image:title>${escapeXml(post.title)}</image:title>
      </image:image>`
      : "";

    urls.push(`
  <url>
    <loc>${BASE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>${coverImage}
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urls.join("")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
