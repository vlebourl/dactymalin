/**
 * Extrait les données réelles de l'app (paliers, ensembles de touches, corpus)
 * vers un JSON, pour que l'analyse de rendement lexical porte sur la vérité du
 * code et non sur une recopie du cahier.
 *
 * Le dépôt n'a pas de node_modules ; on copie les modules concernés dans un
 * dossier temporaire, on suffixe les specifiers en `.ts` et on laisse Node
 * strip-per les types (Node >= 23).
 *
 *   node scripts/analyse/dump-app.mjs > /tmp/app.json
 */
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'dactylo-'));
for (const f of ['paliers.ts', 'corpus.ts', 'layouts.ts']) {
  const src = readFileSync(join('src/core', f), 'utf8')
    .replace(/from '\.\/(\w+)'/g, "from './$1.ts'");
  writeFileSync(join(dir, f), src);
}

const paliers = await import(join(dir, 'paliers.ts'));
const corpus = await import(join(dir, 'corpus.ts'));
const layouts = await import(join(dir, 'layouts.ts'));

const out = { dispositions: {} };
for (const id of ['fr-FR', 'fr-CH']) {
  const directes = layouts
    .touches(id)
    .filter((t) => layouts.estProposable(t) && t.base)
    .map((t) => ({ car: t.base, main: t.main, code: t.code }));
  const majOnly = layouts
    .touches(id)
    .filter((t) => layouts.estProposable(t) && t.maj)
    .map((t) => ({ car: t.maj, main: t.main, code: t.code }));
  out.dispositions[id] = {
    directes,
    majOnly,
    paliers: paliers.PALIERS.filter((p) => p.numero <= 7).map((p) => ({
      numero: p.numero,
      nouvelles: p.nouvelles[id],
      ensemble: [...paliers.ensembleTouches(id, p.numero)],
      motsDisponibles: corpus.motsDisponibles(id, p.numero),
      motsNouveaux: corpus.motsNouveaux(id, p.numero),
    })),
  };
}
out.corpus = corpus.CORPUS;
out.syllabes = corpus.SYLLABES;
process.stdout.write(JSON.stringify(out, null, 1));
