import { beforeEach, describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  LECONS_OBSERVEES,
  SEUIL_BARREAU3,
  alarmeBarreau3,
  enregistrer,
  frequenceBarreau3,
  leconVierge,
  leconsDeLEtape,
  noterFrappe,
  precision,
  proprete,
  serieDe,
  vitesse,
  MEMOIRE_LECONS,
  SEUIL_VITESSE_DECOUVERTE,
  alarmePassageDactylo,
  cumulRecent,
  fusionnerMesures,
  type Mesures,
  type RapportLecon,
} from './mesures';
import { LECONS_PAR_ETAPE } from './parcours';
import { creerEtat, reducer as reducerLecon, type ActionLecon } from './lecon';
import type { Item } from './generator';
import { CLE, DEFAUTS, charger, estIntact, sauver, valider } from './storage';
import { aSauvegarder, etatDeDepart, reducer, type BilanBloc, type EtatApp } from '../state';

/** Faux localStorage : ces fonctions doivent rester testables en env node. */
class FauxStockage {
  private m = new Map<string, string>();
  getItem = (k: string) => this.m.get(k) ?? null;
  setItem = (k: string, v: string) => void this.m.set(k, v);
  removeItem = (k: string) => void this.m.delete(k);
  clear = () => this.m.clear();
  key = (i: number) => [...this.m.keys()][i] ?? null;
  get length() {
    return this.m.size;
  }
}

/* Un stockage NEUF par test : `etatDeDepart` relit la sauvegarde, et un test
   qui hérite des mesures écrites par le précédent ne prouve plus rien. */
beforeEach(() => {
  globalThis.localStorage = new FauxStockage() as unknown as Storage;
});

/** Une leçon fabriquée à la main, sans passer par les frappes. */
function rapport(p: Partial<RapportLecon> = {}): RapportLecon {
  return { ...leconVierge(1), lettres: 100, fautes: 0, ms: 60_000, ...p };
}

describe('rapport d’une leçon', () => {
  it('compte, par touche, les positions validées et celles justes du premier coup', () => {
    let r = leconVierge(3);
    r = noterFrappe(r, { touche: 'e', juste: true, premierCoup: true });
    r = noterFrappe(r, { touche: 'e', juste: false, premierCoup: false });
    r = noterFrappe(r, { touche: 'e', juste: true, premierCoup: false });
    expect(r.touches.e).toEqual({ propres: 1, total: 2 });
    expect(r.lettres).toBe(2);
    expect(r.fautes).toBe(1);
    expect(r.etape).toBe(3);
  });

  it('ne compte une faute NI comme lettre NI comme touche validée', () => {
    const r = noterFrappe(leconVierge(1), { touche: 'a', juste: false, premierCoup: false });
    expect(r.lettres).toBe(0);
    expect(r.touches.a).toBeUndefined();
  });

  it('compte le barreau 3 une fois par lettre, et seulement sur une lettre', () => {
    let r = leconVierge(1);
    r = noterFrappe(r, { touche: 'a', juste: true, premierCoup: false, barreau3: true });
    r = noterFrappe(r, { touche: 'b', juste: true, premierCoup: true });
    expect(r.barreau3).toBe(1);
    expect(r.lettres).toBe(2);
  });

  it('l’espace ne compte pas comme une touche mesurée, mais bien comme une lettre tapée', () => {
    const r = noterFrappe(leconVierge(1), { touche: ' ', juste: true, premierCoup: true });
    expect(r.touches[' ']).toBeUndefined();
    expect(r.lettres).toBe(1);
  });
});

