import { describe, expect, it } from 'vitest';
import { fusionner, fusionnerMaitrise } from './fusion';
import { enregistrer, leconVierge, serieDe, type Mesures } from './mesures';
import { estMaitrisee, type Maitrise } from './progression';
import {
  avecProgression,
  DEFAUTS,
  progressionDe,
  estIntact,
  valider,
  type Sauvegarde,
} from './storage';

const etat0 = (p: Partial<Sauvegarde>): Sauvegarde => ({ ...DEFAUTS, ...p });
const A = (e: Partial<Sauvegarde>, t = 1000) => ({ etat: etat0(e), majLe: t });

describe('fusion de deux progressions du même enfant', () => {
  it('garde le palier le plus AVANCÉ, même s\'il est le plus ancien', () => {
    const r = fusionner(A({ palier: 5 }, 1000), A({ palier: 2 }, 9000));
    expect(r.palier).toBe(5);
  });

  it('à palier égal, garde le plus grand nombre de blocs faits', () => {
    const r = fusionner(A({ palier: 3, blocsSurPalier: 1 }), A({ palier: 3, blocsSurPalier: 2 }));
    expect(r.blocsSurPalier).toBe(2);
  });

  it('à paliers différents, prend les blocs du palier gagnant', () => {
    const r = fusionner(A({ palier: 4, blocsSurPalier: 0 }), A({ palier: 2, blocsSurPalier: 5 }));
    expect(r.palier).toBe(4);
    expect(r.blocsSurPalier).toBe(0);
  });

  it('le compteur de blocs ne redescend jamais', () => {
    expect(fusionner(A({ bloc: 42 }), A({ bloc: 7 })).bloc).toBe(42);
  });

  it('unit les maîtrises, caractère par caractère', () => {
    const r = fusionner(A({ maitrise: { e: [1, 2], f: [3] } }), A({ maitrise: { e: [2, 5], j: [1] } }));
    expect(r.maitrise).toEqual({ e: [1, 2, 5], f: [3], j: [1] });
  });

  it('le guide des doigts reste vu dès qu\'il l\'a été une fois', () => {
    expect(fusionner(A({ guideDoigtVu: true }), A({ guideDoigtVu: false })).guideDoigtVu).toBe(true);
  });

  it('réglages et clavier suivent le choix le plus RÉCENT', () => {
    const r = fusionner(
      A({ disposition: 'fr-FR', reglages: { ...DEFAUTS.reglages, sons: true } }, 1000),
      A({ disposition: 'fr-CH', reglages: { ...DEFAUTS.reglages, sons: false } }, 2000),
    );
    expect(r.disposition).toBe('fr-CH');
    expect(r.reglages.sons).toBe(false);
  });

  it('est commutative : l\'ordre des appareils ne change rien', () => {
    const a = A({ palier: 3, maitrise: { e: [1] }, bloc: 4 }, 1000);
    const b = A({ palier: 5, maitrise: { f: [2] }, bloc: 7 }, 2000);
    expect(fusionner(a, b)).toEqual(fusionner(b, a));
  });

  it('est idempotente : fusionner deux fois ne bouge plus rien', () => {
    const a = A({ palier: 3, maitrise: { e: [1, 4] }, bloc: 9 }, 1000);
    const b = A({ palier: 4, maitrise: { e: [2] }, bloc: 11 }, 2000);
    const une = fusionner(a, b);
    expect(fusionner({ etat: une, majLe: 3000 }, { etat: une, majLe: 3000 })).toEqual(une);
  });

  it('la main gauche ne perd rien quand un appareil part de zéro', () => {
    const joue = A({ palier: 6, maitrise: { e: [1, 2, 3] }, bloc: 20, guideDoigtVu: true }, 1000);
    const neuf = A({}, 5000);
    const r = fusionner(joue, neuf);
    expect(r.palier).toBe(6);
    expect(r.maitrise).toEqual({ e: [1, 2, 3] });
    expect(r.bloc).toBe(20);
  });
});

