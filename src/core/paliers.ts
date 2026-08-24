import type { IdDisposition } from './layouts';

export type Palier = {
  numero: number;
  /** Nommé par ce qu'il ouvre, jamais par une rangée de clavier (cahier V6). */
  titre: string;
  promesse: string;
  /** nouvelles touches, par disposition */
  nouvelles: Record<IdDisposition, string[]>;
  verrouille?: boolean;
};

const l = (s: string) => s.split(' ').filter(Boolean);

export const PALIERS: Palier[] = [
  {
    numero: 1,
    titre: 'Tes deux index et tes deux pouces',
    promesse: 'Tu écris tes premiers mots.',
    nouvelles: { 'fr-FR': [...l('e f j n s t u'), ' '], 'fr-CH': [...l('e f j n s t u 4 5 6 7'), ' '] },
  },
  {
    numero: 2,
    titre: 'Les voyelles qui manquaient',
    promesse: 'Tu écris vrai, train, fruit.',
    nouvelles: { 'fr-FR': l('a i r v'), 'fr-CH': l('a i r v 2 3 8 9') },
  },
  {
    numero: 3,
    titre: 'Les mots de tous les jours',
    promesse: 'Tu écris maison, soleil, lundi.',
    nouvelles: { 'fr-FR': l('o l d b m'), 'fr-CH': l('o l d b m 1 0') },
  },
  {
    numero: 4,
    titre: 'Les animaux et le chocolat',
    promesse: 'Tu écris chat, cheval, chocolat.',
    nouvelles: { 'fr-FR': l('g h p c'), 'fr-CH': l('g h p c') },
  },
  {
    numero: 5,
    titre: 'Les accents',
    promesse: 'Tu écris école, très, bébé.',
    nouvelles: { 'fr-FR': l('é è à ç'), 'fr-CH': l('é è à') },
  },
  {
    numero: 6,
    titre: 'Les lettres rares',
    promesse: 'Tu écris quatre, zèbre, taxi.',
    nouvelles: { 'fr-FR': l('q w x y z ù'), 'fr-CH': l('q w x y z') },
  },
  {
    numero: 7,
    titre: 'Ton petit doigt tient la touche Majuscule',
    promesse: 'Tu écris les nombres et les majuscules.',
    nouvelles: { 'fr-FR': l('. 0 1 2 3 4 5 6 7 8 9'), 'fr-CH': l('ç') },
  },
  {
    numero: 8,
    titre: 'Les majeurs viennent aider tes index',
    promesse: 'Tes majeurs prennent leur colonne.',
    nouvelles: { 'fr-FR': [], 'fr-CH': [] },
    verrouille: true,
  },
  {
    numero: 9,
    titre: 'Les annulaires',
    promesse: 'Tes annulaires prennent leur colonne.',
    nouvelles: { 'fr-FR': [], 'fr-CH': [] },
    verrouille: true,
  },
  {
    numero: 10,
    titre: 'Les auriculaires prennent leurs lettres',
    promesse: 'Tes petits doigts ne tiennent plus seulement Majuscule.',
    nouvelles: { 'fr-FR': [], 'fr-CH': [] },
    verrouille: true,
  },
];

/** Dernier palier réellement jouable dans le MVP. */
export const PALIER_MAX = 7;
/** Dernier palier du sas « quatre doigts », sans aucun modificateur (P2). */
export const PALIER_MAX_DEBUTANT = 6;

export function palier(numero: number): Palier {
  const p = PALIERS.find((x) => x.numero === numero);
  if (!p) throw new Error(`Palier inconnu : ${numero}`);
  return p;
}

/** Nouvelles touches introduites par ce palier, pour cette disposition. */
export function nouvellesTouches(id: IdDisposition, numero: number): string[] {
  return palier(numero).nouvelles[id];
}

/** Ensemble CUMULÉ des caractères ouverts jusqu'au palier `numero` inclus. */
export function ensembleTouches(id: IdDisposition, numero: number): Set<string> {
  const set = new Set<string>();
  for (const p of PALIERS) {
    if (p.numero > numero) break;
    for (const c of p.nouvelles[id]) set.add(c);
  }
  return set;
}

/** Touches du palier courant qui doivent être maîtrisées pour passer (espace exclu). */
export function touchesAValider(id: IdDisposition, numero: number): string[] {
  return nouvellesTouches(id, numero).filter((c) => c !== ' ');
}