describe('les cinq mesures', () => {
  it('proportion d’items justes du premier coup, par touche', () => {
    const m = enregistrer({}, 'dactylo', rapport({ touches: { e: { propres: 3, total: 4 } } }));
    expect(proprete(serieDe(m, 'dactylo'), 'e')).toBe(0.75);
  });

  it('une touche jamais tapée n’a pas de proportion — et surtout pas zéro', () => {
    expect(proprete(serieDe({}, 'dactylo'), 'e')).toBeNull();
  });

  it('vitesse en mots nets par minute : le mot conventionnel fait cinq lettres', () => {
    // 200 lettres en deux minutes = 40 mots / 2 min = 20 mots par minute
    expect(vitesse(rapport({ lettres: 200, ms: 120_000 }))).toBe(20);
  });

  it('une leçon de durée nulle ne produit pas une vitesse infinie', () => {
    expect(vitesse(rapport({ lettres: 10, ms: 0 }))).toBeNull();
  });

  it('précision : lettres justes sur frappes totales', () => {
    expect(precision(rapport({ lettres: 90, fautes: 10 }))).toBe(0.9);
    expect(precision(rapport({ lettres: 0, fautes: 0 }))).toBeNull();
  });

  it('nombre de leçons consommées par étape', () => {
    let m: Mesures = {};
    for (let i = 0; i < 9; i++) m = enregistrer(m, 'decouverte', rapport({ etape: 2 }));
    m = enregistrer(m, 'decouverte', rapport({ etape: 3 }));
    expect(leconsDeLEtape(serieDe(m, 'decouverte'), 2)).toBe(9);
    expect(leconsDeLEtape(serieDe(m, 'decouverte'), 3)).toBe(1);
    // Le garde-fou §7.1 veut voir un enfant qui s'attarde : neuf leçons sur une
    // étape qui en demande sept, ça doit être lisible.
    expect(leconsDeLEtape(serieDe(m, 'decouverte'), 2)).toBeGreaterThan(LECONS_PAR_ETAPE);
  });

  it('fréquence du barreau 3, sur les dernières leçons — le régime stabilisé', () => {
    let m: Mesures = {};
    // Des leçons anciennes, très mauvaises, qui ne doivent plus peser.
    for (let i = 0; i < 20; i++) m = enregistrer(m, 'dactylo', rapport({ barreau3: 100 }));
    for (let i = 0; i < LECONS_OBSERVEES; i++) m = enregistrer(m, 'dactylo', rapport({ barreau3: 5 }));
    expect(frequenceBarreau3(serieDe(m, 'dactylo'))).toBe(0.05);
  });

  it('le seuil d’alarme est une lettre sur cinq', () => {
    expect(SEUIL_BARREAU3).toBe(0.2);
    const sous = enregistrer({}, 'dactylo', rapport({ lettres: 100, barreau3: 19 }));
    const au = enregistrer({}, 'dactylo', rapport({ lettres: 100, barreau3: 20 }));
    expect(alarmeBarreau3(serieDe(sous, 'dactylo'))).toBe(false);
    expect(alarmeBarreau3(serieDe(au, 'dactylo'))).toBe(true);
  });

  it('sans aucune leçon, il n’y a ni fréquence ni alarme', () => {
    expect(frequenceBarreau3(serieDe({}, 'dactylo'))).toBeNull();
    expect(alarmeBarreau3(serieDe({}, 'dactylo'))).toBe(false);
  });
});

