import { describe, expect, it } from 'vitest';
import { ENCOURAGEMENTS, encouragementSuivant } from './encouragements';

/**
 * Deux des dix-huit formulations disaient encore « bloc » — le mot que la v2 a
 * retiré du vocabulaire de l'enfant (cahier l. 1424). Un enfant qui vient de
 * lire « Leçon 3 sur 7 » dans l'en-tête ne sait pas ce qu'est un bloc, et la
 * contradiction lui est adressée au moment précis où on le félicite.
 */
describe('les encouragements de fin de leçon', () => {
  it("n'emploient jamais le mot « bloc »", () => {
    const fautifs = ENCOURAGEMENTS.filter((e) => /\bblocs?\b/i.test(e));
    expect(fautifs, `encouragements qui disent « bloc » : ${fautifs.join(' | ')}`).toEqual([]);
  });

  /* Réécrire ne doit pas appauvrir : le cahier exige au moins quinze
     formulations distinctes, le code en tenait dix-huit. */
  it('restent au moins dix-huit, tous distincts', () => {
    expect(ENCOURAGEMENTS.length).toBeGreaterThanOrEqual(18);
    expect(new Set(ENCOURAGEMENTS).size).toBe(ENCOURAGEMENTS.length);
  });

  it('ne répètent jamais celui qui vient d\'être lu', () => {
    for (const precedent of ENCOURAGEMENTS) {
      for (let i = 0; i < 40; i++) {
        expect(encouragementSuivant(precedent, i / 40)).not.toBe(precedent);
      }
    }
  });
});
