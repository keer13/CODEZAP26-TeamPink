import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const medishieldUrl = env.MEDISHIELD_AI_URL || 'https://crawlers-curator-sudden.ngrok-free.dev';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/analyze': {
            target: medishieldUrl,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/analyze/, '/analyze'),
            headers: {
              'ngrok-skip-browser-warning': 'true'
            }
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.MEDISHIELD_AI_URL': JSON.stringify(env.MEDISHIELD_AI_URL || 'https://crawlers-curator-sudden.ngrok-free.dev'),
        'process.env.MEDISHIELD_AI_ENDPOINT': JSON.stringify(env.MEDISHIELD_AI_ENDPOINT || '/analyze')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