describe('ce que le parent peut lire (#63)', () => {
  it('le cumul récent additionne les dernières leçons, et laisse les vieilles dehors', () => {
    let m: Mesures = {};
    // Un débutant très lent, il y a longtemps.
    for (let i = 0; i < 20; i++)
      m = enregistrer(m, 'decouverte', rapport({ lettres: 10, ms: 60_000 }));
    for (let i = 0; i < LECONS_OBSERVEES; i++)
      m = enregistrer(m, 'decouverte', rapport({ lettres: 100, ms: 60_000 }));
    const c = cumulRecent(serieDe(m, 'decouverte'));
    expect(c).not.toBeNull();
    // 100 lettres par minute = 20 mots/min. Les vieilles leçons ne tirent pas vers le bas.
    expect(vitesse(c!)).toBe(20);
  });

  it('le cumul récent ne mélange jamais les deux parcours', () => {
    let m: Mesures = {};
    m = enregistrer(m, 'decouverte', rapport({ lettres: 100, ms: 60_000 }));
    m = enregistrer(m, 'dactylo', rapport({ lettres: 10, ms: 60_000 }));
    expect(vitesse(cumulRecent(serieDe(m, 'decouverte'))!)).toBe(20);
    expect(vitesse(cumulRecent(serieDe(m, 'dactylo'))!)).toBe(2);
  });

  it('un parcours jamais joué n’a pas de cumul — et surtout pas un zéro', () => {
    expect(cumulRecent(serieDe({}, 'dactylo'))).toBeNull();
  });

  it('la précision se lit sur le cumul, pas leçon par leçon', () => {
    let m: Mesures = {};
    m = enregistrer(m, 'dactylo', rapport({ lettres: 90, fautes: 10 }));
    m = enregistrer(m, 'dactylo', rapport({ lettres: 100, fautes: 0 }));
    expect(precision(cumulRecent(serieDe(m, 'dactylo'))!)).toBeCloseTo(190 / 200);
  });

  it('le seuil de passage à Dactylo est de quinze mots par minute (§7.1)', () => {
    expect(SEUIL_VITESSE_DECOUVERTE).toBe(15);
    // 70 lettres en une minute = 14 mots/min : l'enfant peut rester.
    const sous = enregistrer({}, 'decouverte', rapport({ lettres: 70, ms: 60_000 }));
    // 75 lettres = 15 mots/min : c'est le moment de proposer Dactylo.
    const au = enregistrer({}, 'decouverte', rapport({ lettres: 75, ms: 60_000 }));
    expect(alarmePassageDactylo(sous)).toBe(false);
    expect(alarmePassageDactylo(au)).toBe(true);
  });

  it('un enfant rapide en DACTYLO ne déclenche pas la proposition de passer à Dactylo', () => {
    // Le garde-fou §7.1 ne parle que de Découverte : l'index qui s'installe.
    const m = enregistrer({}, 'dactylo', rapport({ lettres: 200, ms: 60_000 }));
    expect(alarmePassageDactylo(m)).toBe(false);
  });

  it('sans aucune leçon, aucune alarme ne se déclenche', () => {
    expect(alarmePassageDactylo({})).toBe(false);
  });
});

describe('deux séries, jamais fusionnées', () => {
  it('enregistrer en Dactylo ne touche pas la série Découverte', () => {
    const m = enregistrer(
      enregistrer({}, 'decouverte', rapport({ lettres: 50, ms: 60_000 })),
      'dactylo',
      rapport({ lettres: 200, ms: 60_000 }),
    );
    expect(vitesse(serieDe(m, 'decouverte').lecons[0])).toBe(10);
    expect(vitesse(serieDe(m, 'dactylo').lecons[0])).toBe(40);
    expect(serieDe(m, 'decouverte').lecons).toHaveLength(1);
    expect(serieDe(m, 'dactylo').lecons).toHaveLength(1);
  });

  it('les touches non plus ne se mélangent pas d’un parcours à l’autre', () => {
    let m = enregistrer({}, 'decouverte', rapport({ touches: { e: { propres: 0, total: 10 } } }));
    m = enregistrer(m, 'dactylo', rapport({ touches: { e: { propres: 10, total: 10 } } }));
    expect(proprete(serieDe(m, 'decouverte'), 'e')).toBe(0);
    expect(proprete(serieDe(m, 'dactylo'), 'e')).toBe(1);
  });

  it('les touches d’un même parcours, elles, s’accumulent d’une leçon à l’autre', () => {
    let m = enregistrer({}, 'dactylo', rapport({ touches: { e: { propres: 1, total: 2 } } }));
    m = enregistrer(m, 'dactylo', rapport({ touches: { e: { propres: 3, total: 6 } } }));
    expect(serieDe(m, 'dactylo').touches.e).toEqual({ propres: 4, total: 8 });
  });

  it('l’historique est borné, et ce sont les leçons les plus VIEILLES qui partent', () => {
    let m: Mesures = {};
    for (let i = 1; i <= LECONS_OBSERVEES * 100; i++) {
      m = enregistrer(m, 'dactylo', rapport({ lettres: i }));
    }
    const lecons = serieDe(m, 'dactylo').lecons;
    expect(lecons.length).toBeLessThanOrEqual(1000);
    expect(lecons[lecons.length - 1].lettres).toBe(LECONS_OBSERVEES * 100);
  });

  it('enregistrer ne mute pas les mesures reçues', () => {
    const avant: Mesures = {};
    const apres = enregistrer(avant, 'dactylo', rapport());
    expect(avant).toEqual({});
    expect(apres).not.toBe(avant);
  });
});

