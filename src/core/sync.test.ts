import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  adopterProgressionHistorique,
  compteCourant,
  compteEnCache,
  creerListeDistante,
  listesDistantes,
  modifierListeDistante,
  supprimerLeCompte,
  supprimerListeDistante,
  CLE_FILE,
  CLE_MAJ,
  deconnecter,
  enAttente,
  pousser,
  synchroniserProfils,
  viderLaFile,
} from './sync';
import { CLE_PROFILS, chargerIndex, cleDe, remplacerIndex } from './profils';
import {
  CLE,
  DEFAUTS,
  charger,
  progressionDe,
  sauver,
  valider,
  type Sauvegarde,
} from './storage';

/** Faux stockage : `core/` doit rester testable en env node (cf. profils.test.ts). */
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

type Distant = { id: string; prenom: string; etat: Sauvegarde | null; majLe: string | null };

const rep = (corps: unknown, status = 200) =>
  new Response(JSON.stringify(corps), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * Faux serveur minimal : la liste des profils et le PUT de progression, avec
 * la règle qui compte — un état plus ANCIEN que celui en base est refusé (409).
 */
function serveur(distants: Distant[]) {
  const puts: { id: string; etat: Sauvegarde; majLe: string }[] = [];
  let horsLigne = false;
  const fetchFaux = vi.fn(async (url: string, init?: RequestInit) => {
    if (horsLigne) throw new TypeError('Failed to fetch');
    const progression = url.match(/^\/api\/profils\/(.+)\/progression$/);
    if (progression && init?.method === 'PUT') {
      const id = progression[1];
      const corps = JSON.parse(String(init.body)) as { etat: Sauvegarde; majLe: string };
      const cible = distants.find((d) => d.id === id)!;
      if (cible.majLe && Date.parse(cible.majLe) > Date.parse(corps.majLe)) {
        return rep({ erreur: 'version plus récente en base' }, 409);
      }
      puts.push({ id, ...corps });
      cible.etat = corps.etat;
      cible.majLe = corps.majLe;
      return rep({ majLe: corps.majLe });
    }
    if (url === '/api/profils' && init?.method === 'POST') {
      const { prenom } = JSON.parse(String(init.body)) as { prenom: string };
      const cree = { id: `d${distants.length + 1}`, prenom, etat: null, majLe: null };
      distants.push(cree);
      return rep({ id: cree.id, prenom }, 201);
    }
    if (url === '/api/profils') return rep({ profils: distants });
    return rep({ ok: true });
  });
  vi.stubGlobal('fetch', fetchFaux);
  return {
    puts,
    fetchFaux,
    couper: () => void (horsLigne = true),
    rebrancher: () => void (horsLigne = false),
  };
}

beforeEach(() => {
  globalThis.localStorage = new FauxStockage() as unknown as Storage;
  globalThis.sessionStorage = new FauxStockage() as unknown as Storage;
});
afterEach(() => vi.unstubAllGlobals());

describe('file d’attente des progressions', () => {
  it('un envoi part tout de suite et la file se vide', async () => {
    const s = serveur([{ id: 'a', prenom: 'Timo', etat: null, majLe: null }]);
    await pousser('a', { ...DEFAUTS, palier: 3 });
    expect(s.puts.map((p) => p.etat.palier)).toEqual([3]);
    expect(enAttente()).toBe(0);
  });

  it('hors ligne, l’envoi ATTEND ; au retour du réseau il part une seule fois', async () => {
    const s = serveur([{ id: 'a', prenom: 'Timo', etat: null, majLe: null }]);
    s.couper();
    await pousser('a', { ...DEFAUTS, palier: 3 });
    expect(enAttente()).toBe(1);
    expect(s.puts).toHaveLength(0);

    s.rebrancher();
    await viderLaFile();
    await viderLaFile();
    expect(s.puts).toHaveLength(1);
    expect(enAttente()).toBe(0);
  });

  it('une seule entrée par profil : le rejeu n’envoie que le plus récent', async () => {
    const s = serveur([{ id: 'a', prenom: 'Timo', etat: null, majLe: null }]);
    s.couper();
    await pousser('a', { ...DEFAUTS, palier: 2 });
    await pousser('a', { ...DEFAUTS, palier: 4 });
    expect(enAttente()).toBe(1);

    s.rebrancher();
    await viderLaFile();
    expect(s.puts.map((p) => p.etat.palier)).toEqual([4]);
  });

  it('un envoi que le serveur refusera TOUJOURS est jeté, il ne bloque pas la suite', async () => {
    const s = serveur([{ id: 'a', prenom: 'Timo', etat: null, majLe: null }]);
    /* Profil supprimé sur un autre appareil : 404 à chaque tentative. Gardé en
       tête de file, il condamnait toutes les progressions suivantes. */
    s.fetchFaux.mockImplementationOnce(async () => rep({ erreur: 'profil introuvable' }, 404));
    await pousser('a', { ...DEFAUTS, palier: 3 });
    expect(enAttente()).toBe(0);

    await pousser('a', { ...DEFAUTS, palier: 4 });
    expect(s.puts.map((p) => p.etat.palier)).toEqual([4]);
  });

  it('un état corrompu n’entre jamais dans la file', async () => {
    const s = serveur([{ id: 'a', prenom: 'Timo', etat: null, majLe: null }]);
    await pousser('a', { ...DEFAUTS, palier: 99 } as unknown as Sauvegarde);
    expect(enAttente()).toBe(0);
    expect(s.puts).toHaveLength(0);
  });
});

describe('conflit de version', () => {
  it('un 409 est rejoué UNE fois, fusionné, et la file se vide', async () => {
    const plusRecent = new Date(Date.now() + 60_000).toISOString();
    const s = serveur([
      { id: 'a', prenom: 'Timo', etat: { ...DEFAUTS, palier: 5 }, majLe: plusRecent },
    ]);
    await pousser('a', { ...DEFAUTS, palier: 3, guideDoigtVu: true });

    /* Un seul rejeu, et il porte la FUSION : le palier du serveur (plus
       avancé) et l'acquis local, aucun des deux perdu. */
    expect(s.puts).toHaveLength(1);
    expect(s.puts[0].etat.palier).toBe(5);
    expect(s.puts[0].etat.guideDoigtVu).toBe(true);
    expect(enAttente()).toBe(0);
  });

  it('un second 409 ne relance PAS de boucle : l’envoi reste en attente', async () => {
    const s = serveur([{ id: 'a', prenom: 'Timo', etat: { ...DEFAUTS, palier: 5 }, majLe: null }]);
    /* Le serveur refuse tout, même le rejeu : c'est le cas pathologique. */
    s.fetchFaux.mockImplementation(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'PUT') return rep({ erreur: 'conflit' }, 409);
      return rep({
        profils: [
          { id: 'a', prenom: 'Timo', etat: { ...DEFAUTS, palier: 5 }, majLe: new Date().toISOString() },
        ],
      });
    });

    await pousser('a', { ...DEFAUTS, palier: 3 });
    const puts = s.fetchFaux.mock.calls.filter(([, i]) => (i as RequestInit)?.method === 'PUT');
    expect(puts).toHaveLength(2); // l'envoi, puis UN rejeu — pas davantage
    expect(enAttente()).toBe(1);
  });
});

