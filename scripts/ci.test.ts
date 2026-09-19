import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

/* #120 — le 2026-09-06, un timeout isolé de `son.spec.ts` a rougi la CI de
   main : le déploiement a été SAUTÉ, et personne n'a été prévenu. La
   production est restée une semaine sur l'ancien commit. Deux réglages
   l'empêchent ; rien d'autre que ce test ne dirait qu'on les a retirés. */

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

describe('un déploiement sauté se signale', () => {
  const deploy = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');
  /** Le texte d'un job, de son nom jusqu'au job suivant. */
  const job = (nom: string) => deploy.match(new RegExp(`\\n  ${nom}:\\n[\\s\\S]*?(?=\\n  \\w+:\\n|$)`))?.[0] ?? '';

  it('ouvre une alerte quand les vérifications de main sont rouges', () => {
    expect(job('alerte')).toContain("conclusion == 'failure'");
    expect(job('alerte')).toMatch(/gh issue (create|comment)/);
    expect(job('alerte')).toContain('gh run rerun');
  });

  it('garde la barrière : seul un verdict vert déploie', () => {
    expect(job('deploy')).toContain("conclusion == 'success'");
  });

  it('ferme l’alerte une fois le déploiement réussi', () => {
    expect(job('levee')).toContain('needs: deploy');
    expect(job('levee')).toContain('gh issue close');
  });
});