describe('deux appareils, une seule série par parcours (#64)', () => {
  /* Une leçon close porte l'instant où elle l'a été : c'est ce qui la distingue
     de celle d'un autre appareil, et ce qui permet de les remettre dans
     l'ordre. Sans cette date, deux séries ne peuvent qu'être départagées — donc
     l'une des deux jetée. */
  /* Deux leçons réellement distinctes ne coïncident pas sur leur durée : elle
     se compte à la milliseconde sur une séance de douze minutes. Les fixtures
     le reflètent — une leçon qui ne diffère QUE par sa date est le même
     événement revu, pas un second. */
  const le = (t: number, p: Partial<RapportLecon> = {}) =>
    rapport({ le: t, ms: 60_000 + t, ...p });

  it('réunit les leçons des deux appareils, dans l’ordre du temps', () => {
    const ici = enregistrer(enregistrer({}, 'decouverte', le(100)), 'decouverte', le(300));
    const la = enregistrer({}, 'decouverte', le(200));
    const f = fusionnerMesures(ici, la);
    expect(serieDe(f, 'decouverte').lecons.map((l) => l.le)).toEqual([100, 200, 300]);
  });

  it('est idempotente : synchroniser dix fois ne fabrique pas dix leçons', () => {
    const m = enregistrer(enregistrer({}, 'dactylo', le(1)), 'dactylo', le(2));
    let f = fusionnerMesures(m, m);
    for (let i = 0; i < 9; i++) f = fusionnerMesures(f, m);
    expect(serieDe(f, 'dactylo').lecons).toHaveLength(2);
  });

  it('est commutative : l’ordre des appareils ne change rien', () => {
    const a = enregistrer({}, 'decouverte', le(10, { lettres: 50 }));
    const b = enregistrer({}, 'decouverte', le(20, { lettres: 80 }));
    expect(fusionnerMesures(a, b)).toEqual(fusionnerMesures(b, a));
  });

  it('ne fait jamais franchir la frontière d’un parcours à l’autre', () => {
    const a = enregistrer({}, 'decouverte', le(10));
    const b = enregistrer({}, 'dactylo', le(20));
    const f = fusionnerMesures(a, b);
    expect(serieDe(f, 'decouverte').lecons.map((l) => l.le)).toEqual([10]);
    expect(serieDe(f, 'dactylo').lecons.map((l) => l.le)).toEqual([20]);
  });

  it('un appareil qui ne connaît pas les mesures n’efface pas celles de l’autre', () => {
    const a = enregistrer({}, 'decouverte', le(10));
    expect(fusionnerMesures(a, {})).toEqual(a);
    expect(fusionnerMesures({}, a)).toEqual(a);
  });

  it('les touches cumulées prennent le MAXIMUM, jamais la somme', () => {
    // La somme doublerait le compte à chaque synchronisation. Comme pour la
    // maîtrise : « ce qu'a vu le mieux informé des deux appareils ».
    let a: Mesures = {};
    let b: Mesures = {};
    for (let i = 0; i < 3; i++) a = enregistrer(a, 'decouverte', le(i, { touches: { e: { propres: 2, total: 3 } } }));
    b = enregistrer(b, 'decouverte', le(99, { touches: { e: { propres: 1, total: 1 } } }));
    expect(serieDe(fusionnerMesures(a, b), 'decouverte').touches.e).toEqual({ propres: 6, total: 9 });
  });

  it('les leçons d’avant la date — toutes à zéro — ne se dupliquent pas non plus', () => {
    /* Une sauvegarde d'avant #64 porte des leçons sans date : elles valent
       toutes 0. Les empiler les ferait grossir à chaque synchro ; on garde le
       lot le mieux fourni des deux, comme pour un multi-ensemble. */
    let a: Mesures = {};
    for (let i = 0; i < 5; i++) a = enregistrer(a, 'decouverte', le(0));
    let b: Mesures = {};
    for (let i = 0; i < 3; i++) b = enregistrer(b, 'decouverte', le(0));
    expect(serieDe(fusionnerMesures(a, b), 'decouverte').lecons).toHaveLength(5);
    expect(serieDe(fusionnerMesures(a, a), 'decouverte').lecons).toHaveLength(5);
  });

  it('un appareil qui ignore la date ne fait pas doubler l’historique', () => {
    /* Le cas réel du déploiement : un appareil resté au bundle d'avant #64
       relit les leçons sans `le` et les repousse toutes datées de 0. Une union
       qui se fierait à la date verrait deux fois chaque leçon — une fois datée,
       une fois à zéro — et l'historique doublerait à CHAQUE synchronisation. */
    let ici: Mesures = {};
    for (let i = 1; i <= 5; i++) ici = enregistrer(ici, 'decouverte', le(i * 100));
    const sansDate: Mesures = {
      decouverte: {
        touches: serieDe(ici, 'decouverte').touches,
        lecons: serieDe(ici, 'decouverte').lecons.map((l) => ({ ...l, le: 0 })),
      },
    };
    let f = fusionnerMesures(ici, sansDate);
    expect(serieDe(f, 'decouverte').lecons).toHaveLength(5);
    // Et ça ne dérive pas non plus au bout de cinq réconciliations.
    for (let i = 0; i < 5; i++) f = fusionnerMesures(f, sansDate);
    expect(serieDe(f, 'decouverte').lecons).toHaveLength(5);
    // La date connue survit : c'est elle qui ordonne la série.
    expect(serieDe(f, 'decouverte').lecons.map((l) => l.le)).toEqual([100, 200, 300, 400, 500]);
  });

  it('l’historique reste borné après fusion, et ce sont les plus VIEILLES qui partent', () => {
    let a: Mesures = {};
    let b: Mesures = {};
    for (let i = 0; i < MEMOIRE_LECONS; i++) a = enregistrer(a, 'dactylo', le(i + 1));
    for (let i = 0; i < 10; i++) b = enregistrer(b, 'dactylo', le(10_000 + i));
    const lecons = serieDe(fusionnerMesures(a, b), 'dactylo').lecons;
    expect(lecons).toHaveLength(MEMOIRE_LECONS);
    expect(lecons[lecons.length - 1].le).toBe(10_009);
  });

  it('ne mute ni l’un ni l’autre des appareils', () => {
    const a = enregistrer({}, 'decouverte', le(10));
    const b = enregistrer({}, 'decouverte', le(20));
    const copie = structuredClone(a);
    fusionnerMesures(a, b);
    expect(a).toEqual(copie);
  });
});

