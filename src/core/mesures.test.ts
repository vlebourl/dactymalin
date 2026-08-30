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
  type Mesures,
  type RapportLecon,
} from './mesures';
import { LECONS_PAR_ETAPE } from './parcours';
import { CLE, charger, estIntact, sauver, valider } from './storage';
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

describe('rien de tout cela n’atteint l’enfant', () => {
  /* Le garde-fou est structurel : aucune vue n'importe le module. Le jour où
     une carte de fin de leçon voudrait afficher « 23 mots/minute », ce test
     tombe avant la revue. */
  const AUTORISES = new Set(['src/state.tsx', 'src/core/storage.ts', 'src/core/mesures.ts']);

  function fichiers(dossier: string): string[] {
    return readdirSync(dossier).flatMap((nom) => {
      const chemin = join(dossier, nom);
      if (statSync(chemin).isDirectory()) return fichiers(chemin);
      return /\.(ts|tsx)$/.test(nom) && !nom.endsWith('.test.ts') ? [chemin] : [];
    });
  }

  it('aucune vue, aucun composant n’importe mesures.ts', () => {
    const coupables = fichiers('src').filter(
      (f) => !AUTORISES.has(f) && /from '[^']*\/mesures'/.test(readFileSync(f, 'utf8')),
    );
    expect(coupables).toEqual([]);
  });
});