describe('fusion des maîtrises', () => {
  it('trie les numéros de bloc', () => {
    expect(fusionnerMaitrise({ e: [5, 1] }, { e: [3] })).toEqual({ e: [1, 3, 5] });
  });

  /**
   * `maitrise` est un MULTI-ENSEMBLE, et c'est tout le sujet : `noterOccurrence`
   * empile une entrée PAR FRAPPE PROPRE, répétitions comprises, et
   * `estMaitrisee` exige `blocs.length >= OCCURRENCES_REQUISES` ET
   * `new Set(blocs).size >= BLOCS_DISTINCTS_REQUIS`. Dédoublonner à la fusion
   * détruisait donc le premier des deux critères : une touche acquise cessait
   * de l'être à la première synchronisation, y compris en fusionnant un état
   * avec sa propre copie serveur identique. Un seul appareil suffisait.
   */
  it('garde les frappes RÉPÉTÉES dans le même bloc', () => {
    expect(fusionnerMaitrise({ e: [5, 5, 6] }, {})).toEqual({ e: [5, 5, 6] });
  });

  it('ne rabote pas un acquis en le fusionnant avec lui-même', () => {
    const acquise: Maitrise = { e: [5, 5, 6] };
    expect(estMaitrisee(acquise, 'e')).toBe(true);
    expect(estMaitrisee(fusionnerMaitrise(acquise, acquise), 'e')).toBe(true);
  });

  /* Union de multi-ensembles : le MAXIMUM des multiplicités, jamais leur
     somme. La somme doublerait les occurrences à chaque synchronisation —
     l'inflation est aussi fausse que l'érosion, et elle casserait
     l'idempotence exigée par #43. */
  it('prend le maximum des multiplicités, pas leur somme', () => {
    expect(fusionnerMaitrise({ e: [5, 5] }, { e: [5, 5] })).toEqual({ e: [5, 5] });
    expect(fusionnerMaitrise({ e: [5, 5] }, { e: [5, 5, 5] })).toEqual({ e: [5, 5, 5] });
  });

  it('réunit deux appareils qui ont travaillé sur des blocs différents', () => {
    expect(fusionnerMaitrise({ e: [5, 5, 6] }, { e: [11, 11, 12] })).toEqual({
      e: [5, 5, 6, 11, 11, 12],
    });
  });

  it('reste commutative et associative sur trois appareils', () => {
    const a: Maitrise = { e: [1, 1, 2] };
    const b: Maitrise = { e: [1, 2, 2], f: [3] };
    const c: Maitrise = { f: [3, 3], j: [9] };
    expect(fusionnerMaitrise(a, b)).toEqual(fusionnerMaitrise(b, a));
    expect(fusionnerMaitrise(fusionnerMaitrise(a, b), c)).toEqual(
      fusionnerMaitrise(a, fusionnerMaitrise(b, c)),
    );
  });
});

describe('un acquis ne se perd pas à la synchronisation', () => {
  /* Le scénario minimal, et il ne demande même pas deux appareils : l'app
     redémarre, `sync.reconcilier` fusionne la copie locale avec la copie
     serveur IDENTIQUE, et la touche cesse d'être acquise. Aucun conflit,
     aucun message, aucun retour en arrière possible — `reconcilier` écrit
     ensuite l'état amputé en local ET sur le serveur. */
  it('une touche acquise le reste après une fusion avec sa propre copie', () => {
    const joue = A({ maitrise: { e: [5, 5, 6] } }, 1000);
    expect(estMaitrisee(joue.etat.maitrise, 'e')).toBe(true);
    const apres = fusionner(joue, { etat: joue.etat, majLe: 2000 });
    expect(estMaitrisee(apres.maitrise, 'e')).toBe(true);
  });

  it('et il y résiste autant de fois qu\'on synchronise', () => {
    let etat = etat0({ maitrise: { e: [5, 5, 6], a: [2, 3, 3] } });
    for (let i = 0; i < 5; i++) etat = fusionner({ etat, majLe: i }, { etat, majLe: i });
    expect(estMaitrisee(etat.maitrise, 'e')).toBe(true);
    expect(estMaitrisee(etat.maitrise, 'a')).toBe(true);
  });
});

