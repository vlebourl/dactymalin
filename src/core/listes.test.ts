import { describe, expect, it } from 'vitest';
import {
  LISTES_MAX,
  NOM_LISTE_MAX,
  estJouable,
  listeValidee,
  motsDeLaSaisie,
  motsIntapables,
} from './listes';

/* Le validateur est partagé client/serveur (#9) : une seule définition de ce
   qu'est une liste acceptable, pas deux qui divergeraient. */
describe('listeValidee', () => {
  it('rend un nom rogné et des mots assainis', () => {
    expect(listeValidee('  Dictée de la semaine ', ['  chat ', 'chat', ''])).toEqual({
      nom: 'Dictée de la semaine',
      mots: ['chat'],
    });
  });

  it('refuse un nom vide, blanc ou trop long', () => {
    expect(listeValidee('', ['chat'])).toBeNull();
    expect(listeValidee('   ', ['chat'])).toBeNull();
    expect(listeValidee('n'.repeat(NOM_LISTE_MAX + 1), ['chat'])).toBeNull();
    expect(listeValidee('n'.repeat(NOM_LISTE_MAX), ['chat'])).not.toBeNull();
  });

  it('refuse une liste sans aucun mot jouable', () => {
    expect(listeValidee('Vide', [])).toBeNull();
    expect(listeValidee('Vide', ['   ', 'x'.repeat(31)])).toBeNull();
    expect(listeValidee('Vide', 'pas un tableau')).toBeNull();
  });

  /* Le validateur est partagé avec le SERVEUR : ce qui arrive par le réseau
     n'est pas forcément un tableau de chaînes. Un élément qui n'en est pas une
     est écarté, il ne fait pas tomber la route. */
  it('écarte ce qui n’est pas un texte, sans se laisser tromper par la forme', () => {
    expect(listeValidee('Mêlée', ['chat', 42, null, { mot: 'chien' }, ['loup']])?.mots).toEqual([
      'chat',
    ]);
    expect(listeValidee('Que du bruit', [42, null])).toBeNull();
  });

  it('reprend les bornes de mots existantes : 30 caractères, 100 mots', () => {
    expect(listeValidee('Longs', ['x'.repeat(30)])?.mots).toEqual(['x'.repeat(30)]);
    expect(listeValidee('Longs', ['x'.repeat(31)])).toBeNull();
    const cent = Array.from({ length: 150 }, (_, i) => `m${i}`);
    expect(listeValidee('Beaucoup', cent)?.mots).toHaveLength(100);
  });

  it('refuse ce qui n\'est pas une chaîne comme nom', () => {
    expect(listeValidee(42, ['chat'])).toBeNull();
    expect(listeValidee(null, ['chat'])).toBeNull();
  });
});

/* Le parent doit comprendre POURQUOI un mot n'arrivera jamais dans la leçon :
   `composerBlocDeListe` les écarte en silence au moment de jouer. */
describe('motsIntapables', () => {
  it('nomme les mots que la disposition ne sait pas écrire directement', () => {
    expect(motsIntapables(['papa', 'la fête', 'ЖЖЖ'], 'fr-FR')).toEqual(['la fête', 'ЖЖЖ']);
  });

  it('ne nomme rien quand tout est tapable, accents directs compris', () => {
    expect(motsIntapables(['où est le garçon', "c'est papa", 'vélo'], 'fr-FR')).toEqual([]);
  });
});

describe('plafond de listes', () => {
  it('vaut 30, la borne annoncée par la spec', () => {
    expect(LISTES_MAX).toBe(30);
  });
});

/* Une liste appartient au COMPTE, mais une disposition appartient à l'APPAREIL.
   Une liste écrite sur un clavier peut n'avoir plus un seul mot tapable sur
   l'autre : sa carte lancerait un bloc vide, un cul-de-sac que l'enfant ne
   saurait pas expliquer. */
describe('estJouable', () => {
  const liste = (mots: string[]) => ({ id: 'l', nom: 'n', mots, creeLe: '2026-08-29T00:00:00.000Z' });

  it('vraie dès qu’un mot est tapable sur cette disposition', () => {
    expect(estJouable(liste(['papa', 'la fête']), 'fr-FR')).toBe(true);
  });

  it('fausse quand la disposition ne sait écrire aucun mot', () => {
    expect(estJouable(liste(['la fête', 'ЖЖЖ']), 'fr-FR')).toBe(false);
    expect(estJouable(liste([]), 'fr-FR')).toBe(false);
  });
});

/* La saisie du parent est un texte libre : une ligne, une virgule ou un
   point-virgule séparent deux mots. Le formulaire de création et celui de
   modification en font la même lecture — une seule définition (#10). */
describe('motsDeLaSaisie', () => {
  /* Régression (revue de #10) : la liste appartient au COMPTE, la disposition
     appartient à l'APPAREIL. Rendre seulement les mots tapables ici faisait
     disparaître, pour tout le foyer, ceux que CE clavier ne sait pas écrire —
     il suffisait d'ouvrir la liste sur la tablette et d'enregistrer. La saisie
     est donc rendue ENTIÈRE ; `refuses` ne sert qu'à avertir. */
  it('rend tous les mots, et nomme à part ceux que ce clavier ne sait pas écrire', () => {
    expect(motsDeLaSaisie('papa\nla fête ; maman, papa', 'fr-FR')).toEqual({
      mots: ['papa', 'la fête', 'maman'],
      refuses: ['la fête'],
    });
  });

  it('un même texte donne les mêmes mots sur les deux dispositions', () => {
    const texte = 'où est papa';
    expect(motsDeLaSaisie(texte, 'fr-FR').mots).toEqual(motsDeLaSaisie(texte, 'fr-CH').mots);
    // seul l'avertissement change : « où » ne s'écrit pas sur le clavier suisse
    expect(motsDeLaSaisie(texte, 'fr-FR').refuses).toEqual([]);
    expect(motsDeLaSaisie(texte, 'fr-CH').refuses).toEqual(['où est papa']);
  });

  it('ne retient rien d’un texte vide', () => {
    expect(motsDeLaSaisie('   \n\n', 'fr-FR')).toEqual({ mots: [], refuses: [] });
  });
});
