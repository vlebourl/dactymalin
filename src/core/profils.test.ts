import { beforeEach, describe, expect, it } from 'vitest';
import {
  CLE_CHOISIR,
  CLE_PROFILS,
  activerProfil,
  ajouterProfil,
  chargerIndex,
  cleDe,
  effacerDemandeDeChoix,
  nomProfilActif,
  oublierProfils,
  prenomValide,
  PRENOM_MAX,
  profilInitial,
  progressionEnCache,
  remplacerIndex,
} from './profils';
import { CLE, DEFAUTS, charger, progressionDe, sauver } from './storage';

/** Faux stockage : `core/` doit rester testable en env node (cf. storage.test.ts). */
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

describe('cache local des profils du compte', () => {
  beforeEach(() => {
    globalThis.localStorage = new FauxStockage() as unknown as Storage;
    globalThis.sessionStorage = new FauxStockage() as unknown as Storage;
  });

  it("sans compte encore lu, aucun profil n'est inventé", () => {
    expect(chargerIndex().liste).toEqual([]);
    expect(profilInitial()).toBeNull();
  });

  it("la liste du serveur remplace le cache, l'actif survit s'il y est encore", () => {
    remplacerIndex([
      { id: 'a', nom: 'Timo' },
      { id: 'b', nom: 'Zoé' },
    ]);
    activerProfil('b');
    remplacerIndex([{ id: 'b', nom: 'Zoé' }]);
    expect(chargerIndex().actif).toBe('b');
    remplacerIndex([{ id: 'a', nom: 'Timo' }]);
    expect(chargerIndex().actif).toBeNull();
  });

  it('deux enfants du même prénom restent deux profils distincts', () => {
    remplacerIndex([
      { id: 'a', nom: 'Timo' },
      { id: 'b', nom: 'Timo' },
    ]);
    sauver({ ...DEFAUTS, palier: 5 }, cleDe('a'));
    sauver({ ...DEFAUTS, palier: 1 }, cleDe('b'));
    expect(cleDe('a')).not.toBe(cleDe('b'));
    expect(charger(cleDe('a')).palier).toBe(5);
    expect(charger(cleDe('b')).palier).toBe(1);
  });

  it('renommer un enfant conserve sa progression : la clé est son identifiant', () => {
    remplacerIndex([{ id: 'a', nom: 'Timo' }]);
    activerProfil('a');
    sauver({ ...DEFAUTS, palier: 4 }, cleDe('a'));
    remplacerIndex([{ id: 'a', nom: 'Timothée' }]);
    expect(nomProfilActif()).toBe('Timothée');
    expect(charger(cleDe('a')).palier).toBe(4);
  });

  it("un seul joueur : on entre directement ; zéro ou deux : l'écran décide", () => {
    remplacerIndex([{ id: 'a', nom: 'Timo' }]);
    expect(profilInitial()).toBe('a');
    ajouterProfil({ id: 'b', nom: 'Zoé' });
    expect(profilInitial()).toBeNull();
  });

  it('le drapeau « changer de joueur » force l’écran, sans être consommé à la lecture (StrictMode)', () => {
    remplacerIndex([{ id: 'a', nom: 'Timo' }]);
    sessionStorage.setItem(CLE_CHOISIR, '1');
    expect(profilInitial()).toBeNull();
    expect(profilInitial()).toBeNull();
    effacerDemandeDeChoix();
    expect(profilInitial()).toBe('a');
  });

  it('ajouterProfil active le nouveau venu', () => {
    remplacerIndex([{ id: 'a', nom: 'Timo' }]);
    ajouterProfil({ id: 'b', nom: 'Zoé' });
    expect(chargerIndex().actif).toBe('b');
    expect(chargerIndex().liste.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('la liste du serveur emporte la progression en cache des profils disparus', () => {
    remplacerIndex([
      { id: 'a', nom: 'Timo' },
      { id: 'b', nom: 'Zoé' },
    ]);
    sauver({ ...DEFAUTS, palier: 5 }, cleDe('a'));
    sauver({ ...DEFAUTS, palier: 6 }, cleDe('a')); // et sa sauvegarde de secours
    sauver({ ...DEFAUTS, palier: 2 }, cleDe('b'));

    // Zoé a été supprimée depuis un autre appareil
    remplacerIndex([{ id: 'a', nom: 'Timo' }]);

    expect(localStorage.getItem(cleDe('b'))).toBeNull();
    expect(localStorage.getItem(`${cleDe('b')}.backup`)).toBeNull();
    expect(charger(cleDe('a')).palier).toBe(6); // celle qui reste n'a pas bougé
  });

  it("ne prend jamais la clé d'avant les identifiants serveur pour un profil disparu", () => {
    /* `tapeavecmoi.v1.backup` porte le préfixe des clés par identifiant sans
       en être une : c'est la sauvegarde de secours d'AVANT #4, et la reprise
       en a besoin. */
    sauver({ ...DEFAUTS, palier: 4 }, CLE);
    sauver({ ...DEFAUTS, palier: 7 }, CLE);
    remplacerIndex([{ id: 'a', nom: 'Timo' }]);
    expect(localStorage.getItem(CLE)).not.toBeNull();
    expect(localStorage.getItem(`${CLE}.backup`)).not.toBeNull();
  });

  it("un cache corrompu ou d'une version antérieure est ignoré, pas interprété", () => {
    localStorage.setItem(CLE_PROFILS, '{"version":1,"actif":"p1","liste":[{"id":"p1","nom":"X"}]}');
    expect(chargerIndex().liste).toEqual([]);
    localStorage.setItem(CLE_PROFILS, 'pas du json');
    expect(chargerIndex().liste).toEqual([]);
  });

  it('la déconnexion efface les profils ET les progressions en cache', () => {
    remplacerIndex([{ id: 'a', nom: 'Timo' }]);
    sauver({ ...DEFAUTS, palier: 6 }, cleDe('a'));
    sauver({ ...DEFAUTS, palier: 7 }, cleDe('a')); // crée aussi la sauvegarde de secours
    sauver({ ...DEFAUTS, palier: 8 }); // clé d'avant les identifiants serveur
    oublierProfils();
    expect(localStorage.getItem(CLE)).toBeNull();
    expect(chargerIndex().liste).toEqual([]);
    expect(localStorage.getItem(cleDe('a'))).toBeNull();
    expect(localStorage.getItem(`${cleDe('a')}.backup`)).toBeNull();
    expect(charger(cleDe('a')).palier).toBe(DEFAUTS.palier);
  });

  it('un prénom vide, blanc ou trop long est refusé ; un prénom normal passe', () => {
    expect(prenomValide('Timo')).toBe(true);
    expect(prenomValide('  Zoé  ')).toBe(true); // les espaces autour ne comptent pas
    expect(prenomValide('a'.repeat(PRENOM_MAX))).toBe(true);
    expect(prenomValide('')).toBe(false);
    expect(prenomValide('   ')).toBe(false);
    expect(prenomValide('a'.repeat(PRENOM_MAX + 1))).toBe(false);
  });

  it("la progression en cache dit « rien ici » plutôt que d'inventer un palier 1", () => {
    remplacerIndex([
      { id: 'a', nom: 'Timo' },
      { id: 'b', nom: 'Zoé' },
    ]);
    sauver({ ...DEFAUTS, palier: 6 }, cleDe('a'));
    expect(progressionEnCache('a')?.palier).toBe(6);
    /* Zoé joue sur la tablette : ici on ne sait rien d'elle, et « leçon 1 »
       serait un mensonge. */
    expect(progressionEnCache('b')).toBeNull();
  });

  it("la clé de progression est suffixée par l'identifiant serveur", () => {
    expect(cleDe('9f1c')).toBe(`${CLE}.9f1c`);
  });
});

describe('la progression en cache est rendue au modèle courant', () => {
  it('une sauvegarde v1 écrite par un ancien bundle est migrée à la lecture', () => {
    /* Exactement ce qu'un appareil d'avant la mise à jour a sur le disque. */
    localStorage.setItem(
      cleDe('d1'),
      JSON.stringify({
        version: 1,
        disposition: 'fr-CH',
        dispositionChoisieALaMain: true,
        palier: 4,
        blocsSurPalier: 2,
        bloc: 9,
        maitrise: { e: [1, 2] },
        guideDoigtVu: true,
        reglages: { sons: true, texteEspace: false, animationsDouces: true },
      }),
    );
    const etat = progressionEnCache('d1');
    expect(etat).not.toBeNull();
    expect(progressionDe(etat!, 'decouverte', 'fr-CH')).toEqual({ etape: 4, leconsSurEtape: 2 });
    expect(etat!.maitrise).toEqual({ e: [1, 2] });
  });

  it('un profil sans rien en cache reste `null`, il n\'invente pas d\'étape 1', () => {
    expect(progressionEnCache('inconnu')).toBeNull();
  });
});
