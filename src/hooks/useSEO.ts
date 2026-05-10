import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "product" | "article";
  price?: number;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  brand?: string;
  sku?: string;
  jsonLd?: Record<string, unknown>;
}

const SITE_NAME = "Auto Peças Agrale";
const BASE_URL = "https://www.motopecasagrale.com.br";
const DEFAULT_IMAGE = `${BASE_URL}/og-default.png?v3`;
const DEFAULT_DESCRIPTION =
  "Especialistas em peças para Agrale, Yamaha, Cagiva e KTM. Componentes originais e de qualidade, com envio para todo o Brasil.";

export function useSEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  price,
  availability,
  brand,
  sku,
  jsonLd,
}: SEOProps = {}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;

  useEffect(() => {
    // Title
    document.title = fullTitle;

    const setMeta = (selector: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        const attr = selector.startsWith('[name') ? "name" : "property";
        const val = selector.match(/"([^"]+)"/)?.[1] ?? "";
        el.setAttribute(attr, val);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };

    // Fix potential relative URLs for social sharing
    const absoluteImage = image?.startsWith('http') ? image : `${BASE_URL}${image?.startsWith('/') ? '' : '/'}${image}`;

    // Standard meta
    setMeta('[name="description"]', description);
    setMeta('[name="author"]', SITE_NAME);

    // Canonical
    setLink("canonical", fullUrl);

    // Open Graph
    setMeta('[property="og:title"]', fullTitle);
    setMeta('[property="og:description"]', description);
    setMeta('[property="og:image"]', image);
    setMeta('[property="og:url"]', fullUrl);
    setMeta('[property="og:type"]', type === "product" ? "product" : type === "article" ? "article" : "website");
    setMeta('[property="og:site_name"]', SITE_NAME);
    setMeta('[property="og:locale"]', "pt_BR");

    // Twitter
    setMeta('[name="twitter:card"]', "summary_large_image");
    setMeta('[name="twitter:title"]', fullTitle);
    setMeta('[name="twitter:description"]', description);
    setMeta('[name="twitter:image"]', image);

    // Product-specific OG (used by WhatsApp for pricing)
    if (price !== undefined) {
      setMeta('[property="product:price:amount"]', price.toFixed(2));
      setMeta('[property="product:price:currency"]', "BRL");
    }

    // JSON-LD structured data
    const scriptId = "json-ld-seo";
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.setAttribute("type", "application/ld+json");
      document.head.appendChild(script);
    }

    const structuredData = jsonLd ?? buildJsonLd({ type, title: fullTitle, description, image, url: fullUrl, price, availability, brand, sku });
    script.textContent = JSON.stringify(structuredData);

    return () => {
      // Restore defaults on unmount
      document.title = SITE_NAME;
    };
  }, [fullTitle, description, image, fullUrl, type, price, availability, brand, sku, jsonLd]);
}

function buildJsonLd({ type, title, description, image, url, price, availability, brand, sku }: {
  type: string; title: string; description: string; image: string; url: string;
  price?: number; availability?: string; brand?: string; sku?: string;
}) {
  if (type === "product") {
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: title,
      description,
      image,
      sku,
      brand: brand ? { "@type": "Brand", name: brand } : undefined,
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "BRL",
        price: price?.toFixed(2),
        availability: `https://schema.org/${availability ?? "InStock"}`,
        seller: { "@type": "Organization", name: SITE_NAME },
      },
    };
  }

  if (type === "article") {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      image,
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: "https://www.motopecasagrale.com.br",
      },
    };
  }

  // Default: WebSite / Organization
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: "https://www.motopecasagrale.com.br",
    description,
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.motopecasagrale.com.br/catalogo?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: "https://www.motopecasagrale.com.br",
      logo: {
        "@type": "ImageObject",
        url: "https://www.motopecasagrale.com.br/pwa-512x512.png",
      },
    },
  };
}
