import { describe, expect, it } from 'vitest';
import { LISTES_MAX, NOM_LISTE_MAX, listeValidee, motsIntapables } from './listes';

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
   `composerBlocPerso` les écarte en silence au moment de jouer. */
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
