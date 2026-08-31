import {
  fusionnerProgressions,
  miroirLegacy,
  MODELE,
  progressionDe,
  valider,
  type Sauvegarde,
} from './storage';
import type { Maitrise } from './progression';
import { LECONS_SANS_REPETITION } from './generator';
import { fusionnerMesures } from './mesures';
import type { IdParcours } from './parcours';

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

  /* Ce que l'app OBSERVE voyage désormais comme le reste (#64). Cette fonction
     reconstruit la sauvegarde champ par champ : ne pas nommer les mesures ici
     revenait à les effacer de la copie serveur à CHAQUE réconciliation, et un
     second appareil n'en recevait jamais aucune. L'union est par parcours, et
     par date de clôture.

     Le champ n'est posé que s'il porte quelque chose, exactement comme
     `valider` : un `mesures: {}` ajouté d'un seul côté suffit à rendre l'état
     fusionné différent de celui du serveur, et les deux se renverraient alors
     un état identique indéfiniment. */
  const mesures = fusionnerMesures(g.etat.mesures ?? {}, d.etat.mesures ?? {});

  /* Même trou, même remède. `derniereLecon` datait la dernière séance close, et
     ne survivait pas davantage à cette reconstruction : la réconciliation, qui
     tourne à CHAQUE démarrage, l'effaçait partout. Trois semaines plus tard,
     `session.doitReviser` répondait « non » sur une date absente, et la
     révision du retour (§7.4) ne se déclenchait jamais — sur aucun appareil
     d'aucun compte synchronisé.

     La plus RÉCENTE des deux : c'est la dernière fois que l'enfant a joué, où
     qu'il l'ait fait. La plus ancienne le ferait réviser pour une pause qu'il
     n'a pas prise. */
  const dernieres = [g.etat.derniereLecon, d.etat.derniereLecon].filter(
    (t): t is number => typeof t === 'number',
  );

  /* Troisième champ à tomber dans le même trou, et il faut le dire : cette
     fonction ne garde que ce qu'elle NOMME. Après les mesures et la date de la
     dernière leçon, les exercices récents (#72).

     Prendre la liste du dernier joueur et jeter l'autre perdait une leçon :
     deux appareils qui jouent chacun de leur côté depuis un état commun
     arrivaient avec un lot neuf chacun, et l'un des deux disparaissait — le
     mot qu'il portait pouvait alors revenir avec UNE seule leçon d'écart au
     lieu de trois. On réunit donc les lots, on jette les doublons, et on garde
     les plus récents. */
  const exercicesRecents = unionDesLots(
    ancien.etat.exercicesRecents,
    recent.etat.exercicesRecents,
  );

  return {
    version: 1,
    modele: MODELE,
    /* Réglages et clavier : préférences, pas progression — le plus RÉCENT
       gagne, c'est le dernier choix de la famille. */
    disposition,
    /* Le parcours suit la même règle : c'est le parent qui l'a posé, et son
       geste le plus récent est celui qui vaut. */
    parcours: choixDeParcours(recent) ?? choixDeParcours(ancien),
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
    ...(Object.keys(mesures).length ? { mesures } : {}),
    ...(dernieres.length ? { derniereLecon: Math.max(...dernieres) } : {}),
    ...(exercicesRecents?.length ? { exercicesRecents } : {}),
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
 * Le vainqueur est arbitraire, et il emporte TOUTES les préférences, jamais un
 * panachage : la famille se retrouverait sinon avec un réglage qu'aucun des
 * deux appareils n'a jamais porté.
 *
 * LIMITE CONNUE, et il faut la dire plutôt que la découvrir : ce départage rend
 * la fusion commutative, mais PAS associative à horodatages égaux. Fusionner
 * `(a∘b)∘c` peut ne pas donner `a∘(b∘c)`, parce que l'état intermédiaire est un
 * objet fusionné dont la sérialisation n'a plus de rapport d'ordre avec celles
 * de `a` et `b` — et le panachage interdit à deux revient alors à trois.
 * À horodatages DISTINCTS, l'associativité tient (fuzz de 20 000 triplets).
 *
 * Aucun chemin de production n'y mène : `sync.reconcilier` ne fusionne jamais
 * que DEUX états, et le côté serveur porte toujours un `Date.parse` réel,
 * jamais 0. Il faudrait trois appareils à la même milliseconde. C'est suivi en
 * ticket plutôt que corrigé ici : rendre le départage associatif demanderait un
 * ordre total sur les états que la fusion préserve, ce qui coûterait bien plus
 * que ce que ce cas rapporte.
 */
function ordonner<T extends { etat: Sauvegarde; majLe: number }>(a: T, b: T): [T, T] {
  if (a.majLe !== b.majLe) return a.majLe < b.majLe ? [a, b] : [b, a];
  /* `valider` écrit toujours ses champs dans le même ordre : la sérialisation
     de deux états égaux l'est donc aussi. */
  return JSON.stringify(a.etat) < JSON.stringify(b.etat) ? [a, b] : [b, a];
}

/**
 * Le choix de parcours d'un appareil, ou `undefined` s'il n'en porte pas.
 *
 * Il se lit sur le BRUT, parce que `valider` répond Découverte aussi bien à
 * « pas de choix » qu'à « Découverte choisie » : confondre les deux effacerait
 * le geste explicite fait sur l'autre appareil (#42).
 *
 * Mais il n'est RETENU que s'il a survécu à la validation à l'identique.
 * `estIntact` ne regarde jamais ce champ — le serveur accepte donc n'importe
 * quelle chaîne — et le recopier tel quel laissait une valeur hors domaine
 * chasser un choix valide, après quoi chaque appareil retombait sur Découverte
 * en relisant : le geste du parent était perdu partout à la fois.
 */
function choixDeParcours(x: { brut: Sauvegarde; etat: Sauvegarde }): IdParcours | undefined {
  return x.brut.parcours !== undefined && x.brut.parcours === x.etat.parcours
    ? x.etat.parcours
    : undefined;
}

/**
 * Union par caractère des occurrences propres, triée.
 *
 * `Maitrise` est un MULTI-ENSEMBLE, et c'est tout le sujet : `noterOccurrence`
 * empile une entrée PAR FRAPPE PROPRE — répétitions dans un même bloc
 * comprises — et `estMaitrisee` exige `blocs.length >= OCCURRENCES_REQUISES`
 * ET `new Set(blocs).size >= BLOCS_DISTINCTS_REQUIS`. Les DEUX.
 *
 * Dédoublonner ici détruisait donc le premier des deux critères : une touche
 * acquise cessait de l'être à la première synchronisation, et il n'y fallait
 * même pas deux appareils — fusionner la copie locale avec sa propre copie
 * serveur, identique, suffisait. `reconcilier` écrivait ensuite l'état amputé
 * en local ET sur le serveur, sans un mot et sans retour possible. C'était la
 * négation directe de ce que cette fonction promet plus haut : « Acquis : ils
 * ne se perdent pas. »
 *
 * L'union est donc celle des multi-ensembles : le MAXIMUM des multiplicités,
 * jamais leur somme. La somme doublerait les occurrences à chaque
 * synchronisation, et cette inflation-là est aussi fausse que l'érosion — elle
 * casserait l'idempotence, qui n'est pas une élégance mais un critère (#43).
 * Le maximum dit « ce qu'a vu le mieux informé des deux appareils », ce qui est
 * exactement la règle du module.
 */
export function fusionnerMaitrise(a: Maitrise, b: Maitrise): Maitrise {
  const sortie: Maitrise = {};
  for (const cle of new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])) {
    sortie[cle] = unionMultiensemble(a?.[cle] ?? [], b?.[cle] ?? []);
  }
  return sortie;
}

