import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { readFile, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

/**
 * La voix de la dictée, synthétisée PAR LE SERVEUR (#124) : Piper, embarqué
 * dans l'image de production. Même voix sur tous les appareils de la maison,
 * et un débit lent produit par le moteur — le navigateur, lui, ralentit en
 * étirant le son.
 *
 * Piper n'existe QUE dans l'image : en développement, en CI et dans les tests,
 * `creerSynthese` rend `null`, la route répond 503 et le client retombe sur la
 * voix du navigateur. Rien d'autre n'a besoin de savoir que Piper existe.
 */

/**
 * Lenteur de la diction (`--length_scale`) : 1 = débit naturel de la voix, plus
 * grand = plus lent. À régler À L'OREILLE, sur de vrais mots de dictée.
 */
export const LENTEUR_DICTEE = 1.35;

/** Un mot isolé se synthétise en ~200 ms ; au-delà, Piper est bloqué. */
const DELAI_MAX_MS = 20_000;

export type Synthese = (mot: string) => Promise<Buffer | null>;

type EnvVoix = { PIPER_BIN?: string; PIPER_MODELE?: string };

export function creerSynthese(env: EnvVoix, racineCache = tmpdir()): Synthese | null {
  const { PIPER_BIN: bin, PIPER_MODELE: modele } = env;
  if (!bin || !modele || !existsSync(bin) || !existsSync(modele)) return null;

  /* ponytail: cache sur le disque du CONTENEUR — il repart vide à chaque
     déploiement, et chaque mot se resynthétise une fois (~200 ms). Une table
     en base le rendrait durable, au prix d'une migration ; à faire si les
     listes grossissent ou si le CPU de l'hôte peine. La voix et la lenteur
     sont DANS le chemin : changer l'une ou l'autre ne ressert aucun vieux son. */
  const dossier = join(racineCache, `voix-${basename(modele)}-${LENTEUR_DICTEE}`);
  mkdirSync(dossier, { recursive: true });

  /* UNE synthèse à la fois : Piper prend un cœur entier, et une liste de
     trente mots préchauffée d'un coup ne doit pas affamer le serveur qui sert
     les leçons. `enCours` fait partager la même synthèse à deux demandes
     simultanées du même mot. */
  let file: Promise<unknown> = Promise.resolve();
  const enCours = new Map<string, Promise<Buffer | null>>();

  const synthetiser = async (phrase: string, chemin: string): Promise<Buffer | null> => {
    const brouillon = `${chemin}.${process.pid}.tmp`;
    const reussi = await new Promise<boolean>((resoudre) => {
      const piper = spawn(
        bin,
        ['--model', modele, '--length_scale', String(LENTEUR_DICTEE), '--output_file', brouillon],
        { stdio: ['pipe', 'ignore', 'ignore'] },
      );
      const garde = setTimeout(() => piper.kill('SIGKILL'), DELAI_MAX_MS);
      piper.on('error', () => resoudre(false));
      piper.on('close', (code) => {
        clearTimeout(garde);
        resoudre(code === 0);
      });
      piper.stdin.on('error', () => {});
      piper.stdin.end(`${phrase}\n`);
    });
    if (!reussi) {
      await rm(brouillon, { force: true });
      return null;
    }
    // Renommage atomique : un fichier à moitié écrit n'est jamais servi.
    await rename(brouillon, chemin);
    return readFile(chemin);
  };

  return (mot) => {
    /* Piper lit UNE phrase par ligne : un retour à la ligne dans le mot en
       ferait deux énoncés. Le point final pose la voix — un mot nu est dit
       avec l'intonation d'une phrase coupée. */
    const phrase = `${mot.replace(/\s+/g, ' ').trim()}.`;
    const chemin = join(dossier, `${createHash('sha256').update(phrase).digest('hex')}.wav`);

    const deja = enCours.get(chemin);
    if (deja) return deja;

    const promesse = (async () => {
      const garde = await readFile(chemin).catch(() => null);
      if (garde) return garde;
      const tour = file.then(() => synthetiser(phrase, chemin));
      file = tour.catch(() => {});
      return tour.catch(() => null);
    })().finally(() => enCours.delete(chemin));
    enCours.set(chemin, promesse);
    return promesse;
  };
}
