import type { IdDisposition } from './layouts';
import { chiffresDisponibles, motsDisponibles, syllabesDisponibles } from './corpus';
import { ensembleTouches, nouvellesTouches } from './paliers';

export type GenreItem = 'mot' | 'nombre' | 'syllabe';

export type Item = {
  texte: string;
  genre: GenreItem;
};

export const TAILLE_BLOC_MIN = 8;
export const TAILLE_BLOC_MAX = 12;
/** Plancher de nombres par bloc quand la disposition ouvre des chiffres. */
export const QUOTA_NOMBRES = 2;
/** Positions fixes des nombres imposés (3ᵉ et 7ᵉ item). */
const POSITIONS_NOMBRES = [2, 6];

/** PRNG déterministe (mulberry32) — un bloc est reproductible dans les tests. */
export function alea(graine: number): () => number {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function melange<T>(liste: T[], rnd: () => number): T[] {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

/** Nombres de 1 à 3 chiffres composés uniquement de chiffres ouverts. */
function nombresDisponibles(id: IdDisposition, palier: number): string[] {
  const chiffres = chiffresDisponibles(id, palier);
  if (chiffres.length === 0) return [];
  const sortie: string[] = [...chiffres];
  for (const a of chiffres) {
    if (a === '0') continue;
    for (const b of chiffres) {
      sortie.push(a + b);
      for (const c of chiffres) sortie.push(a + b + c);
    }
  }
  return sortie;
}

export type OptionsBloc = {
  id: IdDisposition;
  palier: number;
  /** items ayant atteint le barreau 2 ou 3 dans les blocs précédents */
  aReinjecter?: string[];
  taille?: number;
  graine?: number;
};

/**
 * Compose un bloc de 8 à 12 items.
 * Ordre de préférence strict (P5) : vrai mot > nombre > syllabe.
 * Aucun item ne contient un caractère hors de l'ensemble déclaré du palier.
 */
export function composerBloc(o: OptionsBloc): Item[] {
  const rnd = alea(o.graine ?? Math.floor(Math.random() * 2 ** 31));
  const taille = Math.min(
    TAILLE_BLOC_MAX,
    Math.max(TAILLE_BLOC_MIN, o.taille ?? TAILLE_BLOC_MIN + Math.floor(rnd() * 5)),
  );
  const ensemble = ensembleTouches(o.id, o.palier);
  const nouvelles = nouvellesTouches(o.id, o.palier).filter((c) => c !== ' ');

  const mots = motsDisponibles(o.id, o.palier);
  // majoritairement des touches du palier courant (cahier 4.3)
  const prioritaires = mots.filter((m) => nouvelles.some((c) => m.includes(c)));
  const autres = mots.filter((m) => !prioritaires.includes(m));

  const items: Item[] = [];
  const vus = new Set<string>();
  const pousser = (texte: string, genre: GenreItem) => {
    if (vus.has(texte) || items.length >= taille) return;
    vus.add(texte);
    items.push({ texte, genre });
  };

  // 1. réinjection des items aidés, comme contenu ordinaire
  for (const texte of melange(o.aReinjecter ?? [], rnd).slice(0, Math.floor(taille / 3))) {
    if ([...texte].every((c) => ensemble.has(c))) pousser(texte, /^[0-9]+$/.test(texte) ? 'nombre' : 'mot');
  }
  // 2. vrais mots du palier courant
  for (const m of melange(prioritaires, rnd)) pousser(m, 'mot');
  // 3. vrais mots des paliers précédents
  for (const m of melange(autres, rnd)) pousser(m, 'mot');
  // 4. nombres, là où les chiffres sont ouverts
  const nombres = melange(nombresDisponibles(o.id, o.palier), rnd);
  for (const n of nombres) pousser(n, 'nombre');
  // 5. syllabes, dernier recours, étiquetées à l'affichage
  for (const s of melange(syllabesDisponibles(o.id, o.palier), rnd)) pousser(s, 'syllabe');

  // Un bloc est intercalé pour ne pas enchaîner cinq mots qui commencent pareil.
  const bloc = melange(items, rnd);

  /* Plancher de nombres : quand la disposition ouvre des chiffres au palier
     courant, la préférence « vrai mot > nombre » les évinçait toujours — CH-FR
     annonçait des nombres dès la leçon 1 et n'en proposait jamais un seul. */
  const manque = nombres.length === 0 ? 0 : QUOTA_NOMBRES - bloc.filter((i) => i.genre === 'nombre').length;
  for (let k = 0; k < manque; k++) {
    const texte = nombres.find((n) => !vus.has(n));
    if (!texte) break;
    vus.add(texte);
    bloc.splice(POSITIONS_NOMBRES[k] ?? bloc.length, 0, { texte, genre: 'nombre' });
  }
  bloc.length = Math.min(bloc.length, taille);
  return bloc;
}

/**
 * Main sollicitée par l'espace : le pouce de la main OPPOSÉE à la lettre
 * précédente (P8). Sans lettre précédente, on part de la gauche.
 */
export function pouceDeLEspace(mainPrecedente: 'gauche' | 'droite' | undefined): 'gauche' | 'droite' {
  return mainPrecedente === 'gauche' ? 'droite' : 'gauche';
}
