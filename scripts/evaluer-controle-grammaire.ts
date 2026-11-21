import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  PROMPT_CONTROLE,
  controleAccepte,
  SCHEMA_CONTROLE,
  demanderAvecAnthropic,
} from '../server/src/lib/grammaire';

/* Évalue l'appel de contrôle seul sur les phrases acceptées du spike.
   `--sec` : analyse à blanc des fichiers, sans appel à l'API. */

type Attendu = 'passe' | 'present' | 'futur';
type Cas = { attendu: Attendu; phrase: string };

const DOSSIER = join(
  process.cwd(),
  'docs/superpowers/specs/2026-11-21-mode-grammaire-spike',
);
const ATTENDU_DU_TEMPS: Record<string, Attendu> = {
  passé: 'passe',
  imparfait: 'passe',
  présent: 'present',
  futur: 'futur',
};
// Artefacts de raisonnement du modèle qui ont pollué resultats2.tsv.
const POLLUTION = /\bWait\b|Correct version/;

const lignes = async (fichier: string) =>
  (await readFile(join(DOSSIER, fichier), 'utf8'))
    .split('\n')
    .filter((l) => l.trim() !== '');

const ignorees: string[] = [];

/** Format `temps<TAB>triplet<TAB>[in,out]<TAB>phrase` (resultats2, resultats3, resultats-imparfait). */
async function lireParTemps(fichier: string): Promise<Cas[]> {
  const cas: Cas[] = [];
  for (const ligne of await lignes(fichier)) {
    const champs = ligne.split('\t');
    const attendu = ATTENDU_DU_TEMPS[champs[0]];
    const phrase = champs[3];
    if (!attendu || !phrase || POLLUTION.test(phrase)) {
      ignorees.push(`${fichier} : ${ligne.slice(0, 60)}`);
      continue;
    }
    cas.push({ attendu, phrase });
  }
  return cas;
}

/* resultats4.tsv : `REJET<TAB>raison<TAB>triplet<TAB>phrase`. Le temps visé n'est
   pas enregistré : la boucle a produit 10 phrases × 3 essais au passé composé
   (lignes 1-30), puis au présent (31-60), puis au futur (61-90). On le déduit
   donc du rang de la ligne. Les lignes à raison non vide sont rejetées. */
async function lireResultats4(): Promise<Cas[]> {
  const toutes = await lignes('resultats4.tsv');
  if (toutes.length !== 90) throw new Error(`resultats4.tsv : ${toutes.length} lignes au lieu de 90`);
  const cas: Cas[] = [];
  toutes.forEach((ligne, i) => {
    const champs = ligne.split('\t');
    if (champs[1] !== '') {
      ignorees.push(`resultats4.tsv : ${champs[1]}`);
      return;
    }
    cas.push({ attendu: (['passe', 'present', 'futur'] as const)[Math.floor(i / 30)], phrase: champs[3] });
  });
  return cas;
}

const cas = [
  ...(await lireParTemps('resultats2.tsv')),
  ...(await lireParTemps('resultats3.tsv')),
  ...(await lireResultats4()),
  ...(await lireParTemps('resultats-imparfait.tsv')),
];

if (process.argv.includes('--sec')) {
  for (const a of ['passe', 'present', 'futur'] as const) {
    console.log(`${a} : ${cas.filter((c) => c.attendu === a).length}`);
  }
  console.log(`total : ${cas.length}, ignorées : ${ignorees.length}`);
  ignorees.forEach((l) => console.log(`  ignorée — ${l}`));
  process.exit(0);
}

/* Variable locale de CE script d'évaluation hors ligne, pas une configuration de l'application (la clé y est par compte). */
const cle = process.env.ANTHROPIC_API_KEY;
if (!cle) {
  console.error('ANTHROPIC_API_KEY manquante.');
  process.exit(2);
}
const demander = demanderAvecAnthropic(cle);

const MIXTE = 'Mon grand-père dessinera un volcan qui crache des étoiles orange.';
let accords = 0;
let erreurs = 0;
const desaccords: string[] = [];
let verdictMixte = 'phrase absente des données';

// Un par un : pas de rafale vers l'API.
for (const { attendu, phrase } of cas) {
  const rep = await demander(PROMPT_CONTROLE, phrase, SCHEMA_CONTROLE);
  const accord = controleAccepte(phrase, rep, attendu);
  const liste = Array.isArray((rep as { verbes?: unknown } | null)?.verbes)
    ? (rep as { verbes: { verbe: string; categorie: string }[] }).verbes
        .map((v) => `${v?.verbe}:${v?.categorie}`)
        .join(', ')
    : '';
  if (phrase === MIXTE) {
    verdictMixte = `${attendu} attendu → ${accord ? 'accepté' : 'refusé'} [${liste}]`;
  }
  if (accord) accords++;
  else if (rep === null) erreurs++;
  else desaccords.push(`${attendu} → [${liste}] : ${phrase}`);
}

console.log(`accords : ${accords}/${cas.length}`);
console.log(`erreurs d'API (réponses nulles) : ${erreurs}`);
console.log(`désaccords : ${desaccords.length}`);
desaccords.forEach((d) => console.log(d));
console.log(`\nPhrase mixte « ${MIXTE} » : ${verdictMixte}`);