describe('les profils viennent du compte', () => {
  it('le cache local reprend la liste du serveur, identifiants compris', async () => {
    serveur([
      { id: 'd1', prenom: 'Timo', etat: null, majLe: null },
      { id: 'd2', prenom: 'Zoé', etat: null, majLe: null },
    ]);
    await synchroniserProfils();
    expect(chargerIndex().liste).toEqual([
      { id: 'd1', nom: 'Timo' },
      { id: 'd2', nom: 'Zoé' },
    ]);
  });

  it('deux enfants du même prénom restent deux profils, avec deux progressions', async () => {
    serveur([
      { id: 'd1', prenom: 'Timo', etat: { ...DEFAUTS, palier: 6 }, majLe: new Date().toISOString() },
      { id: 'd2', prenom: 'Timo', etat: { ...DEFAUTS, palier: 1 }, majLe: new Date().toISOString() },
    ]);
    await synchroniserProfils();
    expect(chargerIndex().liste).toHaveLength(2);
    expect(charger(cleDe('d1')).palier).toBe(6);
    expect(charger(cleDe('d2')).palier).toBe(1);
  });

  it('un profil connu du serveur mais absent d’ici arrive avec sa progression', async () => {
    serveur([
      { id: 'd1', prenom: 'Timo', etat: { ...DEFAUTS, palier: 4 }, majLe: new Date().toISOString() },
    ]);
    await synchroniserProfils();
    expect(charger(cleDe('d1')).palier).toBe(4);
  });

  it('deux appels concurrents ne lisent le compte qu’une fois', async () => {
    const s = serveur([{ id: 'd1', prenom: 'Timo', etat: null, majLe: null }]);
    await Promise.all([synchroniserProfils(), synchroniserProfils()]);
    const listes = s.fetchFaux.mock.calls.filter(
      ([u, i]) => u === '/api/profils' && (i as RequestInit)?.method === undefined,
    );
    expect(listes).toHaveLength(1);
  });
});