describe('le parcours choisi par le parent est contrôlé, pas seulement recopié', () => {
  /* `estIntact` ne regarde JAMAIS `parcours` : le serveur accepte donc
     n'importe quelle chaîne. La lire sur le brut sans contrôle de domaine
     laissait une valeur hors domaine écraser le choix VALIDE de l'autre
     appareil — après quoi `valider` répond Découverte partout, et le geste du
     parent est perdu sur tous les appareils à la fois. */
  it('une valeur hors domaine ne chasse pas un choix valide', () => {
    const sain = A({ parcours: 'dactylo' }, 1000);
    const abime = { etat: { ...etat0({}), parcours: 'Dactylo' } as unknown as Sauvegarde, majLe: 9000 };
    expect(fusionner(sain, abime).parcours).toBe('dactylo');
  });

  it('mais une absence de choix laisse encore parler l\'autre appareil', () => {
    const choisi = A({ parcours: 'dactylo' }, 1000);
    const sansChoix = { etat: { ...etat0({}), parcours: undefined } as Sauvegarde, majLe: 9000 };
    expect(fusionner(choisi, sansChoix).parcours).toBe('dactylo');
  });
});

describe('fusion des progressions par parcours et disposition', () => {
  it('unit les couples : chacun garde le plus avancé', () => {
    const salon = avecProgression(valider(DEFAUTS), 'dactylo', 'fr-FR', {
      etape: 4,
      leconsSurEtape: 1,
    });
    const tablette = avecProgression(valider(DEFAUTS), 'dactylo', 'fr-FR', {
      etape: 2,
      leconsSurEtape: 6,
    });
    const r = fusionner({ etat: salon, majLe: 1000 }, { etat: tablette, majLe: 9000 });
    expect(progressionDe(r, 'dactylo', 'fr-FR')).toEqual({ etape: 4, leconsSurEtape: 1 });
  });

  it('à étape égale, garde le plus grand nombre de leçons faites', () => {
    const a = avecProgression(valider(DEFAUTS), 'dactylo', 'fr-CH', { etape: 3, leconsSurEtape: 1 });
    const b = avecProgression(valider(DEFAUTS), 'dactylo', 'fr-CH', { etape: 3, leconsSurEtape: 5 });
    const r = fusionner({ etat: a, majLe: 1000 }, { etat: b, majLe: 2000 });
    expect(progressionDe(r, 'dactylo', 'fr-CH')).toEqual({ etape: 3, leconsSurEtape: 5 });
  });

  it('un parcours joué sur un seul appareil arrive intact sur l\'autre', () => {
    const joue = avecProgression(valider(DEFAUTS), 'dactylo', 'fr-FR', {
      etape: 5,
      leconsSurEtape: 2,
    });
    const r = fusionner({ etat: joue, majLe: 1000 }, A({}, 9000));
    expect(progressionDe(r, 'dactylo', 'fr-FR')).toEqual({ etape: 5, leconsSurEtape: 2 });
  });

  it('reprend le palier d\'un appareil resté à l\'ancien modèle', () => {
    /* Cet état-là n'a AUCUNE progression : c'est tout ce qu'un ancien bundle
       sait écrire. Son palier est pourtant la progression Découverte. */
    const ancien: Sauvegarde = { ...DEFAUTS, palier: 6, blocsSurPalier: 2, progressions: undefined };
    const r = fusionner({ etat: ancien, majLe: 9000 }, A({}, 1000));
    expect(progressionDe(r, 'decouverte', 'fr-FR')).toEqual({ etape: 6, leconsSurEtape: 2 });
  });

  it('le miroir ne verse jamais une avance dans l\'autre disposition', () => {
    const frFR = avecProgression(valider(DEFAUTS), 'decouverte', 'fr-FR', {
      etape: 5,
      leconsSurEtape: 0,
    });
    const frCH = avecProgression(
      valider({ ...DEFAUTS, disposition: 'fr-CH' }),
      'decouverte',
      'fr-CH',
      { etape: 1, leconsSurEtape: 3 },
    );
    /* fr-CH est le choix le plus RÉCENT : c'est lui que le miroir doit
       refléter, sinon l'enfant se retrouverait à l'étape 5 d'un clavier où il
       n'a jamais joué. */
    const r = fusionner({ etat: frFR, majLe: 1000 }, { etat: frCH, majLe: 9000 });
    expect(r.disposition).toBe('fr-CH');
    expect(r.palier).toBe(1);
    expect(progressionDe(r, 'decouverte', 'fr-FR').etape).toBe(5);
    expect(progressionDe(r, 'decouverte', 'fr-CH')).toEqual({ etape: 1, leconsSurEtape: 3 });
  });

  it('reste idempotente et commutative avec les progressions', () => {
    const a = avecProgression(valider(DEFAUTS), 'dactylo', 'fr-FR', { etape: 3, leconsSurEtape: 1 });
    const b = avecProgression(valider(DEFAUTS), 'decouverte', 'fr-FR', {
      etape: 4,
      leconsSurEtape: 2,
    });
    const une = fusionner({ etat: a, majLe: 1000 }, { etat: b, majLe: 2000 });
    expect(fusionner({ etat: b, majLe: 2000 }, { etat: a, majLe: 1000 })).toEqual(une);
    expect(fusionner({ etat: une, majLe: 3000 }, { etat: une, majLe: 3000 })).toEqual(une);
  });
});

