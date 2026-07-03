import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET ?? 'http://localhost:8000'

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'logo.webp', 'icons/*.png'],
        manifest: {
          name: 'LCP Inventario',
          short_name: 'Inventario',
          description: 'Sistema de inventario de donaciones — Acopio LCP',
          start_url: '/',
          display: 'standalone',
          background_color: '#f5f7fa',
          theme_color: '#165382',
          orientation: 'portrait',
          icons: [
            { src: '/icons/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/android-chrome-384x384.png', sizes: '384x384', type: 'image/png' },
            { src: '/icons/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,webp,woff2}'],
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              // API calls: network-first, short cache
              urlPattern: /^https?:\/\/.*\/api\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              },
            },
            {
              // Item images from R2 (or any external image): cache-first,
              // download once and reuse. This is the big bandwidth saver.
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
