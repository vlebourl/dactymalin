import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

/* #120 — le 2026-09-06, un timeout isolé de `son.spec.ts` a rougi la CI de
   main : le déploiement a été SAUTÉ, et personne n'a été prévenu. La
   production est restée une semaine sur l'ancien commit. Les relances E2E
   et le suivi des vérifications couvrent ce cas. */

describe('la CI tolère un flake, pas un défaut', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('retente deux fois un test e2e en CI', async () => {
    vi.stubEnv('CI', 'true');
    expect((await import('../playwright.config')).default.retries).toBe(2);
  });

  it('ne retente jamais en local : un test instable doit s’y voir', async () => {
    vi.stubEnv('CI', '');
    expect((await import('../playwright.config')).default.retries).toBe(0);
  });
});

describe('le suivi signale les vérifications de main', () => {
  const suivi = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');

  it('traite les verdicts rouge et vert pour le commit courant', () => {
    expect(suivi).toContain("conclusion == 'failure'");
    expect(suivi).toContain("conclusion == 'success'");
    expect(suivi).toContain('git/ref/heads/main');
    expect(suivi).toContain('[ "$MAIN" = "$SHA" ] || exit 0');
    expect(suivi).toMatch(/gh issue (create|comment)/);
    expect(suivi).toContain('gh issue close');
  });

  it('exécute seulement le suivi sur un runner GitHub', () => {
    expect(suivi).toContain('runs-on: ubuntu-latest');
    expect(suivi).not.toMatch(/homelab-runner|COOLIFY_(TOKEN|APP_UUID)/);
  });
});