/**
 * #43 — la fusion reçoit du BRUT. `sync.reconcilier` lui passe `d.etat` tel
 * que l'API l'a rendu, et le seul filtre en amont est `estIntact`, qui tolère
 * `bloc`, `modele` et `progressions` absents : c'est le contrat qui laisse un
 * appareil resté à l'ancien bundle continuer à pousser. Les entrées de
 * `fusionner` ne sont donc PAS des `Sauvegarde` complètes, et les traiter
 * comme telles perd — silencieusement — la progression d'un enfant.
 */
describe('fusion de deux appareils qui ne portent pas le même modèle', () => {
  /* Exactement ce qu'un client d'avant `bloc` sait écrire, et que le serveur
     accepte : ni `bloc`, ni `modele`, ni `progressions`. */
  const v1 = (p: Partial<Sauvegarde> = {}): Sauvegarde =>
    ({
      version: 1,
      disposition: 'fr-FR',
      dispositionChoisieALaMain: false,
      palier: 6,
      blocsSurPalier: 2,
      guideDoigtVu: true,
      maitrise: { e: [1, 2] },
      reglages: { sons: true, texteEspace: false, animationsDouces: true },
      ...p,
    }) as unknown as Sauvegarde;

  it('le compteur de blocs reste un ENTIER quand un côté n\'en porte pas', () => {
    /* `Math.max(undefined, 7)` vaut NaN. L'état fusionné repartait alors au
       serveur, qui le refusait en 400 — et un 400 fait jeter l'envoi DÉFINI-
       TIVEMENT (`sync.vidange`). La perte était silencieuse et irréversible. */
    const r = fusionner({ etat: v1(), majLe: 1000 }, A({ bloc: 7 }, 2000));
    expect(Number.isInteger(r.bloc)).toBe(true);
    expect(r.bloc).toBe(7);
  });

  it('l\'état fusionné est toujours accepté par le serveur', () => {
    expect(estIntact(fusionner({ etat: v1(), majLe: 1000 }, A({ bloc: 7 }, 2000)))).toBe(true);
  });

  it('une maîtrise absente ne fait pas tomber la réconciliation entière', () => {
    /* `reconcilier` fusionne les profils EN BOUCLE : une exception ici les
       prive tous de synchronisation, pas seulement celui qui l'a déclenchée. */
    const sansMaitrise = { ...v1(), maitrise: undefined } as unknown as Sauvegarde;
    expect(() => fusionner({ etat: sansMaitrise, majLe: 1000 }, A({}, 2000))).not.toThrow();
  });

  it('une sauvegarde v1 et une sauvegarde migrée ne se perdent ni l\'une ni l\'autre', () => {
    /* Le v1 ne connaît que Découverte — c'est le seul parcours qu'il ait pu
       jouer. Le migré porte en plus une avance en Dactylo. Aucune des deux
       n'a le droit d'effacer l'autre, dans un sens comme dans l'autre. */
    const migre = avecProgression(valider(DEFAUTS), 'dactylo', 'fr-FR', {
      etape: 4,
      leconsSurEtape: 3,
    });
    for (const [x, y] of [
      [{ etat: v1(), majLe: 1000 }, { etat: migre, majLe: 2000 }],
      [{ etat: migre, majLe: 2000 }, { etat: v1(), majLe: 1000 }],
    ] as const) {
      const r = fusionner(x, y);
      expect(progressionDe(r, 'decouverte', 'fr-FR')).toEqual({ etape: 6, leconsSurEtape: 2 });
      expect(progressionDe(r, 'dactylo', 'fr-FR')).toEqual({ etape: 4, leconsSurEtape: 3 });
    }
  });
});

