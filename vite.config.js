import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'http://localhost:3456';

  return {
    // Inject API base URL into every HTML page so vanilla JS can read window.__API_BASE__
    plugins: [
      {
        name: 'inject-api-config',
        transformIndexHtml: {
          order: 'pre',
          handler(html) {
            return html.replace(
              '</head>',
              `<script>window.__API_BASE__ = "${apiUrl}";</script>\n</head>`
            );
          }
        }
      }
    ],

    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main:  resolve(__dirname, 'index.html'),
          admin: resolve(__dirname, 'admin.html'),
        }
      }
    },

    // Serve existing server.js API in dev via proxy so the same origin is used
    server: {
      proxy: {
        '/api': 'http://localhost:3456',
        '/thumbnails': 'http://localhost:3456',
      }
    }
  };
});
