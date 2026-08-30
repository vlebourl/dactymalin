import {
  fusionnerProgressions,
  miroirLegacy,
  MODELE,
  progressionDe,
  valider,
  type Sauvegarde,
} from './storage';
import type { Maitrise } from './progression';

/**
 * Réconciliation de deux progressions du MÊME enfant, faites sur deux
 * appareils. La règle est « le plus avancé gagne », jamais « le dernier
 * écrit gagne » : un enfant qui a joué sur l'ordinateur du salon ne doit pas
 * perdre son palier parce qu'il a ouvert l'app sur le portable ensuite.
 *
 * Depuis les deux parcours (#43), « le plus avancé » se juge COUPLE PAR
 * COUPLE (parcours × disposition) et non sur un palier unique : un enfant peut
 * être à l'étape 3 de Découverte et à l'étape 1 de Dactylo (cahier §4.2), et
 * arbitrer entre les deux en ferait forcément perdre une.
 *
 * Fonction PURE : elle ne lit ni le réseau, ni le stockage, ni l'horloge.
 */
export function fusionner(
  a: { etat: Sauvegarde; majLe: number },
  b: { etat: Sauvegarde; majLe: number },
): Sauvegarde {
  /* Les deux côtés sont VALIDÉS avant d'être lus, et ce n'est pas une
     précaution de style : `sync.reconcilier` passe ici `d.etat` tel que l'API
     l'a rendu, et le seul filtre en amont est `estIntact` — qui TOLÈRE `bloc`,
     `modele` et `progressions` absents, parce que c'est ce contrat-là qui
     laisse un appareil resté à l'ancien bundle continuer à pousser.
     Les entrées ne sont donc pas des `Sauvegarde` complètes, quoi qu'en dise
     le type. Les lire comme telles donnait `Math.max(undefined, n)` → `NaN` :
     l'état fusionné repartait au serveur, qui le refusait en 400, et un 400
     fait jeter l'envoi DÉFINITIVEMENT (`sync.vidange`). La perte était
     silencieuse et irréversible — exactement ce que cette fonction existe pour
     empêcher. `valider` normalise au passage les progressions, migration du
     `palier` legacy comprise. */
  const g = { brut: a.etat, etat: valider(a.etat), majLe: a.majLe };
  const d = { brut: b.etat, etat: valider(b.etat), majLe: b.majLe };
  const [ancien, recent] = ordonner(g, d);
  const disposition = recent.etat.disposition;

  /* Chaque couple (parcours, disposition) est réconcilié POUR LUI-MÊME : les
     mesures d'un parcours ne franchissent jamais la frontière de l'autre. */
  const progressions = fusionnerProgressions(
    g.etat.progressions ?? {},
    d.etat.progressions ?? {},
  );

  /* Le miroir des anciens clients suit la progression Découverte de la
     disposition RETENUE, et non le plus grand des deux paliers : celui-ci
     pourrait venir de l'autre disposition, et le relire y verserait une
     avance qui n'y a jamais été faite. */
  const miroir = miroirLegacy(progressionDe({ progressions }, 'decouverte', disposition));

  return {
    version: 1,
    modele: MODELE,
    /* Réglages et clavier : préférences, pas progression — le plus RÉCENT
       gagne, c'est le dernier choix de la famille. */
    disposition,
    /* Le parcours suit la même règle : c'est le parent qui l'a posé, et son
       geste le plus récent est celui qui vaut. Il se lit sur le BRUT : une
       sauvegarde d'avant le sélecteur (#42) n'en porte pas, et `valider` y
       répond Découverte — ce qui effacerait le choix, pourtant explicite, de
       l'autre appareil. */
    parcours: recent.brut.parcours ?? ancien.brut.parcours,
    dispositionChoisieALaMain:
      recent.etat.dispositionChoisieALaMain || ancien.etat.dispositionChoisieALaMain,
    reglages: recent.etat.reglages,
    /* Acquis : ils ne se perdent pas. */
    progressions,
    palier: miroir.palier,
    blocsSurPalier: miroir.blocsSurPalier,
    // compteur monotone : il ne redescend jamais
    bloc: Math.max(g.etat.bloc, d.etat.bloc),
    maitrise: fusionnerMaitrise(g.etat.maitrise, d.etat.maitrise),
    guideDoigtVu: g.etat.guideDoigtVu || d.etat.guideDoigtVu,
  };
}

/**
 * Lequel des deux appareils a parlé en dernier — `[ancien, récent]`.
 *
 * À horodatage ÉGAL, personne ne peut le savoir, et ce cas n'est pas d'école :
 * `sync.reconcilier` date « très vieille », c'est-à-dire 0, toute copie locale
 * dont l'horodatage a été perdu. Deux appareils dans ce cas arrivaient
 * exactement à égalité, et `a.majLe <= b.majLe` faisait alors de l'ORDRE DES
 * ARGUMENTS l'arbitre des préférences de la famille : fusionner A puis B ne
 * donnait plus le même clavier que B puis A.
 *
 * On départage donc sur le contenu, qui lui ne dépend pas de l'ordre d'appel.
 * Le vainqueur est arbitraire — sa stabilité ne l'est pas — et il emporte
 * TOUTES les préférences, jamais un panachage : la famille se retrouverait
 * sinon avec un réglage qu'aucun des deux appareils n'a jamais porté.
 */
function ordonner<T extends { etat: Sauvegarde; majLe: number }>(a: T, b: T): [T, T] {
  if (a.majLe !== b.majLe) return a.majLe < b.majLe ? [a, b] : [b, a];
  /* `valider` écrit toujours ses champs dans le même ordre : la sérialisation
     de deux états égaux l'est donc aussi. */
  return JSON.stringify(a.etat) < JSON.stringify(b.etat) ? [a, b] : [b, a];
}

/** Union par caractère des numéros de bloc, dédoublonnés et triés. */
export function fusionnerMaitrise(a: Maitrise, b: Maitrise): Maitrise {
  const sortie: Maitrise = {};
  for (const cle of new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])) {
    sortie[cle] = [...new Set([...(a?.[cle] ?? []), ...(b?.[cle] ?? [])])].sort((x, y) => x - y);
  }
  return sortie;
}
