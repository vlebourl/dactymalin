import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { nomDeLettre } from '../src/core/nomDeLettre';
import { LENTEUR_DICTEE } from '../server/src/lib/voix';

/* Même moteur, modèle et débit que `/api/voix/mot`. La liste couvre tous les
   caractères que nomDeLettre peut nommer : ASCII, signes, et lettres Unicode
   composées d'une lettre latine et d'un seul accent pris en charge. */
const signes = [' ', '.', ',', ';', ':', '!', '?', "'", '’', '-', '"', '(', ')'];
const candidats = [
  ...'abcdefghijklmnopqrstuvwxyz0123456789',
  ...signes,
  ...[...'abcdefghijklmnopqrstuvwxyz'].flatMap((base) =>
    ['̀', '́', '̂', '̈', '̧'].map((accent) => `${base}${accent}`.normalize('NFC')),
  ),
];
const noms = [...new Set(candidats.map(nomDeLettre).filter((nom): nom is string => nom !== null))].sort();

const bin = process.env.PIPER_BIN;
const modele = process.env.PIPER_MODELE;
if (!bin || !modele) throw new Error('PIPER_BIN et PIPER_MODELE sont requis pour générer les lettres.');

const racine = process.cwd();
const dossier = join(racine, 'public/voix/lettres');
await mkdir(join(racine, 'public/voix'), { recursive: true });
const brouillon = await mkdtemp(join(racine, 'public/voix/.lettres-'));
const catalogue: Record<string, string> = {};

try {
  for (const nom of noms) {
    /* La phrase et la lenteur reproduisent exactement creerSynthese. */
    const phrase = /[.!?…]$/.test(nom) ? nom : `${nom}.`;
    const cle = createHash('sha256').update(`${LENTEUR_DICTEE}|${phrase}`).digest('hex');
    const fichier = `${cle}.wav`;
    const chemin = join(brouillon, fichier);
    const code = await new Promise<number | null>((resolve, reject) => {
      const piper = spawn(bin, ['--model', modele, '--length_scale', String(LENTEUR_DICTEE), '--output_file', chemin],
        { stdio: ['pipe', 'ignore', 'ignore'] });
      piper.on('error', reject);
      piper.on('close', resolve);
      piper.stdin.end(`${phrase}\n`);
    });
    if (code !== 0 || (await readFile(chemin)).subarray(0, 4).toString() !== 'RIFF') {
      throw new Error(`Piper a échoué pour « ${nom} » (code ${code}).`);
    }
    catalogue[nom] = `/voix/lettres/${fichier}`;
  }

  /* Publier seulement une série complète. Le manifeste est écrit en dernier :
     un build interrompu ne peut pas référencer un fichier absent. */
  await rm(dossier, { recursive: true, force: true });
  await rename(brouillon, dossier);
  await writeFile(join(racine, 'src/data/voix-lettres.json'), `${JSON.stringify(catalogue, null, 2)}\n`);
  const fichiers = await readdir(dossier);
  const taille = (await Promise.all(fichiers.map((f) => readFile(join(dossier, f))))).reduce((s, b) => s + b.length, 0);
  console.log(`${fichiers.length} sons Piper, ${taille} octets (${(taille / 1048576).toFixed(2)} Mio).`);
} finally {
  await rm(brouillon, { recursive: true, force: true });
}