describe('réconciliation : l’appareil local ne gagne plus par principe', () => {
  /* États passés par `valider` : c'est sous cette forme-là — miroir legacy ET
     progression par parcours — qu'ils circulent réellement entre appareils. */
  const local: Sauvegarde = valider({
    ...DEFAUTS,
    palier: 3,
    reglages: { sons: true, texteEspace: false, animationsDouces: true },
  });
  const distant: Sauvegarde = valider({
    ...DEFAUTS,
    palier: 3,
    reglages: { sons: false, texteEspace: true, animationsDouces: false },
  });

  it('les préférences du serveur gagnent quand elles sont plus récentes', async () => {
    sauver(local, cleDe('d1'));
    localStorage.setItem(CLE_MAJ, JSON.stringify({ d1: '2026-08-01T10:00:00.000Z' }));
    serveur([{ id: 'd1', prenom: 'Timo', etat: distant, majLe: '2026-08-02T10:00:00.000Z' }]);

    await synchroniserProfils();
    expect(charger(cleDe('d1')).reglages).toEqual(distant.reglages);
  });

  it('les préférences locales gagnent quand ce sont elles les plus récentes', async () => {
    sauver(local, cleDe('d1'));
    localStorage.setItem(CLE_MAJ, JSON.stringify({ d1: '2026-08-03T10:00:00.000Z' }));
    const s = serveur([
      { id: 'd1', prenom: 'Timo', etat: distant, majLe: '2026-08-02T10:00:00.000Z' },
    ]);

    await synchroniserProfils();
    expect(charger(cleDe('d1')).reglages).toEqual(local.reglages);
    /* et la fusion repart vers le serveur : l'autre appareil la verra */
    expect(s.puts).toHaveLength(1);
  });

  it('une progression v1 venue du serveur est migrée ici, et repartira migrée', async () => {
    /* Ce que le serveur porte pour un enfant qui jouait avant la mise à jour :
       ni modèle, ni progressions — un palier, et c'est tout. */
    const v1 = { ...DEFAUTS, palier: 4, blocsSurPalier: 2, modele: undefined, progressions: undefined };
    sauver(v1, cleDe('d1'));
    localStorage.setItem(CLE_MAJ, JSON.stringify({ d1: '2026-08-01T10:00:00.000Z' }));
    const s = serveur([
      { id: 'd1', prenom: 'Timo', etat: v1, majLe: '2026-08-02T10:00:00.000Z' },
    ]);

    await synchroniserProfils();
    expect(progressionDe(charger(cleDe('d1')), 'decouverte', 'fr-FR')).toEqual({
      etape: 4,
      leconsSurEtape: 2,
    });
    /* La migration remonte au compte, UNE fois : les autres appareils la
       trouveront déjà faite. */
    expect(s.puts).toHaveLength(1);
    expect(progressionDe(s.puts[0].etat, 'decouverte', 'fr-FR').etape).toBe(4);
  });

  it('rien à dire de neuf : aucun envoi inutile', async () => {
    sauver(distant, cleDe('d1'));
    localStorage.setItem(CLE_MAJ, JSON.stringify({ d1: '2026-08-01T10:00:00.000Z' }));
    const s = serveur([
      { id: 'd1', prenom: 'Timo', etat: distant, majLe: '2026-08-02T10:00:00.000Z' },
    ]);

    await synchroniserProfils();
    expect(s.puts).toHaveLength(0);
  });

  it('une copie locale sans horodatage garde ses acquis et rend les préférences', async () => {
    /* L'horodatage local peut manquer (clé perdue, stockage refusé une fois) :
       la progression ne doit pas être écrasée pour autant. */
    sauver({ ...local, palier: 6 }, cleDe('d1'));
    serveur([{ id: 'd1', prenom: 'Timo', etat: distant, majLe: '2026-08-02T10:00:00.000Z' }]);

    await synchroniserProfils();
    const apres = charger(cleDe('d1'));
    expect(apres.palier).toBe(6); // l'acquis local survit
    expect(apres.reglages).toEqual(distant.reglages); // les préférences reviennent au serveur
  });

  it('une progression locale que le serveur ignore encore lui est envoyée', async () => {
    sauver({ ...DEFAUTS, palier: 7 }, cleDe('d1'));
    localStorage.setItem(CLE_MAJ, JSON.stringify({ d1: '2026-08-01T10:00:00.000Z' }));
    const s = serveur([{ id: 'd1', prenom: 'Timo', etat: null, majLe: null }]);

    await synchroniserProfils();
    expect(s.puts.map((p) => p.etat.palier)).toEqual([7]);
  });
});

