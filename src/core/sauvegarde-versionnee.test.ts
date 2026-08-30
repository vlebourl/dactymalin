import { beforeEach, describe, expect, it } from 'vitest';
import {
  avecProgression,
  charger,
  DEFAUTS,
  estIntact,
  MODELE,
  progressionDe,
  sauver,
  valider,
  type Sauvegarde,
  CLE_PROGRESSION_MAX,
  PROGRESSIONS_MAX,
} from './storage';
import { PALIER_MAX } from './paliers';
import { ETAPE_MAX, LECONS_PAR_ETAPE } from './parcours';

/** Faux localStorage : `core/` doit rester testable en env node. */
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

beforeEach(() => {
  globalThis.localStorage = new FauxStockage() as unknown as Storage;
});

/** Une sauvegarde v1 telle qu'un appareil de production en porte une. */
const v1 = (p: Record<string, unknown> = {}) => ({
  version: 1,
  disposition: 'fr-FR',
  dispositionChoisieALaMain: true,
  palier: 5,
  blocsSurPalier: 3,
  bloc: 42,
  maitrise: { e: [1, 2, 3], s: [4] },
  guideDoigtVu: true,
  reglages: { sons: false, texteEspace: true, animationsDouces: false },
  ...p,
});

/* ------------------------------------------------------------------------ */
/* L'ANCIEN CLIENT, tel qu'il est déployé aujourd'hui.                       */
/*                                                                           */
/* Réplique du contrat de lecture du bundle en production : `estIntact` y     */
/* exige `version === 1` et un `palier` dans [1, PALIER_MAX], et `valider` y  */
/* reconstruit un état à partir des SEULS champs qu'il connaît. Un état qui   */
/* échoue ce contrat est traité comme corrompu : repli sur la sauvegarde de   */
/* secours, sinon remise à zéro — et le serveur, resté lui aussi sur l'ancien */
/* code, répondrait 400, ce que la file d'envoi jette DÉFINITIVEMENT.         */
/* C'est pourquoi le nouveau format reste lisible par lui.                    */
/* ------------------------------------------------------------------------ */
function ancienEstIntact(brut: unknown): boolean {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return false;
  const o = brut as Record<string, unknown>;
  const entier = (v: unknown, min: number, max: number) =>
    typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
  if (o.version !== 1) return false;
  if (o.disposition !== 'fr-FR' && o.disposition !== 'fr-CH') return false;
  if (typeof o.dispositionChoisieALaMain !== 'boolean') return false;
  if (!entier(o.palier, 1, PALIER_MAX)) return false;
  if (!entier(o.blocsSurPalier, 0, 999)) return false;
  if (o.bloc !== undefined && !entier(o.bloc, 1, 1_000_000)) return false;
  if (typeof o.guideDoigtVu !== 'boolean') return false;
  if (!o.maitrise || typeof o.maitrise !== 'object' || Array.isArray(o.maitrise)) return false;
  const r = o.reglages as Record<string, unknown> | undefined;
  if (!r || typeof r !== 'object') return false;
  return (['sons', 'texteEspace', 'animationsDouces'] as const).every(
    (c) => typeof r[c] === 'boolean',
  );
}

/** Ce que l'ancien client RÉÉCRIT : il ne connaît que ses propres champs. */
function ancienValider(brut: Record<string, unknown>) {
  return {
    version: 1,
    disposition: brut.disposition,
    dispositionChoisieALaMain: brut.dispositionChoisieALaMain,
    palier: brut.palier,
    blocsSurPalier: brut.blocsSurPalier,
    bloc: brut.bloc,
    maitrise: brut.maitrise,
    guideDoigtVu: brut.guideDoigtVu,
    reglages: brut.reglages,
  };
}

