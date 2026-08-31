import type { IdDisposition } from './layouts';
import { groupesTypables, motsTypables, phrasesTypables } from './contenu';
import { toucheDe } from './layouts';
import { ensembleTouches, etape as etapeDe, nouvellesTouches, type IdParcours } from './parcours';
import { estMaitrisee, type Maitrise } from './progression';

/**
 * Les trois genres d'exercice, et rien d'autre : la syllabe de remplissage a
 * disparu du TYPE lui-même (#39), pas seulement des recours du générateur.
 * Une étape qui ne produit pas assez de contenu se refait, elle ne se comble
 * pas.
 */
export type GenreItem = 'mot' | 'nombre' | 'phrase';

/** L'ordre de préférence du cahier (P5), « visible et fixe » : vrai mot ou
    groupe nominal > nombre > phrase. */
export const ORDRE_PREFERENCE: GenreItem[] = ['mot', 'nombre', 'phrase'];

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
/**
 * Garde-fou §7.2 : « pas deux fois le même exercice dans une leçon, au moins
 * trois leçons d'écart entre deux occurrences ». L'appelant passe donc les
 * exercices des DEUX leçons précédentes dans `recemmentVus`.
 */
export const LECONS_SANS_REPETITION = 3;
/**
 * Ce que vaut une touche mal acquise dans le tirage, face à une touche acquise
 * (#39). Mesuré : environ +17 % d'occurrences pour la touche faible sur 40
 * leçons. Assez pour que la touche revienne vraiment, trop peu pour que la
 * leçon vire à la séance de rattrapage — l'enfant ne doit jamais sentir qu'on
 * l'a jugé, et rien ne le lui dit.
 */
export const POIDS_TOUCHE_FAIBLE = 5;

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

/**
 * Tirage pondéré sans remise (Efraimidis-Spirakis) : une clé `rnd^(1/poids)`
 * triée décroissante donne exactement une probabilité proportionnelle au poids
 * d'être servi en premier. Poids tous égaux ⇒ mélange uniforme, donc une
 * maîtrise vide ne change rien à ce que composait la version précédente.
 */