describe('une leçon vraiment jouée survit à la relecture', () => {
  /* `V4Lecon` mesure le temps avec `performance.now()`, qui rend des flottants.
     `leconsValides` n'accepte que des entiers : une durée fractionnaire faisait
     jeter la leçon ENTIÈRE à la relecture, sans un mot. Les mesures ne vivaient
     donc qu'en mémoire, et l'écran parent se vidait au premier rechargement —
     alors que les `touches`, elles, passaient, ce qui rendait le trou
     invisible. Le remède est à la source : la durée est arrondie en se
     fermant. */
  it('la durée d’une leçon close est un entier, même mesurée en flottant', () => {
    // Un seul item : le taper referme la leçon, et la durée s'inscrit.
    let e = creerEtat([{ texte: 'et', genre: 'mot' }] as Item[], 1000.5, 0);
    for (const c of 'et') {
      e = reducerLecon(e, {
        type: 'frappe',
        caractere: c,
        code: `Key${c.toUpperCase()}`,
        attendu: c,
        maintenant: 9999.75,
        debutant: true,
        id: 'fr-FR',
      } as ActionLecon);
    }
    /* La dernière frappe déclenche la célébration ; c'est le tic suivant qui
       fait avancer, constate qu'il n'y a plus d'item, et ferme la leçon. */
    e = reducerLecon(e, { type: 'tic', maintenant: 12_000.25 } as ActionLecon);
    expect(e.fini, 'la leçon devrait être close').toBe(true);
    expect(Number.isInteger(e.rapport.ms), `ms = ${e.rapport.ms}`).toBe(true);
  });

  it('une durée fractionnaire est bien jetée à la relecture — d’où l’arrondi', () => {
    /* Ce test tient l'autre bout : la validation ne se relâche PAS. Une durée
       non entière est la marque d'un fichier abîmé, et la leçon part. C'est
       exactement ce qui se produisait pour TOUTES les leçons. */
    const abimee = enregistrer({}, 'decouverte', rapport({ le: 42, ms: 4000.7 }));
    expect(serieDe(valider({ ...DEFAUTS, mesures: abimee }).mesures ?? {}, 'decouverte').lecons)
      .toHaveLength(0);
    const saine = enregistrer({}, 'decouverte', rapport({ le: 42, ms: 4001 }));
    expect(serieDe(valider({ ...DEFAUTS, mesures: saine }).mesures ?? {}, 'decouverte').lecons)
      .toHaveLength(1);
  });
});

