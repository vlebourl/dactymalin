import type { IdDisposition } from './layouts';
import { chiffresDisponibles, motsDisponibles, syllabesDisponibles } from './corpus';
import { ensembleTouches, PALIER_MAJUSCULES, touchesAValider } from './paliers';

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
/** Plancher de phrases à capitale + point, au palier qui enseigne Maj. */
export const QUOTA_PHRASES = 2;
const POSITIONS_PHRASES = [1, 5];
/**
 * Chaque touche à valider du palier doit apparaître au moins deux fois par
 * bloc : sans cette contrainte, `f` ne vivait que dans « fut » et le critère
 * de maîtrise (3 occurrences sur ≥ 2 blocs) était inatteignable — le palier
 * ne s'ouvrait plus que par le plafond anti-mur.
 */
export const COUVERTURE_MIN = 2;

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

/**
 * Palier de la touche Maj : elle sert à écrire des CAPITALES et le point,
 * pas seulement des chiffres. Un mot du corpus devient une phrase minuscule
 * — « Chat. » — dont la capitale déclenche le vrai piège Maj contralatéral.
 */
function phrasesDisponibles(id: IdDisposition, palier: number): string[] {
  if (palier < PALIER_MAJUSCULES) return [];
  const ensemble = ensembleTouches(id, palier);
  return motsDisponibles(id, palier)
    .filter((m) => !m.includes(' ') && m.length >= 3 && m.length <= 8)
    .map((m) => m[0].toUpperCase() + m.slice(1) + '.')
    .filter((p) => [...p].every((c) => ensemble.has(c)));
}

/** Tout ce qui est typable au palier, dans l'ordre de préférence P5. */
function vivierDisponible(id: IdDisposition, palier: number): Item[] {
  return [
    ...motsDisponibles(id, palier).map((texte) => ({ texte, genre: 'mot' as const })),
    ...phrasesDisponibles(id, palier).map((texte) => ({ texte, genre: 'mot' as const })),
    ...nombresDisponibles(id, palier).map((texte) => ({ texte, genre: 'nombre' as const })),
    ...syllabesDisponibles(id, palier).map((texte) => ({ texte, genre: 'syllabe' as const })),
  ];
}

/**
 * Objectif de couverture réellement TENABLE, touche par touche. `ù` ne vit que
 * dans « où » dans tout le français du lexique 7-12 ans : lui exiger deux
 * occurrences par bloc obligerait à inventer des pseudo-mots, ce que le cahier
 * interdit. On vise donc `COUVERTURE_MIN`, ou l'offre du corpus si elle est
 * plus maigre.
 */