describe("migration d'une sauvegarde v1", () => {
  it('porte le palier et les blocs vers la progression Découverte de sa disposition', () => {
    const s = valider(v1());
    expect(progressionDe(s, 'decouverte', 'fr-FR')).toEqual({ etape: 5, leconsSurEtape: 3 });
  });

  it('ne perd aucun autre champ au passage', () => {
    const s = valider(v1());
    expect(s.bloc).toBe(42);
    expect(s.maitrise).toEqual({ e: [1, 2, 3], s: [4] });
    expect(s.guideDoigtVu).toBe(true);
    expect(s.reglages).toEqual({ sons: false, texteEspace: true, animationsDouces: false });
    expect(s.dispositionChoisieALaMain).toBe(true);
  });

  it('migre vers la disposition RÉELLEMENT jouée, pas vers fr-FR par défaut', () => {
    const s = valider(v1({ disposition: 'fr-CH' }));
    expect(progressionDe(s, 'decouverte', 'fr-CH')).toEqual({ etape: 5, leconsSurEtape: 3 });
    expect(progressionDe(s, 'decouverte', 'fr-FR')).toEqual({ etape: 1, leconsSurEtape: 0 });
  });

  it("n'invente aucune avance en Dactylo : l'enfant n'y a jamais joué", () => {
    const s = valider(v1());
    expect(progressionDe(s, 'dactylo', 'fr-FR')).toEqual({ etape: 1, leconsSurEtape: 0 });
    expect(progressionDe(s, 'dactylo', 'fr-CH')).toEqual({ etape: 1, leconsSurEtape: 0 });
  });

  it('le format migré porte son numéro de modèle', () => {
    expect(valider(v1()).modele).toBe(MODELE);
  });

  it('rejouer la migration ne change RIEN', () => {
    const une = valider(v1());
    const deux = valider(une);
    expect(deux).toEqual(une);
    expect(valider(deux)).toEqual(une);
  });

  it("rejouée sur une sauvegarde déjà migrée, elle n'écrase pas la progression", () => {
    const migre = avecProgression(valider(v1()), 'dactylo', 'fr-FR', {
      etape: 3,
      leconsSurEtape: 2,
    });
    expect(valider(migre)).toEqual(migre);
    expect(progressionDe(valider(migre), 'dactylo', 'fr-FR')).toEqual({
      etape: 3,
      leconsSurEtape: 2,
    });
  });
});

describe('progression indexée par couple parcours × disposition', () => {
  it('les quatre couples sont indépendants', () => {
    let s = DEFAUTS;
    s = avecProgression(s, 'decouverte', 'fr-FR', { etape: 4, leconsSurEtape: 1 });
    s = avecProgression(s, 'dactylo', 'fr-CH', { etape: 2, leconsSurEtape: 6 });
    expect(progressionDe(s, 'decouverte', 'fr-FR')).toEqual({ etape: 4, leconsSurEtape: 1 });
    expect(progressionDe(s, 'dactylo', 'fr-CH')).toEqual({ etape: 2, leconsSurEtape: 6 });
    expect(progressionDe(s, 'decouverte', 'fr-CH')).toEqual({ etape: 1, leconsSurEtape: 0 });
    expect(progressionDe(s, 'dactylo', 'fr-FR')).toEqual({ etape: 1, leconsSurEtape: 0 });
  });

  it('une étape hors domaine est bornée, une progression bancale est ignorée', () => {
    const s = valider({
      ...v1(),
      progressions: {
        'decouverte:fr-FR': { etape: 99, leconsSurEtape: 0 },
        'dactylo:fr-FR': { etape: 2, leconsSurEtape: -1 },
        'sournois:fr-FR': { etape: 4, leconsSurEtape: 0 },
      },
    });
    expect(progressionDe(s, 'decouverte', 'fr-FR').etape).toBeLessThanOrEqual(ETAPE_MAX);
    expect(progressionDe(s, 'dactylo', 'fr-FR')).toEqual({ etape: 1, leconsSurEtape: 0 });
    /* Une clé qu'on ne comprend PAS n'est pas une injection : c'est peut-être
       un parcours qu'un client plus récent connaît déjà. La jeter revenait à
       effacer sa progression à chaque fusion, silencieusement. On la garde
       telle quelle, sans jamais l'interpréter. */
    expect(Object.keys(s.progressions ?? {})).toContain('sournois:fr-FR');
    expect(s.progressions?.['sournois:fr-FR' as keyof typeof s.progressions]).toEqual({
      etape: 4,
      leconsSurEtape: 0,
    });
  });

  /* Ce qu'il faut vraiment refuser : une clé mal formée, et un état qui grossit
     sans fin. Pas un parcours qu'on ne connaît pas encore. */
  it('refuse une clé de progression mal formée', () => {
    const s = valider({
      ...v1(),
      progressions: {
        'sans-deux-points': { etape: 2, leconsSurEtape: 0 },
        '__proto__': { etape: 2, leconsSurEtape: 0 },
        ['x'.repeat(200) + ':fr-FR']: { etape: 2, leconsSurEtape: 0 },
      },
    });
    for (const cle of Object.keys(s.progressions ?? {})) {
      expect(cle).toMatch(/^[a-z0-9-]+:[a-zA-Z0-9-]+$/);
      expect(cle.length).toBeLessThanOrEqual(CLE_PROGRESSION_MAX);
    }
  });

  it("borne le nombre de progressions qu'un pair peut faire stocker", () => {
    const brut: Record<string, unknown> = {};
    for (let k = 0; k < 200; k++) brut[`parcours${k}:fr-FR`] = { etape: 1, leconsSurEtape: 0 };
    const s = valider({ ...v1(), progressions: brut });
    /* La migration ajoute au passage la clé de Découverte : le plafond porte
       sur ce qu'un pair peut FAIRE STOCKER, pas sur ce que l'app se doit à
       elle-même. */
    expect(Object.keys(s.progressions ?? {}).length).toBeLessThanOrEqual(PROGRESSIONS_MAX + 1);
  });

  it("une clé future traverse lecture puis écriture sans changer", () => {
    const s = valider({ ...v1(), progressions: { 'troisieme:fr-CH': { etape: 5, leconsSurEtape: 3 } } });
    const relu = valider(JSON.parse(JSON.stringify(s)));
    expect(relu.progressions).toEqual(s.progressions);
  });

  it('survit à des progressions franchement corrompues', () => {
    for (const brut of [null, [], 'zut', 42, { 'decouverte:fr-FR': 3 }]) {
      expect(() => valider({ ...v1(), progressions: brut })).not.toThrow();
      expect(valider({ ...v1(), progressions: brut }).palier).toBe(5);
    }
  });

  it("une étape au-delà de la 7e tient dans le modèle, jusqu'à la 10e", () => {
    const s = avecProgression(DEFAUTS, 'decouverte', 'fr-FR', {
      etape: ETAPE_MAX,
      leconsSurEtape: LECONS_PAR_ETAPE - 1,
    });
    expect(progressionDe(s, 'decouverte', 'fr-FR').etape).toBe(ETAPE_MAX);
  });
});