describe('persistance', () => {
  it('les mesures traversent une sauvegarde et sa relecture', () => {
    const m = enregistrer({}, 'dactylo', rapport({ etape: 4, touches: { e: { propres: 1, total: 2 } } }));
    const relu = valider({ ...valider(null), mesures: m });
    expect(serieDe(relu.mesures ?? {}, 'dactylo').touches.e).toEqual({ propres: 1, total: 2 });
    expect(leconsDeLEtape(serieDe(relu.mesures ?? {}, 'dactylo'), 4)).toBe(1);
  });

  it('des mesures illisibles sont jetées, jamais la progression', () => {
    const brut = { ...valider(null), mesures: { dactylo: 'n’importe quoi', pouet: {} } };
    expect(serieDe(valider(brut).mesures ?? {}, 'dactylo').lecons).toEqual([]);
    expect(valider(brut).palier).toBe(1);
    // Elles ne rendent pas non plus la sauvegarde « corrompue » : une mesure
    // abîmée ne vaut pas de renvoyer l'enfant à sa sauvegarde de secours.
    expect(estIntact(brut)).toBe(true);
  });

  it('une sauvegarde d’avant les mesures reste intacte et lisible', () => {
    const ancienne = valider(null);
    delete (ancienne as Record<string, unknown>).mesures;
    expect(estIntact(ancienne)).toBe(true);
    expect(valider(ancienne).mesures).toBeUndefined();
  });
});

