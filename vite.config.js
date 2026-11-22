import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Zozo Farm App',
        short_name: 'Zozo Farm',
        description: 'Your Farms, In Your Pocket',
        theme_color: '#1B5E20',
        background_color: '#F5F5F0',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webp}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(api|geocoding-api)\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'weather', networkTimeoutSeconds: 6, expiration: { maxEntries: 50, maxAgeSeconds: 86400 * 3 } }
          }
        ]
      }
    })
  ],
  build: { chunkSizeWarningLimit: 2000 }
})
