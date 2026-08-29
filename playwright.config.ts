import { defineConfig, devices } from '@playwright/test';

/**
 * Chromium pour tout le visuel (le helper CDP y émet des couples (code, key)
 * réalistes). Firefox et WebKit ne portent QUE le chemin de repli « Appuie sur
 * la touche A », là où `navigator.keyboard.getLayoutMap()` n'existe pas.
 */
/* Ports surchargeables : plusieurs worktrees du même dépôt coexistent sur
   cette machine, et deux d'entre eux ne peuvent pas écouter sur 3000. */
const PORT_APP = process.env.PORT_APP ?? '3000';
const PORT_API = process.env.PORT_API ?? '3001';
const BASE_URL = `http://localhost:${PORT_APP}`;

/** Même base que `npm run test:db` : un seul Postgres de test à faire tourner. */
const BDD_E2E =
  process.env.TEST_DATABASE_URL ??
  'postgresql://tapeavecmoi:tapeavecmoi@localhost:55432/tapeavecmoi';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: BASE_URL, trace: 'on-first-retry' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'firefox-repli',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /detection\.spec\.ts/,
    },
    {
      name: 'webkit-repli',
      use: { ...devices['Desktop Safari'] },
      testMatch: /detection\.spec\.ts/,
    },
  ],
  /* DEUX serveurs : l'API et son Postgres sont désormais indispensables — la
     connexion est obligatoire, donc aucun parcours n'atteint la leçon sans
     compte. Auparavant seul Vite était lancé, `/api` proxifiait dans le vide,
     et `compte.spec.ts` se sautait en silence sans que personne le voie. */
  webServer: [
    {
      command: 'npm run server:start',
      url: `http://localhost:${PORT_API}/api/health`,
      /* JAMAIS de reprise d'un serveur déjà là : un autre worktree du même
         dépôt écoute peut-être sur ce port, et la suite testerait alors SON
         code sans que rien ne le signale — c'est arrivé. Échouer bruyamment
         vaut mieux que passer au vert sur l'arbre d'à côté. */
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        PORT: PORT_API,
        DATABASE_URL: BDD_E2E,
        BETTER_AUTH_SECRET: 'developpement-uniquement-32-caracteres-minimum',
        BETTER_AUTH_URL: BASE_URL,
        FRONTEND_URL: BASE_URL,
      },
    },
    {
      command: 'npm run dev',
      url: BASE_URL,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { PORT_APP, PORT_API },
    },
  ],
});