describe('un état qui ignore les mesures ne les efface pas', () => {
  /* `fusion.fusionner` reconstruit la sauvegarde champ par champ et n'a jamais
     entendu parler des mesures : son résultat repasse par `sauver` à chaque
     réconciliation avec le serveur. Sans garde, l'observation d'un enfant
     disparaîtrait à sa première synchro — et personne ne s'en apercevrait,
     puisque rien ne l'affiche. */
  it('une écriture sans mesures garde celles qui étaient déjà là', () => {
    const avec = valider({ ...valider(null), mesures: enregistrer({}, 'dactylo', rapport()) });
    sauver(avec, CLE);
    const sansMesures = { ...avec };
    delete sansMesures.mesures;
    sauver(sansMesures, CLE);
    expect(serieDe(charger(CLE).mesures ?? {}, 'dactylo').lecons).toHaveLength(1);
  });

  it('une série plus fournie remplace la série stockée du MÊME parcours', () => {
    sauver(valider({ ...valider(null), mesures: enregistrer({}, 'dactylo', rapport()) }), CLE);
    let deux = enregistrer({}, 'dactylo', rapport());
    deux = enregistrer(deux, 'dactylo', rapport());
    sauver(valider({ ...valider(null), mesures: deux }), CLE);
    expect(serieDe(charger(CLE).mesures ?? {}, 'dactylo').lecons).toHaveLength(2);
  });

  it('écrire la série d’un parcours ne touche pas celle de l’autre', () => {
    sauver(valider({ ...valider(null), mesures: enregistrer({}, 'decouverte', rapport()) }), CLE);
    sauver(valider({ ...valider(null), mesures: enregistrer({}, 'dactylo', rapport()) }), CLE);
    const relu = charger(CLE).mesures ?? {};
    expect(serieDe(relu, 'decouverte').lecons).toHaveLength(1);
    expect(serieDe(relu, 'dactylo').lecons).toHaveLength(1);
  });
});

describe('accroche dans l’état de l’app', () => {
  const etatJouable = (): EtatApp => ({
    ...etatDeDepart(),
    parcours: 'dactylo',
    etape: 5,
    listeJouee: null,
  });

  const bilan = (mesures?: RapportLecon): BilanBloc => ({
    etoiles: 1,
    propres: [],
    aRevoir: [],
    items: [],
    mesures,
    fin: 1_700_000_000_000,
  });

  it('une leçon finie range son rapport dans la série de SON parcours, à SON étape', () => {
    const apres = reducer(etatJouable(), {
      type: 'leconTerminee',
      bilan: bilan(rapport({ etape: 1, lettres: 300, ms: 60_000 })),
    });
    const serie = serieDe(apres.mesures ?? {}, 'dactylo');
    expect(serie.lecons).toHaveLength(1);
    // L'étape vient de l'ÉTAT, pas du rapport : la vue ne peut pas se tromper d'étiquette.
    expect(serie.lecons[0].etape).toBe(5);
    expect(vitesse(serie.lecons[0])).toBe(60);
    expect(apres.mesures?.decouverte).toBeUndefined();
    expect(aSauvegarder(apres).mesures).toBe(apres.mesures);
  });

  it('une leçon sans rapport ne casse rien et n’invente aucune mesure', () => {
    const apres = reducer(etatJouable(), { type: 'leconTerminee', bilan: bilan() });
    expect(serieDe(apres.mesures ?? {}, 'dactylo').lecons).toEqual([]);
    expect(apres.leconsSurEtape).toBe(1);
  });

  it('une LISTE de la maison ne mesure rien : elle est hors parcours', () => {
    const etat = { ...etatJouable(), listeJouee: { id: 'x', nom: 'Dictée', mots: ['chat'], creeLe: '2026-01-01' } };
    const apres = reducer(etat, {
      type: 'leconTerminee',
      bilan: bilan(rapport({ lettres: 300, ms: 60_000 })),
    });
    expect(apres.mesures ?? {}).toEqual({});
  });
});

/* #61 : tout ce module était testé, et RIEN ne l'appelait. Ce test-ci part des
   frappes et va jusqu'à la série du parcours — c'est le seul qui tombe si la
   chaîne se débranche à nouveau, en quelque point que ce soit. */
