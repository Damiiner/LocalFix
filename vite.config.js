import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "LocalFix",
        short_name: "LocalFix",
        description: "Neighbors helping neighbors — Monastir demo",
        theme_color: "#0b0b10",
        background_color: "#050508",
        display: "standalone",
        start_url: "/",
        lang: "en"
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "osm-tiles",
              expiration: { maxEntries: 80, maxAgeSeconds: 86400 }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.basemaps\.cartocdn\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "carto-tiles",
              expiration: { maxEntries: 80, maxAgeSeconds: 86400 }
            }
          }
        ]
      }
    })
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.js"
  }
});
