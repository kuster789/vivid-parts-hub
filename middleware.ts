// Bots & crawlers that benefit from server-rendered HTML.
// Googlebot, GoogleOther and Googlebot-Image are listed explicitly so the
// product feed for Google Shopping picks up Product schema correctly.
const BOT_UA =
  /Googlebot|Googlebot-Image|Googlebot-Video|GoogleOther|Storebot-Google|AdsBot-Google|Mediapartners-Google|bingbot|BingPreview|DuckDuckBot|YandexBot|Baiduspider|Applebot|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|WhatsAppBot|WABusinessBot|TelegramBot|Slackbot|Discordbot|MastodonBot|vkShare|Pinterest|Embedly|Quora|Showyoubot|outbrain|W3C_Validator|redditbot|AhrefsBot|SemrushBot|MJ12bot|DotBot/i;

export default function middleware(request: Request) {
  const ua = request.headers.get("user-agent") || "";

  if (BOT_UA.test(ua)) {
    const url = new URL(request.url);
    const path = url.pathname + url.search;
    const ogUrl = `https://nohatbgbowlnfizrqtap.supabase.co/functions/v1/og-render?path=${encodeURIComponent(path)}`;
    return fetch(ogUrl);
  }

  return;
}

export const config = {
  matcher: [
    "/",
    "/produto/:path*",
    "/blog/:path*",
    "/catalogo/:path*",
    "/marca/:path*",
    "/manuais",
    "/sobre",
    "/qualidade",
    "/envio",
    "/suporte-tecnico",
    "/kits-revisao",
  ],
};