describe('reprise de la progression d’avant les identifiants serveur', () => {
  it('la clé historique rejoint le premier enfant créé, puis disparaît', async () => {
    const s = serveur([{ id: 'd1', prenom: 'Timo', etat: null, majLe: null }]);
    sauver({ ...DEFAUTS, palier: 5, guideDoigtVu: true }, CLE);

    await adopterProgressionHistorique('d1');

    expect(charger(cleDe('d1')).palier).toBe(5);
    expect(localStorage.getItem(CLE)).toBeNull();
    expect(localStorage.getItem(`${CLE}.backup`)).toBeNull();
    /* Et le compte la reçoit : c'est ce qui la rend visible sur la tablette. */
    expect(s.puts.map((p) => p.etat.palier)).toEqual([5]);
  });

  it('rien à reprendre sur un appareil neuf : la progression du profil n’est pas touchée', async () => {
    const s = serveur([{ id: 'd1', prenom: 'Timo', etat: null, majLe: null }]);
    sauver({ ...DEFAUTS, palier: 2 }, cleDe('d1'));

    await adopterProgressionHistorique('d1');

    expect(charger(cleDe('d1')).palier).toBe(2);
    expect(s.puts).toHaveLength(0);
  });

  it('une clé historique illisible est ignorée, jamais reprise', async () => {
    const s = serveur([{ id: 'd1', prenom: 'Timo', etat: null, majLe: null }]);
    localStorage.setItem(CLE, '{"version":1,"palier":"beaucoup"}');

    await adopterProgressionHistorique('d1');

    expect(charger(cleDe('d1')).palier).toBe(DEFAUTS.palier);
    expect(s.puts).toHaveLength(0);
  });
});

/**
 * #3 — l'app ne s'ouvre sur un écran de connexion qu'AU PREMIER LANCEMENT.
 * Ensuite elle démarre hors ligne tant que la session dure : l'enfant doit
 * pouvoir s'entraîner dans le train.
 *
 * Le portail se décide sur `compteCourant`, qui jusqu'ici rendait `null` dès
 * que le réseau manquait — donc « pas de réseau » et « pas de compte »
 * disaient la même chose, et le train renvoyait au formulaire de connexion.
 */
describe('démarrage hors ligne', () => {
  const COMPTE = { id: 'u1', email: 'parent@exemple.fr', name: 'Parent' };

  /** Faux serveur de SESSION : il répond, ou la coupure le rend injoignable. */
  function session(user: unknown, { coupe = false } = {}) {
    const appels = vi.fn(async (url: string) => {
      if (coupe) throw new TypeError('Failed to fetch');
      if (url === '/api/auth/get-session') return rep(user ? { user } : null);
      return rep({ ok: true });
    });
    vi.stubGlobal('fetch', appels);
    return appels;
  }

  it('retient le compte quand le serveur répond', async () => {
    session(COMPTE);
    expect(await compteCourant()).toEqual(COMPTE);
    expect(compteEnCache()).toEqual(COMPTE);
  });

  it('démarre sur le compte connu quand le réseau manque', async () => {
    session(COMPTE);
    await compteCourant();

    session(null, { coupe: true });
    expect(await compteCourant()).toEqual(COMPTE);
  });

  /* Un appareil qui n'a JAMAIS vu de session ne s'invente pas de compte :
     hors ligne au premier lancement, le portail reprend la main et dit qu'il
     ne joint pas le serveur. */
  it('n’invente pas de compte sur un appareil neuf', async () => {
    session(null, { coupe: true });
    expect(await compteCourant()).toBeNull();
  });

  /* La session a réellement expiré : le SERVEUR a répondu, et il dit non. Le
     souvenir doit partir, sinon l'appareil resterait bloqué sur un compte que
     le serveur ne reconnaît plus. */
  it('oublie le compte quand le serveur dit que la session a expiré', async () => {
    session(COMPTE);
    await compteCourant();

    session(null);
    expect(await compteCourant()).toBeNull();
    expect(compteEnCache()).toBeNull();

    // et le souvenir ne revient pas au premier trou de réseau suivant
    session(null, { coupe: true });
    expect(await compteCourant()).toBeNull();
  });

  it('oublie le compte à la déconnexion', async () => {
    session(COMPTE);
    await compteCourant();
    await deconnecter();
    expect(compteEnCache()).toBeNull();
  });
});

