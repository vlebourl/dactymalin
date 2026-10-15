import { defineConfig } from 'vitest/config';

// Vitest 2 utilise encore Vite 5 ; sa configuration reste indépendante
// du serveur et du build Vite 6. Le JSX automatique est conservé pour React.
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    // Les tests de hook et de vue choisissent jsdom par docblock.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