describe('fusion de deux appareils horodatés à la même milliseconde', () => {
  /* Ce n'est pas un cas d'école : `reconcilier` date « très vieille » toute
     copie locale sans horodatage, c'est-à-dire 0. Deux appareils dans ce cas
     arrivent EXACTEMENT à égalité, et `a.majLe <= b.majLe` faisait alors de
     l'ordre des arguments l'arbitre des préférences. */
  const gauche = () =>
    valider({ ...DEFAUTS, disposition: 'fr-FR', parcours: 'decouverte', reglages: { ...DEFAUTS.reglages, sons: true } });
  const droite = () =>
    valider({ ...DEFAUTS, disposition: 'fr-CH', parcours: 'dactylo', reglages: { ...DEFAUTS.reglages, sons: false } });

  it('reste commutative : l\'ordre des arguments ne décide de rien', () => {
    const a = { etat: gauche(), majLe: 0 };
    const b = { etat: droite(), majLe: 0 };
    expect(fusionner(a, b)).toEqual(fusionner(b, a));
  });

  /* L'associativité ne tient PAS à horodatages égaux, et ce test grave la
     propriété qui compte en production : trois appareils réels portent trois
     horodatages distincts — le côté serveur en porte toujours un vrai. */
  it('reste associative dès que les horodatages diffèrent', () => {
    const a = { etat: gauche(), majLe: 1000 };
    const b = { etat: droite(), majLe: 2000 };
    const c = { etat: valider({ ...DEFAUTS, disposition: 'fr-FR', parcours: 'dactylo' }), majLe: 3000 };
    const gd = fusionner({ etat: fusionner(a, b), majLe: 2000 }, c);
    const dg = fusionner(a, { etat: fusionner(b, c), majLe: 3000 });
    expect(gd).toEqual(dg);
  });

  it('tranche pour un seul appareil, jamais pour un panachage des deux', () => {
    /* Départager arbitrairement est acceptable — personne ne peut savoir qui a
       parlé en dernier. Prendre le clavier de l'un et le parcours de l'autre
       ne l'est pas : la famille se retrouverait avec un réglage qu'aucun des
       deux appareils n'a jamais porté. */
    const r = fusionner({ etat: gauche(), majLe: 0 }, { etat: droite(), majLe: 0 });
    const attendu = r.disposition === 'fr-FR' ? gauche() : droite();
    expect(r.parcours).toBe(attendu.parcours);
    expect(r.reglages).toEqual(attendu.reglages);
  });
});