/**
 * #11 — hors ligne, l'enfant retrouve les listes déjà connues de l'appareil et
 * peut les jouer. Le cache est en LECTURE SEULE : il ne se remplit que de ce
 * que le serveur a dit, jamais d'une intention locale.
 *
 * Rien n'est mis en file d'attente. Préparer une liste est un geste posé, à la
 * maison ; l'édition hors ligne apporterait des conflits d'édition (deux
 * appareils qui renomment la même liste) pour un cas qui n'arrivera pas.
 */
describe('cache des listes, en lecture seule', () => {
  const DICTEE = { id: 'l1', nom: 'Dictée', mots: ['papa'], creeLe: '2026-08-29T10:00:00.000Z' };

  /** Faux serveur de bibliothèque, coupable de tomber quand on le lui demande. */
  function bibliotheque(listes: unknown[], { coupe = false } = {}) {
    const appels = vi.fn(async (url: string, init?: RequestInit) => {
      if (coupe) throw new TypeError('Failed to fetch');
      if (url === '/api/listes' && !init?.method) return rep({ listes });
      return rep({ ok: true }, 201);
    });
    vi.stubGlobal('fetch', appels);
    return appels;
  }

  it('garde ce que le serveur a dit, et le rend quand il ne répond plus', async () => {
    bibliotheque([DICTEE]);
    expect(await listesDistantes()).toEqual([DICTEE]);

    bibliotheque([], { coupe: true });
    expect(await listesDistantes()).toEqual([DICTEE]);
  });

  it('un appareil qui n’a jamais rien reçu ne rend rien', async () => {
    bibliotheque([], { coupe: true });
    expect(await listesDistantes()).toEqual([]);
  });

  /* Le serveur fait foi dès qu'il répond : une liste supprimée ailleurs
     disparaît d'ici, elle ne survit pas dans le cache. */
  it('le serveur qui répond remplace le cache, suppressions comprises', async () => {
    bibliotheque([DICTEE]);
    await listesDistantes();

    bibliotheque([]);
    expect(await listesDistantes()).toEqual([]);

    bibliotheque([], { coupe: true });
    expect(await listesDistantes()).toEqual([]);
  });

  /* LECTURE SEULE : une création refusée par le réseau ne doit rien laisser
     derrière elle — ni dans le cache, ni dans une file. */
  it('une création hors ligne échoue, sans rien mettre en attente', async () => {
    bibliotheque([DICTEE]);
    await listesDistantes();

    bibliotheque([], { coupe: true });
    await expect(creerListeDistante('Nouvelle', ['chat'])).rejects.toThrow();
    await expect(modifierListeDistante('l1', 'Renommée', ['chat'])).rejects.toThrow();
    await expect(supprimerListeDistante('l1')).rejects.toThrow();

    expect(enAttente()).toBe(0);
    // le cache n'a pas bougé : il ne connaît que ce que le serveur a dit
    expect(await listesDistantes()).toEqual([DICTEE]);
  });

  /* Une PANNE n'est pas une absence de réseau. Servir le cache sur un 500
     ferait passer un serveur cassé pour un fonctionnement normal, et le parent
     modifierait une bibliothèque qu'il croit à jour. */
  it('une erreur du serveur remonte à l’écran, elle ne sert pas le cache', async () => {
    bibliotheque([DICTEE]);
    await listesDistantes();

    vi.stubGlobal('fetch', vi.fn(async () => rep({ erreur: 'boum' }, 500)));
    await expect(listesDistantes()).rejects.toThrow();
  });

  /* Une session finie n'emporte pas la progression — elle peut contenir du
     travail jamais envoyé — mais elle emporte la bibliothèque : un autre
     parent peut se connecter ici, et les mots d'une famille ne le regardent
     pas. Le serveur en garde la seule copie qui compte. */
  it('la session expirée emporte la bibliothèque, pas la progression', async () => {
    bibliotheque([DICTEE]);
    await listesDistantes();
    sauver({ ...DEFAUTS, palier: 4 }, cleDe('a'));

    vi.stubGlobal('fetch', vi.fn(async () => rep(null)));
    expect(await compteCourant()).toBeNull();

    bibliotheque([], { coupe: true });
    expect(await listesDistantes()).toEqual([]);
    expect(charger(cleDe('a')).palier).toBe(4);
  });

  it('la bibliothèque du compte s’en va avec la déconnexion', async () => {
    bibliotheque([DICTEE]);
    await listesDistantes();

    bibliotheque([]);
    await deconnecter();

    bibliotheque([], { coupe: true });
    expect(await listesDistantes()).toEqual([]);
  });
});

