import donnees from '../data/parcours.json';
import { mainDe, type IdDisposition } from './layouts';

/**
 * La structure du parcours : quelle étape, quelles touches, quel doigt.
 *
 * Source unique. Les jeux de touches viennent de `src/data/parcours.json`, que
 * `scripts/analyse/generer-lecons.py` produit à partir des tables arbitrées du
 * cahier v2 §4.5 — ce sont une décision, pas un résultat qu'un build pourrait
 * recalculer autrement d'une fois sur l'autre.
 *
 * Remplace `paliers.ts`, qui portait un axe unique de dix paliers dont trois
 * n'ouvraient rien. Les deux coexistent le temps de la migration.
 */

export type IdParcours = 'decouverte' | 'dactylo';

export type GenreEtape = 'lettres' | 'majuscule' | 'chiffres' | 'ponctuation' | 'contenu';

/**
 * Dix doigts. Les pouces ne portent que l'espace, ils n'apparaissent donc dans
 * aucune carte touche→doigt : c'est l'alternance des mains qui les décide
 * (`generator.pouceDeLEspace`).
 */
export type Doigt =
  | 'auriculaire_gauche'
  | 'annulaire_gauche'
  | 'majeur_gauche'
  | 'index_gauche'
  | 'pouce_gauche'
  | 'pouce_droit'
  | 'index_droit'
  | 'majeur_droit'
  | 'annulaire_droit'
  | 'auriculaire_droit';

export type Etape = {
  n: number;
  genre: GenreEtape;
  titre: string | null;
  promesse: string | null;
  nouvelles: string[];
  /** Doigt définitif de chaque touche ouverte par CETTE étape. */
  doigts: Record<string, Doigt>;
  /** `null` en Découverte, qui ne contraint pas le doigt mais la main. */
  doigtsOuverts: Doigt[] | null;
  /** Présent à l'étape Majuscule de Dactylo, où l'auriculaire entre comme
      porteur du modificateur et non comme frappeur de lettres. */
  doigtsModificateur?: Doigt[];
};

type TableParcours = Record<
  IdParcours,
  Record<IdDisposition, { lecons_par_etape: number; etapes: Etape[] }>
>;

const TABLE = donnees as unknown as TableParcours;

export const ETAPE_MAX = 10;
export const LECONS_PAR_ETAPE = 7;

/** L'espace est ouvert dès la première étape des deux parcours : il ne coûte
    rien — il n'est jamais une lettre de mot — et il ouvre les groupes nominaux. */
export const ESPACE = ' ';

export function etapes(parcours: IdParcours, id: IdDisposition): Etape[] {
  return TABLE[parcours][id].etapes;
}

export function etape(parcours: IdParcours, id: IdDisposition, n: number): Etape {
  const e = etapes(parcours, id).find((x) => x.n === n);
  if (!e) throw new Error(`étape ${n} inconnue en ${parcours}/${id}`);
  return e;
}

export function nouvellesTouches(parcours: IdParcours, id: IdDisposition, n: number): string[] {
  return etape(parcours, id, n).nouvelles;
}

/** Toutes les touches ouvertes jusqu'à `n` incluse, espace compris. */
export function ensembleTouches(parcours: IdParcours, id: IdDisposition, n: number): Set<string> {
  const out = new Set<string>([ESPACE]);
  for (const e of etapes(parcours, id)) {
    if (e.n > n) break;
    for (const c of e.nouvelles) out.add(c);
  }
  return out;
}

export function doigtsOuverts(parcours: IdParcours, id: IdDisposition, n: number): Doigt[] | null {
  return etape(parcours, id, n).doigtsOuverts;
}

/**
 * Le doigt à MONTRER pour une touche — et c'est la seule vraie différence
 * entre les deux parcours.
 *
 * En Découverte, la contrainte est la main : l'index de chaque main couvre
 * toute sa moitié de clavier, donc la réponse est toujours un index, celui du
 * côté de la touche. En Dactylo, c'est le doigt définitif, immuable.
 *
 * L'application ne peut pas VÉRIFIER quel doigt a frappé — elle lit un code
 * physique. Elle montre, elle ne contrôle pas.
 */
export function doigtDe(
  parcours: IdParcours,
  id: IdDisposition,
  caractere: string,
): Doigt | undefined {
  if (caractere === ESPACE) return undefined;
  if (parcours === 'decouverte') {
    const main = mainDe(id, caractere);
    if (!main) return undefined;
    return main === 'gauche' ? 'index_gauche' : 'index_droit';
  }
  for (const e of etapes(parcours, id)) {
    const d = e.doigts[caractere];
    if (d) return d;
  }
  return undefined;
}

export function etapeFinie(leconsFaites: number): boolean {
  return leconsFaites >= LECONS_PAR_ETAPE;
}

/** Les dix étapes sont numérotées pareil dans les deux parcours et sur les deux
    dispositions : la suite ne dépend donc que du numéro. */
export function etapeSuivante(n: number): number | undefined {
  return n < ETAPE_MAX ? n + 1 : undefined;
}
