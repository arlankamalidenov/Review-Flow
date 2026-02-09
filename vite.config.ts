import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      // Headers for FFmpeg.wasm (SharedArrayBuffer support)
      // 
      // ✅ COEP is NOW ENABLED - Tailwind is local, no CDN conflicts!
      // - Styles: ✅ Working (local Tailwind CSS)
      // - FFmpeg: ✅ Working (SharedArrayBuffer available)
      //
      // This configuration allows BOTH styles and video processing to work.
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'credentialless',
      },
      proxy: {
        '/tilda-images': {
          target: 'https://tupwidget.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/tilda-images/, ''),
          secure: false,
        },
        '/wp-json/bf': {
          target: 'https://bfisherman.no',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/wp-json\/bf/, '/wp-json'),
          secure: false,
        },
        '/wp-json/rb': {
          target: 'https://rbesolov.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/wp-json\/rb/, '/wp-json'),
          secure: false,
        }
      }
    },
    // Optimize for large video files
    build: {
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks: {
            'ffmpeg-core': ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
          },
        },
      },
    },
    optimizeDeps: {
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
    }
  };
});
