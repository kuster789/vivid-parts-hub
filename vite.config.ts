import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "robots.txt"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        // Only cache lightweight UI assets in the SW. Blog/manual/product
        // bulk media is fetched on demand from the CDN, never bundled.
        globPatterns: ["**/*.{js,css,html,ico,svg,woff,woff2}"],
        globIgnores: [
          "**/blog/**",
          "**/manuals/**",
          "**/products/**",
          "**/og-default.*",
        ],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*\.(png|jpg|jpeg|webp|svg)/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "supabase-images",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      manifest: {
        name: "Auto Peças Agrale",
        short_name: "AP Agrale",
        description: "Loja de auto peças Agrale - Peças originais e de qualidade",
        theme_color: "#0d1117",
        background_color: "#0d1117",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split heavy vendor libraries into discrete chunks so the home page
        // never has to download Three.js / PDF / CAD parsers up front. Routes
        // are already lazy() in App.tsx, so these chunks load only when the
        // user opens the page that needs them.
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "react-query": ["@tanstack/react-query"],
          "supabase": ["@supabase/supabase-js"],
          "three": ["@react-three/fiber", "@react-three/drei", "three"],
          "model-viewer": ["@google/model-viewer"],
          "cad": ["occt-import-js"],
          "pdf": ["react-pdf", "jspdf", "html2canvas"],
          "charts": ["recharts"],
          "forms": ["react-hook-form", "@hookform/resolvers", "zod"],
        },
      },
    },
  },
}));
