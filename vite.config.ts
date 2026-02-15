import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    // Increase chunk size warning limit to 600KB for large vendor chunks
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual chunk splitting for vendor libraries
        manualChunks: (id) => {
          // React core - always needed, keep small
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'react-vendor';
          }
          
          // Firebase - authentication and database (lazy loaded via dynamic imports)
          if (id.includes('node_modules/@firebase/') ||
              id.includes('node_modules/firebase/')) {
            return 'firebase-vendor';
          }
          
          // MediaPipe - heavy ML library (~2MB), loaded on-demand
          if (id.includes('node_modules/@mediapipe/')) {
            return 'mediapipe-vendor';
          }
          
          // Face-API - alternative ML library (~500KB)
          if (id.includes('node_modules/@vladmandic/face-api')) {
            return 'face-api-vendor';
          }
          
          // UI libraries - lucide-react icons
          if (id.includes('node_modules/lucide-react')) {
            return 'ui-vendor';
          }
          
          // Camera utilities
          if (id.includes('node_modules/react-webcam')) {
            return 'camera-vendor';
          }
          
          // Capacitor - mobile native bridge
          if (id.includes('node_modules/@capacitor/')) {
            return 'capacitor-vendor';
          }
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Smirkle',
        short_name: 'Smirkle',
        description: 'Smile Detection Challenge - A fun game where you try not to smile!',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,bin,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Cache AI model files
          {
            urlPattern: /\/models\/.*\.(json|bin)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ai-models-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    headers: {
      // Allow cross-origin requests for AI model loading
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
});