describe('les mesures traversent la réconciliation (#64)', () => {
  /* La durée varie avec l'instant : deux leçons distinctes ne coïncident pas à
     la milliseconde près, et c'est le contenu qui fait l'identité. */
  const lecon = (le: number, etape = 1) => ({
    ...leconVierge(etape),
    le,
    ms: 60_000 + le,
    lettres: 100,
  });

  it('réunit les leçons faites sur deux appareils différents', () => {
    const ici = enregistrer({}, 'decouverte', lecon(100));
    const la = enregistrer({}, 'decouverte', lecon(200));
    const f = fusionner(A({ mesures: ici }, 1000), A({ mesures: la }, 2000));
    expect(serieDe(f.mesures ?? {}, 'decouverte').lecons.map((l) => l.le)).toEqual([100, 200]);
  });

  it('un appareil resté à l’ancien bundle n’efface pas les mesures de l’autre', () => {
    /* Avant #64, `fusionner` reconstruisait la sauvegarde sans nommer les
       mesures : la copie serveur les perdait à CHAQUE réconciliation, et le
       second appareil n'en recevait jamais. */
    const ici = enregistrer({}, 'dactylo', lecon(50));
    expect(fusionner(A({ mesures: ici }), A({})).mesures).toEqual(ici);
    expect(fusionner(A({}), A({ mesures: ici })).mesures).toEqual(ici);
  });

  it('les deux séries ne se mélangent pas en traversant', () => {
    const ici: Mesures = enregistrer({}, 'decouverte', lecon(10, 3));
    const la: Mesures = enregistrer({}, 'dactylo', lecon(20, 1));
    const f = fusionner(A({ mesures: ici }), A({ mesures: la }));
    expect(serieDe(f.mesures ?? {}, 'decouverte').lecons).toHaveLength(1);
    expect(serieDe(f.mesures ?? {}, 'dactylo').lecons).toHaveLength(1);
  });

  it('deux appareils sans aucune mesure ne fabriquent pas un champ vide', () => {
    /* Un `mesures: {}` posé d'un seul côté rend l'état fusionné différent de
       celui du serveur : les deux se renverraient un état identique sans fin. */
    expect(fusionner(A({}), A({})).mesures).toBeUndefined();
  });

  it('reste idempotente : réconcilier dix fois ne fabrique pas dix leçons', () => {
    const ici = enregistrer(enregistrer({}, 'decouverte', lecon(1)), 'decouverte', lecon(2));
    let etat = fusionner(A({ mesures: ici }), A({ mesures: ici }));
    for (let i = 0; i < 9; i++) etat = fusionner(A({ mesures: etat.mesures }), A({ mesures: ici }));
    expect(serieDe(etat.mesures ?? {}, 'decouverte').lecons).toHaveLength(2);
  });
});

describe('la date de la dernière leçon traverse elle aussi (#64)', () => {
  /* Même défaut que les mesures, même conséquence, plus grave : sans elle,
     `session.doitReviser` répond « non » pour toujours, et la révision du
     retour de §7.4 ne se déclenche jamais sur un compte synchronisé. */
  const JANVIER = Date.parse('2026-01-15T10:00:00Z');
  const MARS = Date.parse('2026-03-15T10:00:00Z');

  it('garde la date la PLUS RÉCENTE des deux appareils', () => {
    const f = fusionner(A({ derniereLecon: JANVIER }, 2000), A({ derniereLecon: MARS }, 1000));
    // Le plus récent gagne même si c'est l'appareil qui a parlé en premier :
    // c'est la dernière fois que l'enfant a joué, où qu'il l'ait fait.
    expect(f.derniereLecon).toBe(MARS);
  });

  it('un appareil qui n’a jamais joué n’efface pas la date de l’autre', () => {
    expect(fusionner(A({ derniereLecon: MARS }), A({})).derniereLecon).toBe(MARS);
    expect(fusionner(A({}), A({ derniereLecon: MARS })).derniereLecon).toBe(MARS);
  });

  it('deux appareils qui n’ont jamais joué ne fabriquent pas de date', () => {
    // Un champ posé d'un seul côté suffit à faire diverger l'empreinte, et les
    // deux se renverraient un état identique sans fin.
    expect(fusionner(A({}), A({})).derniereLecon).toBeUndefined();
  });
});
