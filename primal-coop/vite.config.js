import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: `${root}client`,
  resolve: { alias: { '@shared': `${root}shared` } },
  build: { outDir: `${root}dist`, emptyOutDir: true, chunkSizeWarningLimit: 650 },
  server: { fs: { allow: [root] } },
});
