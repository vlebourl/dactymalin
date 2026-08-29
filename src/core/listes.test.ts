import { describe, expect, it } from 'vitest';
import { LISTES_MAX, NOM_LISTE_MAX, estJouable, listeValidee, motsIntapables } from './listes';

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