/* #6 — « partir sans laisser de trace » vaut aussi pour l'APPAREIL. Garder la
   progression d'enfants qui n'existent plus ferait revenir leurs prénoms sur
   l'écran du prochain compte ouvert ici. */
describe('suppression du compte', () => {
  it('efface du même geste le compte, sa bibliothèque, les profils et la file', async () => {
    /* On garnit l'appareil comme une vraie session le ferait : un compte connu,
       une bibliothèque en cache, un profil, sa progression, et un envoi resté
       en file parce que le réseau a coupé. */
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url === '/api/listes'
          ? rep({ listes: [{ id: 'l1', nom: 'D', mots: ['papa'], creeLe: '2026-08-29T00:00:00Z' }] })
          : rep({ user: { id: 'u1', email: 'p@exemple.fr', name: 'Parent' } }),
      ),
    );
    await compteCourant();
    await listesDistantes();
    remplacerIndex([{ id: 'a', nom: 'Timo' }]);
    sauver({ ...DEFAUTS, palier: 3 }, cleDe('a'));

    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await pousser('a', { ...DEFAUTS, palier: 4 });

    expect(enAttente()).toBe(1);
    expect(chargerIndex().liste).toHaveLength(1);

    vi.stubGlobal('fetch', vi.fn(async () => rep({ supprime: true })));
    await supprimerLeCompte();

    expect(compteEnCache()).toBeNull();
    expect(enAttente()).toBe(0);
    expect(chargerIndex().liste).toEqual([]);
    expect(localStorage.getItem(cleDe('a'))).toBeNull();

    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    expect(await listesDistantes()).toEqual([]);
  });

  it('ne touche à rien si le serveur refuse', async () => {
    serveur([]);
    vi.stubGlobal('fetch', vi.fn(async () => rep({ user: { id: 'u1', email: 'p@exemple.fr', name: 'P' } })));
    await compteCourant();

    vi.stubGlobal('fetch', vi.fn(async () => rep({ erreur: 'non' }, 500)));
    await expect(supprimerLeCompte()).rejects.toThrow();
    expect(compteEnCache()).not.toBeNull();
  });
});

describe('déconnexion', () => {
  it('efface le cache des profils, les progressions et la file', async () => {
    const s = serveur([{ id: 'd1', prenom: 'Timo', etat: null, majLe: null }]);
    await synchroniserProfils();
    await pousser('d1', { ...DEFAUTS, palier: 2 });
    s.couper();
    await pousser('d1', { ...DEFAUTS, palier: 3 });
    expect(enAttente()).toBe(1);

    s.rebrancher();
    await deconnecter();
    expect(localStorage.getItem(CLE_PROFILS)).toBeNull();
    expect(localStorage.getItem(cleDe('d1'))).toBeNull();
    expect(localStorage.getItem(CLE_FILE)).toBeNull();
    expect(localStorage.getItem(CLE_MAJ)).toBeNull();
    expect(enAttente()).toBe(0);
  });
});
