import { next } from "@vercel/edge";

const BOT_UA =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|Discordbot|vkShare|Pinterest|Embedly|Quora|Showyoubot|outbrain|W3C_Validator|redditbot/i;

export default function middleware(request: Request) {
  const ua = request.headers.get("user-agent") || "";

  if (BOT_UA.test(ua)) {
    const url = new URL(request.url);
    const path = url.pathname + url.search;
    const ogUrl = `https://nohatbgbowlnfizrqtap.supabase.co/functions/v1/og-render?path=${encodeURIComponent(path)}`;
    return fetch(ogUrl);
  }

  return next();
}

export const config = {
  matcher: ["/produto/:path*", "/blog/:path*", "/catalogo/:path*", "/marca/:path*", "/manuais"],
};
