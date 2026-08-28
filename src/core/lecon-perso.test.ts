import { describe, expect, it } from 'vitest';
import { composerBlocPerso } from './generator';
import { estIntact, motsPersoValides, valider, DEFAUTS } from './storage';
import { reducer, etatDeDepart, type EtatApp, type BilanBloc } from '../state';

/* « Notre leçon » (demande du 2026-08-28) : les mots de la famille, en mode
   libre — même des lettres pas encore enseignées — sans toucher au parcours. */

describe('composerBlocPerso', () => {
  it('sert les mots de la famille tels quels, dédoublonnés', () => {
    const bloc = composerBlocPerso(['dinosaure', 'dinosaure', 'papi'], 'fr-FR', 7);
    expect(bloc.map((i) => i.texte).sort()).toEqual(['dinosaure', 'papi']);
    expect(bloc.every((i) => i.genre === 'mot')).toBe(true);
  });

  it("accepte tout ce que le clavier écrit, refuse le reste", () => {
    const bloc = composerBlocPerso(['kiwi', 'vélo', 'château'], 'fr-FR', 7);
    /* `k` n'est pas au programme mais la touche existe : en mode libre, elle
       suffit. « château » reste refusé — le â demande une touche morte, deux
       frappes pour un seul caractère attendu. */
    expect(bloc.map((i) => i.texte).sort()).toEqual(['kiwi', 'vélo']);
  });

  it('borne le bloc à 12 items', () => {
    const mots = Array.from({ length: 30 }, (_, i) => `mot${i}`.replace(/[0-9]/g, 'a'));
    expect(composerBlocPerso([...new Set(mots)], 'fr-FR', 7).length).toBeLessThanOrEqual(12);
  });
});

describe('motsPerso : rangement et persistance', () => {
  it('assainit : textes vides, doublons, longueurs et volume bornés', () => {
    expect(motsPersoValides(['  chat ', '', 'chat', 'x'.repeat(31), 42])).toEqual(['chat']);
    expect(motsPersoValides('pas une liste').length).toBe(0);
    expect(motsPersoValides(Array.from({ length: 150 }, (_, i) => `m${i}`)).length).toBe(100);
  });

  it('une sauvegarde d\'avant « Notre leçon » reste intacte ; le champ voyage', () => {
    const { motsPerso: _ignore, ...legacy } = { ...DEFAUTS };
    expect(estIntact(legacy)).toBe(true);
    expect(valider(legacy).motsPerso).toEqual([]);
    const avec = { ...DEFAUTS, motsPerso: ['licorne'] };
    expect(estIntact(avec)).toBe(true);
    expect(valider(avec).motsPerso).toEqual(['licorne']);
  });
});

describe('un bloc perso ne touche pas au parcours', () => {
  const bilan: BilanBloc = { etoiles: 3, propres: ['c', 'h', 'a', 't'], aRevoir: [], items: ['chat'] };

  const base = (): EtatApp => ({
    ...etatDeDepart('cle-inexistante'),
    palier: 2,
    blocsSurPalier: 4,
    vue: 'V4',
  });

  it('blocTermine en mode perso : ni palier, ni maîtrise, ni compteur de palier', () => {
    const avant = { ...base(), blocPerso: true };
    const apres = reducer(avant, { type: 'blocTermine', bilan });
    expect(apres.vue).toBe('V5');
    expect(apres.palier).toBe(2);
    expect(apres.blocsSurPalier).toBe(4);
    expect(apres.maitrise).toEqual(avant.maitrise);
    expect(apres.bloc).toBe(avant.bloc + 1);
    expect(apres.etoilesDuBloc).toBe(3);
  });

  it('commencer sans payload garde le mode ; l\'accueil et la carte le posent explicitement', () => {
    const enPerso = reducer(base(), { type: 'commencer', perso: true });
    expect(enPerso.blocPerso).toBe(true);
    expect(reducer(enPerso, { type: 'commencer' }).blocPerso).toBe(true);
    expect(reducer(enPerso, { type: 'commencer', perso: false }).blocPerso).toBe(false);
  });
});

/* Régression (2026-08-28) : « le 20 octobre c'est papa » était refusé. Le mode
   libre filtrait sur le CURRICULUM ; l'apostrophe n'y figure pas, alors qu'elle
   est bien sur la touche 4 de l'AZERTY. Le seul critère est désormais « le
   clavier sait l'écrire ». */
describe('mode libre : tout ce que le clavier sait écrire', () => {
  it("accepte une phrase avec apostrophe, chiffres et espaces", () => {
    const items = composerBlocPerso(["le 20 octobre c'est papa"], 'fr-FR', 1);
    expect(items.map((i) => i.texte)).toEqual(["le 20 octobre c'est papa"]);
  });

  it('accepte accents directs et cédille', () => {
    const items = composerBlocPerso(['où est le garçon', 'à côté'], 'fr-FR', 1);
    expect(items.map((i) => i.texte)).toContain('où est le garçon');
  });

  it('refuse les accents à touche morte (â, ê, ë) : deux frappes pour un caractère', () => {
    expect(composerBlocPerso(['la fête'], 'fr-FR', 1)).toHaveLength(0);
  });

  it("refuse ce que la disposition ne peut pas écrire", () => {
    expect(composerBlocPerso(['ЖЖЖ', 'papa'], 'fr-FR', 1).map((i) => i.texte)).toEqual(['papa']);
  });
});