describe("un client resté sur l'ancien bundle", () => {
  it('lit une sauvegarde au nouveau format sans la croire corrompue', () => {
    const neuf = valider(v1());
    expect(ancienEstIntact(neuf)).toBe(true);
  });

  it("y retrouve l'étape de Découverte dans le palier qu'il connaît", () => {
    const neuf = avecProgression(valider(v1()), 'decouverte', 'fr-FR', {
      etape: 6,
      leconsSurEtape: 2,
    });
    expect(neuf.palier).toBe(6);
    expect(neuf.blocsSurPalier).toBe(2);
  });

  it("reste valide même quand l'enfant dépasse le dernier palier qu'il connaissait", () => {
    const neuf = avecProgression(valider(v1()), 'decouverte', 'fr-FR', {
      etape: ETAPE_MAX,
      leconsSurEtape: 4,
    });
    expect(ancienEstIntact(neuf)).toBe(true);
    expect(neuf.palier).toBe(PALIER_MAX);
  });

  it("sa réécriture — qui efface les champs neufs — ne perd pas Découverte", () => {
    const neuf = avecProgression(valider(v1()), 'decouverte', 'fr-FR', {
      etape: 6,
      leconsSurEtape: 2,
    });
    const ancien = ancienValider(neuf as unknown as Record<string, unknown>);
    expect(ancien).not.toHaveProperty('progressions');
    const relu = valider(ancien);
    expect(progressionDe(relu, 'decouverte', 'fr-FR')).toEqual({ etape: 6, leconsSurEtape: 2 });
  });

  it("une avance faite sur l'ancien bundle est reprise par le nouveau", () => {
    const neuf = valider(v1({ palier: 2 }));
    /* L'enfant a joué sur la tablette restée à l'ancien bundle : elle n'a
       écrit que `palier`, et c'est plus avancé que ce que le modèle porte. */
    const ancien = { ...ancienValider(neuf as unknown as Record<string, unknown>), palier: 6 };
    expect(progressionDe(valider(ancien), 'decouverte', 'fr-FR').etape).toBe(6);
  });
});

describe("l'écriture ne perd pas ce qu'elle ne connaît pas", () => {
  it('sauver un état sans progressions garde celles déjà en place', () => {
    const cle = 'tapeavecmoi.v1.enfant';
    sauver(avecProgression(valider(v1()), 'dactylo', 'fr-FR', { etape: 3, leconsSurEtape: 5 }), cle);
    /* Ce que produit un producteur d'état resté sur l'ancien modèle. */
    const sansModele = ancienValider(v1({ palier: 6 })) as unknown as Sauvegarde;
    sauver(sansModele, cle);
    const relu = charger(cle);
    expect(progressionDe(relu, 'dactylo', 'fr-FR')).toEqual({ etape: 3, leconsSurEtape: 5 });
    expect(progressionDe(relu, 'decouverte', 'fr-FR').etape).toBe(6);
  });
});

describe("contrôle d'intégrité du nouveau format", () => {
  it('accepte une sauvegarde au nouveau format', () => {
    expect(estIntact(valider(v1()))).toBe(true);
  });

  it("accepte une sauvegarde v1, qui n'a rien d'invalide", () => {
    expect(estIntact(v1())).toBe(true);
  });

  it("refuse des progressions qui ne sont pas un objet de progressions", () => {
    expect(estIntact({ ...v1(), progressions: [] })).toBe(false);
    expect(estIntact({ ...v1(), progressions: { 'decouverte:fr-FR': { etape: 'trois' } } })).toBe(
      false,
    );
  });

  it("accepte un modèle PLUS RÉCENT que le sien : ses champs connus restent lisibles", () => {
    expect(estIntact({ ...valider(v1()), modele: MODELE + 1 })).toBe(true);
  });
});