function unionMultiensemble(a: number[], b: number[]): number[] {
  const multiplicites = (v: number[]) => {
    const m = new Map<number, number>();
    for (const n of v) m.set(n, (m.get(n) ?? 0) + 1);
    return m;
  };
  const ici = multiplicites(a);
  const la = multiplicites(b);
  const sortie: number[] = [];
  for (const bloc of [...new Set([...a, ...b])].sort((x, y) => x - y)) {
    const combien = Math.max(ici.get(bloc) ?? 0, la.get(bloc) ?? 0);
    for (let i = 0; i < combien; i++) sortie.push(bloc);
  }
  return sortie;
}

/**
 * Réunit les souvenirs de leçons de deux appareils.
 *
 * Un « lot » est ce qu'une leçon a servi. Les lots n'ont pas de date : leur
 * ordre est celui de la liste, du plus ancien au plus récent, et la seule chose
 * qu'on sache d'un lot venu d'ailleurs est qu'il est plus récent que ceux de
 * l'appareil qui a parlé en premier. On concatène donc dans cet ordre-là.
 *
 * Les doublons partent : sans quoi réconcilier deux fois de suite ferait
 * grossir la liste, puis chasserait de vraies leçons hors de la fenêtre.
 *
 * LIMITE CONNUE, à dire plutôt qu'à laisser découvrir : un appareil resté au
 * bundle d'avant #72 ignore ce champ. Il joue sans rien y inscrire, et ce qu'il
 * a servi n'est donc jamais protégé ; pire, les lots déjà là ne vieillissent
 * plus, faute de leçons neuves pour les chasser. Ils restent interdits jusqu'à
 * ce qu'un appareil à jour termine deux leçons. Ce n'est pas corrigé ici : le
 * plafond de `session.ecartSoutenable` borne déjà ce que l'interdiction peut
 * coûter à une séance, et faire vieillir la liste sur le silence d'un pair
 * l'effacerait aussi pour un appareil neuf qui n'a simplement jamais joué.
 */
function unionDesLots(ancien?: string[][], recent?: string[][]): string[][] | undefined {
  if (!ancien?.length && !recent?.length) return undefined;
  const vus = new Set<string>();
  const sortie: string[][] = [];
  for (const lot of [...(ancien ?? []), ...(recent ?? [])]) {
    const cle = JSON.stringify(lot);
    if (vus.has(cle)) continue;
    vus.add(cle);
    sortie.push(lot);
  }
  return sortie.slice(-(LECONS_SANS_REPETITION - 1));
}
