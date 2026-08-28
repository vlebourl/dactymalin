/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 3000, strictPort: true },
  // Publication locale : tailscale serve (HTTPS tailnet) proxifie vers preview.
  preview: { port: 4173, strictPort: true, allowedHosts: ['lyra.weasel-micro.ts.net'] },
  test: {
    // `src/core` reste en env node, sans DOM. Les rares tests de hook portent
    // leur propre docblock `@vitest-environment jsdom`.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
