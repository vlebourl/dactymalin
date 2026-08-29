import { describe, expect, it } from 'vitest';
import type { Liste } from './listes';
import { reducer, etatDeDepart, type BilanBloc, type EtatApp } from '../state';

/* #9 — jouer une liste rapporte des étoiles et rien d'autre : ni palier, ni
   maîtrise, ni compteur de blocs du palier. Une liste peut contenir des
   lettres que l'enfant n'a pas apprises ; elles ne prouvent rien. */

const DICTEE: Liste = {
  id: 'l1',
  nom: 'Dictée de la semaine',
  mots: ['dinosaure', 'papillon'],
  creeLe: '2026-08-29T10:00:00.000Z',
};

const AUTRE: Liste = { ...DICTEE, id: 'l2', nom: 'La famille', mots: ['papi'] };

const base = (): EtatApp => ({
  ...etatDeDepart('cle-inexistante'),
  palier: 2,
  blocsSurPalier: 4,
  vue: 'V1',
});

describe('lancer une liste depuis une carte', () => {
  it('entre en leçon sur les mots de CETTE liste', () => {
    const apres = reducer(base(), { type: 'commencer', liste: DICTEE });
    expect(apres.vue).toBe('V4');
    expect(apres.listeJouee).toEqual(DICTEE);
  });

  it('« On continue ! » rejoue la même liste', () => {
    const enCours = reducer(base(), { type: 'commencer', liste: DICTEE });
    expect(reducer(enCours, { type: 'commencer' }).listeJouee).toEqual(DICTEE);
  });

  it('une autre carte remplace la liste jouée', () => {
    const enCours = reducer(base(), { type: 'commencer', liste: DICTEE });
    expect(reducer(enCours, { type: 'commencer', liste: AUTRE }).listeJouee).toEqual(AUTRE);
  });

  /* Depuis #12, la liste jouée est le SEUL état du mode : il n'y a plus de
     drapeau à côté d'elle pour s'en désynchroniser. C'est ce couple-là qui
     avait produit le défaut où « Notre leçon » rejouait la carte d'avant. */
  it('revenir au parcours oublie la liste', () => {
    const enCours = reducer(base(), { type: 'commencer', liste: DICTEE });
    expect(reducer(enCours, { type: 'commencer', liste: null }).listeJouee).toBeNull();
  });
});

describe('un bloc de liste ne fait pas avancer le parcours', () => {
  const bilan: BilanBloc = {
    etoiles: 3,
    propres: ['d', 'i', 'n', 'o'],
    aRevoir: [],
    items: ['dinosaure'],
  };

  it('rapporte les étoiles, et ne bouge ni palier, ni maîtrise, ni compteur', () => {
    const enCours = reducer(base(), { type: 'commencer', liste: DICTEE });
    const apres = reducer(enCours, { type: 'blocTermine', bilan });
    expect(apres.etoilesDuBloc).toBe(3);
    expect(apres.palier).toBe(2);
    expect(apres.blocsSurPalier).toBe(4);
    expect(apres.maitrise).toEqual(enCours.maitrise);
    expect(apres.palierOuvert).toBeNull();
  });
});

describe('la bibliothèque du compte vit dans l\'état', () => {
  it('les listes reçues du serveur remplacent celles connues', () => {
    const avec = reducer(base(), { type: 'listes', listes: [DICTEE, AUTRE] });
    expect(avec.listes).toEqual([DICTEE, AUTRE]);
    expect(reducer(avec, { type: 'listes', listes: [] }).listes).toEqual([]);
  });

  it('elles ne partent pas dans la sauvegarde du profil : elles sont au compte', async () => {
    const { aSauvegarder } = await import('../state');
    const avec = reducer(base(), { type: 'listes', listes: [DICTEE] });
    expect(Object.keys(aSauvegarder(avec))).not.toContain('listes');
  });
});
