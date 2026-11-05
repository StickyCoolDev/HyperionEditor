import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import markdownDocsPlugin from './vite-plugin-markdown-docs.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function coiPlugin() {
  return {
    name: 'coi-serviceworker-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';
        if (url.endsWith('/coi-serviceworker.js') || url.endsWith('/coi-service-worker.js')) {
          const filePath = resolve(__dirname, 'coi-serviceworker.js');
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
            return res.end(content);
          }
        }
        next();
      });
    },
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      if (!fs.existsSync(distDir)) return;

      const sourceFile = resolve(__dirname, 'coi-serviceworker.js');
      if (!fs.existsSync(sourceFile)) return;

      // Guarantee both filenames exist at root of dist
      fs.copyFileSync(sourceFile, resolve(distDir, 'coi-serviceworker.js'));
      fs.copyFileSync(sourceFile, resolve(distDir, 'coi-service-worker.js'));

      // Also copy to sub-routes in dist (docs and forum)
      ['docs', 'forum'].forEach((sub) => {
        const targetSubDir = resolve(distDir, sub);
        if (fs.existsSync(targetSubDir)) {
          fs.copyFileSync(sourceFile, resolve(targetSubDir, 'coi-serviceworker.js'));
          fs.copyFileSync(sourceFile, resolve(targetSubDir, 'coi-service-worker.js'));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [tailwindcss(), markdownDocsPlugin(), coiPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        docs: resolve(__dirname, 'docs/index.html'),
        forum: resolve(__dirname, 'forum/index.html'),
      },
    },
  },
});
