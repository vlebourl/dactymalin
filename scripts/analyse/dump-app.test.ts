/**
 * Non-régression de la chaîne de contenu : `dump-app.mjs` a passé des mois
 * cassé parce qu'il importait des modules supprimés du dépôt, et rien ne le
 * disait — les scripts d'analyse ne tournent pas en CI. Ce test rejoue le
 * premier maillon et le confronte à la source, pour qu'un renommage dans
 * `src/core` casse un test plutôt qu'une régénération six mois plus tard.
 *
 * Le rejeu COMPLET (lexique + parcours) exige les données Dubois-Buyse et
 * Lexique 3.83, hors dépôt : il vit dans `verifier-rejeu.sh`.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  estProposable,
  estProposableEnMaj,
  touches,
  type IdDisposition,
} from '../../src/core/layouts.ts';

const script = fileURLToPath(new URL('./dump-app.mjs', import.meta.url));
const app = JSON.parse(execFileSync('node', [script], { encoding: 'utf8' }));

describe('dump-app.mjs', () => {
  it('sert les deux dispositions', () => {
    expect(Object.keys(app.dispositions).sort()).toEqual(['fr-CH', 'fr-FR']);
  });

  for (const id of ['fr-FR', 'fr-CH'] as IdDisposition[]) {
    it(`${id} : la table dumpée est bien celle de layouts.ts`, () => {
      // Un verdict par POSITION : la base et la Maj d'une même touche ne se
      // jugent pas ensemble (#98, le `!` suisse sous une base morte).
      const proposable = { base: estProposable, maj: estProposableEnMaj };
      const attendu = (champ: 'base' | 'maj') =>
        touches(id)
          .filter((t) => proposable[champ](t) && t[champ])
          .map((t) => ({ car: t[champ], main: t.main, code: t.code }));
      expect(app.dispositions[id].directes).toEqual(attendu('base'));
      expect(app.dispositions[id].majOnly).toEqual(attendu('maj'));
      // Une table vide passerait les égalités ci-dessus si `estProposable`
      // devenait faux partout : on ancre l'ordre de grandeur.
      expect(app.dispositions[id].directes.length).toBeGreaterThan(30);
      expect(app.dispositions[id].majOnly.length).toBeGreaterThan(10);
    });
  }

  /* C'est PAR ICI que l'étape 9 reçoit sa ponctuation : si le `!` disparaît du
     dump, il disparaît du parcours suisse sans qu'aucun test de `src/` bronche
     — c'est exactement ce qui est arrivé (#98). */
  it('la chaîne reçoit le ! suisse sous Maj, et aucun caractère mort', () => {
    const car = (id: IdDisposition, champ: 'directes' | 'majOnly') =>
      app.dispositions[id][champ].map((t: { car: string }) => t.car);
    expect(car('fr-CH', 'majOnly')).toContain('!');
    expect(car('fr-CH', 'directes')).not.toContain('¨');
    for (const mort of ['^', '`', '¨']) {
      expect(car('fr-CH', 'directes')).not.toContain(mort);
      expect(car('fr-CH', 'majOnly')).not.toContain(mort);
      expect(car('fr-FR', 'directes')).not.toContain(mort);
      expect(car('fr-FR', 'majOnly')).not.toContain(mort);
    }
  });
});
