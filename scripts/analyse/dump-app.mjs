/**
 * Extrait de l'app la table des touches réellement PROPOSABLES par
 * disposition, vers un JSON, pour que la chaîne de contenu porte sur la vérité
 * du code et non sur une recopie du cahier.
 *
 * `layouts.ts` ne dépend d'aucun autre module : Node >= 23 le charge tel quel
 * en strippant les types. Le chemin est résolu depuis ce fichier et non depuis
 * le dossier courant, pour que le script marche d'où qu'on l'appelle.
 *
 *   node scripts/analyse/dump-app.mjs > /tmp/dactylo-data/app.json
 */
import { fileURLToPath } from 'node:url';

const layouts = await import(
  fileURLToPath(new URL('../../src/core/layouts.ts', import.meta.url))
);

/* Un verdict PAR POSITION, comme `layouts.ts` : la base et la Maj d'une même
   touche ne sont pas proposables ensemble — le `!` suisse vit sous Maj d'une
   touche dont la base est morte (#98). */
const PROPOSABLE = { base: layouts.estProposable, maj: layouts.estProposableEnMaj };

const proposables = (id, champ) =>
  layouts
    .touches(id)
    .filter((t) => PROPOSABLE[champ](t) && t[champ])
    .map((t) => ({ car: t[champ], main: t.main, code: t.code }));

const out = { dispositions: {} };
for (const id of ['fr-FR', 'fr-CH']) {
  out.dispositions[id] = {
    directes: proposables(id, 'base'),
    majOnly: proposables(id, 'maj'),
  };
}
process.stdout.write(JSON.stringify(out, null, 1));
