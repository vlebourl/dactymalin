/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/* Ports surchargeables : plusieurs worktrees du meme depot coexistent sur
   cette machine, et deux d'entre eux ne peuvent pas ecouter sur 3000. */
const PORT_APP = Number(process.env.PORT_APP ?? 3000);
const PORT_API = Number(process.env.PORT_API ?? 3001);

export default defineConfig({
  plugins: [react()],
  server: {
    port: PORT_APP,
    strictPort: true,
    /* En developpement, l'API tourne a part (`npm run server:dev`) : le front
       l'appelle sur la meme origine, comme en production. */
    proxy: { '/api': `http://localhost:${PORT_API}` },
  },
  // Publication locale : tailscale serve (HTTPS tailnet) proxifie vers preview.
  preview: { port: 4173, strictPort: true, allowedHosts: ['lyra.weasel-micro.ts.net'] },
  test: {
    // `src/core` reste en env node, sans DOM. Les rares tests de hook portent
    // leur propre docblock `@vitest-environment jsdom`.
    environment: 'node',
    include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
  },
});
