import { describe, expect, it } from 'vitest';
import { identifiantVersion, VERSION } from '../version';

/**
 * #105 — `/api/health` répondait `version: "0.1.0"`, une valeur lue dans
 * `package.json` qui n'avait pas bougé depuis des mois : elle disait la même
 * chose sur du code vieux d'un mois que sur celui d'aujourd'hui.
 *
 * Ce fichier est le garde-fou : il ÉCHOUE si l'identifiant redevient une
 * constante indépendante de la construction.
 */
describe('identifiant de version', () => {
  it("diffère entre deux démarrages, même à code et commit identiques", () => {
    const env = { SOURCE_COMMIT: 'c03a3793281f595b6c1cb4423b466b8755e59f8b' } as NodeJS.ProcessEnv;
    const avant = identifiantVersion(env, new Date('2026-08-31T15:45:10.000Z'));
    const apres = identifiantVersion(env, new Date('2026-08-31T18:02:44.000Z'));

    /* Le numéro du paquet, lui, est bien le même : c'est précisément pour ça
       qu'il ne peut pas servir de repère de déploiement à lui seul. */
    expect(apres.version).toBe(avant.version);
    expect(apres).not.toEqual(avant);
    expect(apres.demarre).not.toBe(avant.demarre);
  });

  it('reprend le commit que Coolify pose dans le conteneur, en court', () => {
    const id = identifiantVersion(
      { SOURCE_COMMIT: 'c03a3793281f595b6c1cb4423b466b8755e59f8b' } as NodeJS.ProcessEnv,
      new Date(),
    );
    expect(id.commit).toBe('c03a379');
  });

  it("sans SOURCE_COMMIT — développement local — reste lisible et ne tombe pas", () => {
    for (const env of [{}, { SOURCE_COMMIT: '' }, { SOURCE_COMMIT: '  ' }]) {
      const id = identifiantVersion(env as NodeJS.ProcessEnv, new Date());
      expect(id.commit).toBeNull();
      expect(id.version).toBe(VERSION);
      expect(() => new Date(id.demarre).toISOString()).not.toThrow();
    }
  });
});