describe('la chaîne complète, de la frappe à la série du parcours', () => {
  const frappe = (caractere: string, maintenant: number, attendu: string): ActionLecon => ({
    type: 'frappe',
    caractere,
    code: `Key${caractere.toUpperCase()}`,
    attendu,
    maintenant,
    debutant: true,
    id: 'fr-FR',
    coherente: null,
  });

  it('une leçon jouée sort une vitesse, une précision et une fréquence de barreau 3', () => {
    const items = [
      { texte: 'et', genre: 'mot' },
      { texte: 'te', genre: 'mot' },
    ] as Item[];
    let l = creerEtat(items, 0, 0);
    // deux erreurs sur la première position : le dernier barreau se déclenche
    l = reducerLecon(l, frappe('x', 10, 'e'));
    l = reducerLecon(l, frappe('x', 20, 'e'));
    l = reducerLecon(l, frappe('e', 30, 'e'));
    l = reducerLecon(l, frappe('t', 40, 't'));
    l = reducerLecon(l, { type: 'tic', maintenant: 900 }); // fin de célébration
    l = reducerLecon(l, frappe('t', 910, 't'));
    l = reducerLecon(l, frappe('e', 920, 'e'));
    l = reducerLecon(l, { type: 'tic', maintenant: 1800 });
    expect(l.fini).toBe(true);

    const apres = reducer(
      { ...etatDeDepart(), parcours: 'dactylo', etape: 3, listeJouee: null },
      {
        type: 'leconTerminee',
        bilan: {
          etoiles: l.etoiles,
          propres: l.propres,
          aRevoir: l.aRevoir,
          items: l.valides,
          mesures: l.rapport,
          fin: 1_700_000_000_000,
        },
      },
    );
    const serie = serieDe(apres.mesures ?? {}, 'dactylo');
    expect(serie.lecons).toHaveLength(1);
    expect(vitesse(serie.lecons[0])).toBeGreaterThan(0);
    // quatre lettres écrites, deux fautes : la précision est connue, et < 1
    expect(precision(serie.lecons[0])).toBeCloseTo(4 / 6);
    expect(frequenceBarreau3(serie)).toBeGreaterThan(0);
    // et la série est bien celle du parcours joué, à l'étape de l'état
    expect(serie.lecons[0].etape).toBe(3);
    expect(apres.mesures?.decouverte).toBeUndefined();
  });
});

describe('rien de tout cela n’atteint l’enfant', () => {
  /* Le garde-fou est structurel : aucune vue n'importe le module. Le jour où
     une carte de fin de leçon voudrait afficher « 23 mots/minute », ce test
     tombe avant la revue. */
  /* `lecon.ts` compte les frappes (#61) : c'est le reducer de la leçon, pas un
     écran, et il est le seul à connaître le verdict, le barreau atteint et la
     propreté d'une position. Ce qu'il produit ne fait que TRAVERSER la vue,
     qui ne le lit pas — ce que le reste de ce test continue de vérifier. */
  /* `V9Compte.tsx` est l'espace PARENT, et #63 lui donne la lecture des deux
     séries : c'est le lecteur que §4.7 réclamait depuis le début. Il n'est pas
     sur le chemin de l'enfant — on n'y arrive que par les réglages, et rien de
     ce qu'il affiche ne redescend vers V1, V4 ou V5. Le garde-fou n'a pas
     sauté : il dit maintenant « aucun écran VU PAR L'ENFANT ». */
  const AUTORISES = new Set([
    'src/state.tsx',
    'src/core/storage.ts',
    'src/core/mesures.ts',
    'src/core/lecon.ts',
    /* `fusion.ts` réunit les séries de deux appareils depuis #64 : c'est de la
       réconciliation, pas de l'affichage — rien n'en ressort vers une vue. */
    'src/core/fusion.ts',
    'src/views/V9Compte.tsx',
  ]);

  function fichiers(dossier: string): string[] {
    return readdirSync(dossier).flatMap((nom) => {
      const chemin = join(dossier, nom);
      if (statSync(chemin).isDirectory()) return fichiers(chemin);
      return /\.(ts|tsx)$/.test(nom) && !nom.endsWith('.test.ts') ? [chemin] : [];
    });
  }

  it('aucun écran vu par l’enfant n’importe mesures.ts', () => {
    const coupables = fichiers('src').filter(
      (f) => !AUTORISES.has(f) && /from '[^']*\/mesures'/.test(readFileSync(f, 'utf8')),
    );
    expect(coupables).toEqual([]);
  });
});