function melangePondere<T>(liste: T[], rnd: () => number, poids: (x: T) => number): T[] {
  return liste
    .map((x) => ({ x, cle: rnd() ** (1 / poids(x)) }))
    .sort((a, b) => b.cle - a.cle)
    .map((e) => e.x);
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
function nombresDisponibles(ensemble: Set<string>): string[] {
  const chiffres = '0123456789'.split('').filter((c) => ensemble.has(c));
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

/** Tout ce qui est typable avec cet ensemble, dans l'ordre de préférence P5 :
    vrai mot ou groupe nominal > nombre > phrase. */
export function vivierPrefere(ensemble: Set<string>): Item[] {
  return [
    ...motsTypables(ensemble).map((texte) => ({ texte, genre: 'mot' as const })),
    ...groupesTypables(ensemble).map((texte) => ({ texte, genre: 'mot' as const })),
    ...nombresDisponibles(ensemble).map((texte) => ({ texte, genre: 'nombre' as const })),
    ...phrasesTypables(ensemble).map((texte) => ({ texte, genre: 'phrase' as const })),
  ];
}

/**
 * Objectif de couverture réellement TENABLE, touche par touche. `ù` ne vit que
 * dans « où » dans tout le français du lexique 7-12 ans : lui exiger deux
 * occurrences par bloc obligerait à inventer des pseudo-mots, ce que le cahier
 * interdit. On vise donc `COUVERTURE_MIN`, ou l'offre du corpus si elle est
 * plus maigre.
 */
export function couvertureCible(
  parcours: IdParcours,
  id: IdDisposition,
  etape: number,
): Map<string, number> {
  const vivier = vivierPrefere(ensembleTouches(parcours, id, etape));
  return new Map(
    nouvellesTouches(parcours, id, etape).map((c) => {
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
  parcours: IdParcours;
  etape: number;
  /** items ayant atteint le barreau 2 ou 3 dans les blocs précédents */
  aReinjecter?: string[];
  /**
   * Proportion d'items justes du premier coup et sans aide, par touche (§4.4).
   * Elle ne commande plus aucun passage depuis #38 : elle PONDÈRE le tirage,
   * et rien d'autre. Absente ⇒ tirage uniforme.
   */
  maitrise?: Maitrise;
  /**
   * Les exercices des `LECONS_SANS_REPETITION - 1` leçons précédentes. Ils ne
   * ressortent pas — sauf si le corpus de l'étape ne peut pas remplir le bloc
   * autrement, auquel cas la leçon existe quand même : c'est l'étape qu'on
   * refait, pas la leçon qu'on ampute.
   */
  recemmentVus?: string[];
  taille?: number;
  graine?: number;
};

/**
 * Compose un bloc de 8 à 12 items.
 * Ordre de préférence strict (P5) : vrai mot ou groupe nominal > nombre >
 * phrase. Aucun item ne contient un caractère hors de l'ensemble de l'étape.
 */
/**
 * Le bloc d'une LISTE de la maison : les mots tels quels, sans filtre de
 * palier. Seule exigence : chaque caractère doit EXISTER sur la disposition,
 * sinon la touche cible n'existerait pas et la leçon se bloquerait.
 */
/** Vrai si CHAQUE caractère existe sur la disposition, Maj comprise. */
export function estEcrivable(texte: string, id: IdDisposition): boolean {
  return [...texte].every((c) => c === ' ' || !!toucheDe(id, c));
}

export function composerBlocDeListe(
  mots: string[],
  id: IdDisposition,
  graine?: number,
): Item[] {
  const rnd = alea(graine ?? Math.floor(Math.random() * 2 ** 31));
  /* Le seul critère est « le clavier peut l'écrire », pas « le parcours l'a
     enseigné ». Une liste de la famille refusait « le 20 octobre c'est papa »
     à cause de l'apostrophe, absente du curriculum mais bien présente sur la
     touche 4 de l'AZERTY. */
  const jouables = [...new Set(mots)].filter((m) => estEcrivable(m, id));
  return melange(jouables, rnd)
    .slice(0, TAILLE_BLOC_MAX)
    .map((texte) => ({ texte, genre: 'mot' as const }));
}

export function composerBloc(o: OptionsBloc): Item[] {
  const rnd = alea(o.graine ?? Math.floor(Math.random() * 2 ** 31));
  const taille = Math.min(
    TAILLE_BLOC_MAX,
    Math.max(TAILLE_BLOC_MIN, o.taille ?? TAILLE_BLOC_MIN + Math.floor(rnd() * 5)),
  );
  const ensemble = ensembleTouches(o.parcours, o.id, o.etape);
  const nouvelles = nouvellesTouches(o.parcours, o.id, o.etape);

  /* PONDÉRATION PAR LA MAÎTRISE (#39). Une touche encore mal acquise pèse
     `POIDS_TOUCHE_FAIBLE`, une touche acquise pèse 1. Le poids d'un item est la
     PART de ses touches qui sont faibles, pas leur nombre : sans quoi un item
     long l'emporterait toujours sur un item court, et une maîtrise vide — où
     tout est faible — biaiserait le tirage vers les mots les plus longs alors
     qu'elle ne dit rien. Poids constant ⇒ mélange uniforme. */
  const mesure = o.maitrise;
  const faibles = new Set(
    mesure ? [...ensemble].filter((c) => c !== ' ' && !estMaitrisee(mesure, c)) : [],
  );
  const poids = (texte: string) => {
    /* L'espace est hors comptage : il est ouvert dès la première étape et ne
       se rate jamais — le laisser diluerait le poids des groupes nominaux. */
    const lettres = [...new Set(texte.toLowerCase())].filter((c) => c !== ' ' && ensemble.has(c));
    if (lettres.length === 0) return 1;
    const part = lettres.filter((c) => faibles.has(c)).length / lettres.length;
    return 1 + (POIDS_TOUCHE_FAIBLE - 1) * part;
  };
  const tirer = (liste: string[]) => melangePondere(liste, rnd, poids);

  /* NON-RÉPÉTITION (§7.2) : les exercices des deux leçons précédentes attendent
     leur tour. Ce qui revient, c'est la TOUCHE ratée, jamais le même exercice
     — y compris pour la réinjection des items aidés, qui perd ici sa priorité
     sur la règle d'écart. */
  const interdits = new Set(o.recemmentVus ?? []);

  const mots = [...motsTypables(ensemble), ...groupesTypables(ensemble)];
  // majoritairement des touches du palier courant (cahier 4.3)
  const prioritaires = mots.filter((m) => nouvelles.some((c) => m.includes(c)));
  const estPrioritaire = new Set(prioritaires);
  const autres = mots.filter((m) => !estPrioritaire.has(m));

  const items: Item[] = [];
  const vus = new Set<string>();
  const pousser = (texte: string, genre: GenreItem, malgreRecence = false) => {
    if (vus.has(texte) || items.length >= taille) return;
    if (interdits.has(texte) && !malgreRecence) return;
    vus.add(texte);
    items.push({ texte, genre });
  };
  /* Depuis l'étape 9, une phrase ne finit pas forcément par un point : « Qui
     joue ? » et « Un chat dort ! » en sont. Les classer « mot » faussait les
     quotas de composition d'un bloc. */
  const genreDe = (texte: string): GenreItem =>
    /^[0-9]+$/.test(texte) ? 'nombre' : /[.!?]/.test(texte) ? 'phrase' : 'mot';

  const nombres = tirer(nombresDisponibles(ensemble));
  const phrases = tirer(phrasesTypables(ensemble));
  const motsDuPalier = tirer(prioritaires);
  const motsAnciens = tirer(autres);

  // 1. réinjection des items aidés, comme contenu ordinaire
  for (const texte of tirer(o.aReinjecter ?? []).slice(0, Math.floor(taille / 3))) {
    if ([...texte].every((c) => ensemble.has(c))) pousser(texte, genreDe(texte));
  }

  /* 2. COUVERTURE des touches du palier. Glouton : on prend d'abord l'item qui
     comble le plus de manques, en gardant la préférence P5 (mot > nombre >
     phrase) sur les égalités, puisque le premier trouvé l'emporte. */
  const besoins = couvertureCible(o.parcours, o.id, o.etape);
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
    ...motsDuPalier.map((texte) => ({ texte, genre: 'mot' as const })),
    ...nombres.map((texte) => ({ texte, genre: 'nombre' as const })),
    ...phrases.map((texte) => ({ texte, genre: 'phrase' as const })),
  ];
  for (const item of items) consommer(item.texte);
  initial = new Map(besoins);
  while (items.length < taille && [...besoins.values()].some((n) => n > 0)) {
    let meilleur: Item | undefined;
    let score = 0;
    /* La couverture des touches nouvelles passe avant la règle d'écart : si
       une touche n'est servie que par un exercice vu la leçon dernière, mieux
       vaut le revoir que laisser la touche absente. */
    let recours: Item | undefined;
    let scoreRecours = 0;
    for (const c of vivier) {
      if (vus.has(c.texte)) continue;
      const s = apport(c.texte);
      if (interdits.has(c.texte)) {
        if (s > scoreRecours) [scoreRecours, recours] = [s, c];
      } else if (s > score) {
        [score, meilleur] = [s, c];
      }
    }
    const choisi = meilleur ?? recours;
    if (!choisi) break; // le corpus ne peut pas couvrir mieux : on n'invente rien
    pousser(choisi.texte, choisi.genre, true);
    consommer(choisi.texte);
  }

  /* 3. REMPLISSAGE, dans l'ordre de préférence P5 : vrai mot ou groupe nominal
     > nombre > phrase. Seule exception, l'étape « Des phrases » : elle n'ouvre
     aucune touche, sa promesse EST la phrase — l'ordre de préférence arbitre
     entre contenus équivalents, il ne dicte pas ce qu'une étape enseigne. */
  const etapeDeContenu = etapeDe(o.parcours, o.id, o.etape).genre === 'contenu';
  const remplir = (malgreRecence: boolean) => {
    if (etapeDeContenu) for (const p of phrases) pousser(p, 'phrase', malgreRecence);
    for (const m of motsDuPalier) pousser(m, 'mot', malgreRecence);
    for (const m of motsAnciens) pousser(m, 'mot', malgreRecence);
    for (const n of nombres) pousser(n, 'nombre', malgreRecence);
    for (const p of phrases) pousser(p, 'phrase', malgreRecence);
  };
  remplir(false);
  /* Le corpus de l'étape ne suffit pas à remplir sans redire ? On redit plutôt
     que d'amputer la leçon — et il n'y a toujours pas de septième recours : la
     syllabe de remplissage a disparu. Si une étape en arrive là, c'est l'étape
     qu'on refait, jamais le contenu qu'on comble. */
  if (items.length < taille) remplir(true);

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
      const texte =
        source.find((n) => !vus.has(n) && !interdits.has(n)) ?? source.find((n) => !vus.has(n));
      if (!texte) break;
      vus.add(texte);
      bloc.splice(positions[k] ?? bloc.length, 0, { texte, genre });
    }
  };
  imposer(nombres, QUOTA_NOMBRES, 'nombre', POSITIONS_NOMBRES, bloc.filter((i) => i.genre === 'nombre').length);
  /* Le palier 7 promet « les nombres ET les majuscules » (V6) : sans ce
     plancher, la préférence « vrai mot » n'y servait que des chiffres. */
  imposer(phrases, QUOTA_PHRASES, 'phrase', POSITIONS_PHRASES, bloc.filter((i) => /[A-Z]/.test(i.texte)).length);
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