export function couvertureCible(id: IdDisposition, palier: number): Map<string, number> {
  const vivier = vivierDisponible(id, palier);
  return new Map(
    touchesAValider(id, palier).map((c) => {
      const offre = vivier.reduce(
        (n, it) => n + [...it.texte.toLowerCase()].filter((x) => x === c).length,
        0,
      );
      return [c, Math.min(COUVERTURE_MIN, offre)];
    }),
  );
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
  const nouvelles = touchesAValider(o.id, o.palier);

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

  const nombres = melange(nombresDisponibles(o.id, o.palier), rnd);
  const phrases = melange(phrasesDisponibles(o.id, o.palier), rnd);
  const syllabes = melange(syllabesDisponibles(o.id, o.palier), rnd);

  // 1. réinjection des items aidés, comme contenu ordinaire
  for (const texte of melange(o.aReinjecter ?? [], rnd).slice(0, Math.floor(taille / 3))) {
    if ([...texte].every((c) => ensemble.has(c))) pousser(texte, /^[0-9]+$/.test(texte) ? 'nombre' : 'mot');
  }

  /* 2. COUVERTURE des touches du palier. Glouton : on prend d'abord l'item qui
     comble le plus de manques, en gardant la préférence P5 (mot > phrase >
     nombre > syllabe) sur les égalités, puisque le premier trouvé l'emporte. */
  const besoins = couvertureCible(o.id, o.palier);
  const consommer = (texte: string) => {
    for (const c of texte) {
      const reste = besoins.get(c.toLowerCase());
      if (reste) besoins.set(c.toLowerCase(), reste - 1);
    }
  };
  /* Voir plus bas : `initial` fige l'objectif pour distinguer une touche
     JAMAIS vue dans ce bloc d'une touche déjà entamée. Couvrir chaque touche
     une première fois prime sur doubler les autres — sinon, au palier 7
     (11 touches d'un coup), un bloc de 8 items peut ne jamais servir un
     chiffre. */
  let initial = new Map<string, number>();
  const apport = (texte: string) => {
    let premieres = 0;
    let suite = 0;
    for (const c of new Set([...texte.toLowerCase()])) {
      const b = besoins.get(c) ?? 0;
      if (b <= 0) continue;
      if (b === initial.get(c)) premieres++;
      suite += Math.min([...texte.toLowerCase()].filter((x) => x === c).length, b);
    }
    return premieres * 100 + suite;
  };
  const vivier: Item[] = [
    ...melange(prioritaires, rnd).map((texte) => ({ texte, genre: 'mot' as const })),
    ...phrases.map((texte) => ({ texte, genre: 'mot' as const })),
    ...nombres.map((texte) => ({ texte, genre: 'nombre' as const })),
    ...syllabes.map((texte) => ({ texte, genre: 'syllabe' as const })),
  ];
  for (const item of items) consommer(item.texte);
  initial = new Map(besoins);
  while (items.length < taille && [...besoins.values()].some((n) => n > 0)) {
    let meilleur: Item | undefined;
    let score = 0;
    for (const c of vivier) {
      if (vus.has(c.texte)) continue;
      const s = apport(c.texte);
      if (s > score) [score, meilleur] = [s, c];
    }
    if (!meilleur) break; // le corpus ne peut pas couvrir mieux : on n'invente rien
    pousser(meilleur.texte, meilleur.genre);
    consommer(meilleur.texte);
  }

  // 3. vrais mots du palier courant
  for (const m of melange(prioritaires, rnd)) pousser(m, 'mot');
  // 4. phrases à capitale, au palier de la touche Maj
  for (const p of phrases) pousser(p, 'mot');
  // 5. vrais mots des paliers précédents
  for (const m of melange(autres, rnd)) pousser(m, 'mot');
  // 6. nombres, là où les chiffres sont ouverts
  for (const n of nombres) pousser(n, 'nombre');
  // 7. syllabes, dernier recours, étiquetées à l'affichage
  for (const s of syllabes) pousser(s, 'syllabe');

  // Un bloc est intercalé pour ne pas enchaîner cinq mots qui commencent pareil.
  const bloc = melange(items, rnd);

  /* Plancher de nombres : quand la disposition ouvre des chiffres au palier
     courant, la préférence « vrai mot > nombre » les évinçait toujours — CH-FR
     annonçait des nombres dès la leçon 1 et n'en proposait jamais un seul. */
  const imposer = (
    source: string[],
    quota: number,
    genre: GenreItem,
    positions: number[],
    deja: number,
  ) => {
    const manque = source.length === 0 ? 0 : quota - deja;
    for (let k = 0; k < manque; k++) {
      const texte = source.find((n) => !vus.has(n));
      if (!texte) break;
      vus.add(texte);
      bloc.splice(positions[k] ?? bloc.length, 0, { texte, genre });
    }
  };
  imposer(nombres, QUOTA_NOMBRES, 'nombre', POSITIONS_NOMBRES, bloc.filter((i) => i.genre === 'nombre').length);
  /* Le palier 7 promet « les nombres ET les majuscules » (V6) : sans ce
     plancher, la préférence « vrai mot » n'y servait que des chiffres. */
  imposer(phrases, QUOTA_PHRASES, 'mot', POSITIONS_PHRASES, bloc.filter((i) => /[A-Z]/.test(i.texte)).length);
  /* Les planchers ci-dessus peuvent dépasser la taille : on retaille par la
     FIN, mais jamais sur un item qui porte à lui seul la couverture d'une
     touche du palier — sinon le plancher de couverture se reperdrait ici.
     ponytail: balayage O(n²) sur 12 items, inutile d'indexer. */
  while (bloc.length > taille) {
    const compte = new Map<string, number>();
    for (const it of bloc) {
      for (const c of it.texte) {
        const k = c.toLowerCase();
        if (besoins.has(k)) compte.set(k, (compte.get(k) ?? 0) + 1);
      }
    }
    /* Un item peut porter PLUSIEURS occurrences d'une même touche
       (« papillon » : deux p) : le retirer doit laisser la couverture au
       plancher, occurrences comptées, pas items comptés. */
    const porteur = (it: Item) =>
      [...new Set([...it.texte.toLowerCase()])].some((c) => {
        const total = compte.get(c);
        if (total === undefined) return false;
        const occ = [...it.texte.toLowerCase()].filter((x) => x === c).length;
        return total - occ < COUVERTURE_MIN;
      });
    let k = bloc.length - 1;
    for (let i = bloc.length - 1; i >= 0; i--) {
      if (!porteur(bloc[i])) {
        k = i;
        break;
      }
    }
    bloc.splice(k, 1);
  }
  return bloc;
}

/**
 * Main sollicitée par l'espace : le pouce de la main OPPOSÉE à la lettre
 * précédente (P8). Sans lettre précédente, on part de la gauche.
 */
export function pouceDeLEspace(mainPrecedente: 'gauche' | 'droite' | undefined): 'gauche' | 'droite' {
  return mainPrecedente === 'gauche' ? 'droite' : 'gauche';
}
