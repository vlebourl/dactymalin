import { describe, expect, it } from 'vitest';
import { sauvegarderAvantMigration, uuidBaseDepuisUrl } from '../coolify-backup';

const BASE = 'postgresql://u:p@hrfpcwechi8tb7imlir13b1a:5432/tapeavecmoi';
const COMMUN = {
  databaseUrl: BASE,
  webhookUrl: 'http://coolify:8000/api/v1/deploy',
  apiToken: 'jeton',
  attendre: () => Promise.resolve(),
  budgetMs: 20,
};

/** Faux serveur Coolify : une réponse par motif d'URL. */
function faux(routes: Record<string, unknown[]>): typeof fetch {
  const restes = Object.fromEntries(Object.entries(routes).map(([k, v]) => [k, [...v]]));
  return (async (url: string) => {
    for (const motif of Object.keys(restes)) {
      if (String(url).includes(motif)) {
        const suite = restes[motif];
        const valeur = suite.length > 1 ? suite.shift() : suite[0];
        return { ok: true, status: 200, json: async () => valeur } as Response;
      }
    }
    throw new Error(`route non prévue : ${url}`);
  }) as unknown as typeof fetch;
}

describe("l'UUID de la base", () => {
  it("est l'hôte de DATABASE_URL", () => {
    expect(uuidBaseDepuisUrl(BASE)).toBe('hrfpcwechi8tb7imlir13b1a');
  });
});

describe('sauvegarde avant migration', () => {
  it('passe silencieusement hors Coolify (développement)', async () => {
    await expect(sauvegarderAvantMigration({ databaseUrl: BASE })).resolves.toEqual({
      fait: false,
      raison: 'coolify_absent',
    });
  });

  it('refuse une configuration à moitié faite', async () => {
    await expect(
      sauvegarderAvantMigration({ databaseUrl: BASE, apiToken: 'jeton' }),
    ).rejects.toThrow(/vont par paire/);
  });

  it("refuse de migrer si AUCUNE sauvegarde planifiée n'est active", async () => {
    const fetchImpl = faux({ '/backups': [[{ uuid: 'b1', enabled: false }]] });
    await expect(sauvegarderAvantMigration({ ...COMMUN, fetchImpl })).rejects.toThrow(
      /Aucune sauvegarde planifiée active/,
    );
  });

  it('déclenche la sauvegarde et attend son succès', async () => {
    const fetchImpl = faux({
      // forme RÉELLE de Coolify : un objet enveloppe, pas un tableau nu
      '/executions': [
        { executions: [{ status: 'running', created_at: '2026-08-28T19:00:00+00:00' }] },
        {
          executions: [
            { status: 'running', created_at: '2026-08-28T19:00:00+00:00' },
            { status: 'success', created_at: '2026-08-28T19:24:46+00:00' },
          ],
        },
      ],
      '/backups/b1': [{}],
      '/backups': [[{ uuid: 'b1', enabled: true }]],
    });
    await expect(sauvegarderAvantMigration({ ...COMMUN, fetchImpl })).resolves.toEqual({
      fait: true,
      raison: 'sauvegarde_ok',
    });
  });

  it('refuse de migrer si la sauvegarde échoue', async () => {
    const fetchImpl = faux({
      '/executions': [{ executions: [{ status: 'failed' }] }],
      '/backups/b1': [{}],
      '/backups': [[{ uuid: 'b1', enabled: true }]],
    });
    await expect(sauvegarderAvantMigration({ ...COMMUN, fetchImpl })).rejects.toThrow(/a échoué/);
  });

  it("refuse de migrer si la sauvegarde n'aboutit pas dans le temps imparti", async () => {
    const fetchImpl = faux({
      '/executions': [{ executions: [{ status: 'running' }] }],
      '/backups/b1': [{}],
      '/backups': [[{ uuid: 'b1', enabled: true }]],
    });
    await expect(sauvegarderAvantMigration({ ...COMMUN, fetchImpl })).rejects.toThrow(
      /temps imparti/,
    );
  });
});
