import { describe, expect, it } from 'vitest';
import { creerEtat, reducer, type ActionLecon, type EtatLecon } from './lecon';
import { DELAI_INACTIVITE } from './aide';
import { doitProposerV2, ITEMS_SATURES_AVANT_BASCULE } from './detect';
import type { Item } from './generator';

const items = (...textes: string[]): Item[] =>
  textes.map((texte) => ({ texte, genre: 'mot' }) as Item);

const depart = (...textes: string[]) => creerEtat(items(...textes), 0, 0);

const frappe = (
  caractere: string,
  maintenant: number,
  attendu: string,
  extra: Partial<Extract<ActionLecon, { type: 'frappe' }>> = {},
): ActionLecon => ({
  type: 'frappe',
  caractere,
  code: `Key${caractere.toUpperCase()}`,
  attendu,
  maintenant,
  debutant: true,
  id: 'fr-FR',
  coherente: null,
  ...extra,
});

/** Tape le texte entier sans faute, célébrations comprises. */
function taper(e: EtatLecon, texte: string, t0 = 0): EtatLecon {
  let t = t0;
  for (const c of texte) {
    e = reducer(e, frappe(c, (t += 10), c));
  }
  return reducer(e, { type: 'tic', maintenant: t + 800 });
}

describe('saturation et bascule vers V2', () => {
  /* Gate Codex n°2 : `itemsSatures` n'était incrémenté qu'à la SORTIE de
     l'item. Au 3ᵉ item saturé le compteur valait encore 2 : l'enfant restait
     bloqué sur l'item qu'il ne savait pas taper. */
  it('compte le 3ᵉ item saturé DÈS que la saturation survient', () => {
    let e = depart('un', 'du', 'ne');
    for (let k = 0; k < ITEMS_SATURES_AVANT_BASCULE; k++) {
      // deux erreurs sur le caractère courant ⇒ barreau 3 terminal
      e = reducer(e, frappe('x', 100, e.items[e.i].texte[0]));
      e = reducer(e, frappe('x', 200, e.items[e.i].texte[0]));
      expect(e.barreau).toBe(3);
      expect(e.itemsSatures).toBe(k + 1);
      if (k < ITEMS_SATURES_AVANT_BASCULE - 1) {
        e = taper(e, e.items[e.i].texte, 300);
      }
    }
    // le compteur suffit AVANT même de quitter le 3ᵉ item
    expect(doitProposerV2(e.incoherentes, e.itemsSatures)).toBe(true);
  });

  it('le DERNIER item du bloc est compté lui aussi', () => {
    let e = depart('un');
    e = reducer(e, frappe('x', 100, 'u'));
    e = reducer(e, frappe('x', 200, 'u'));
    expect(e.itemsSatures).toBe(1);
    e = taper(e, 'un', 300);
    expect(e.fini).toBe(true);
    expect(e.itemsSatures).toBe(1);
  });

  it('un item propre rompt la série', () => {
    let e = depart('un', 'du', 'ne');
    e = reducer(e, frappe('x', 100, 'u'));
    e = reducer(e, frappe('x', 200, 'u'));
    expect(e.itemsSatures).toBe(1);
    e = taper(e, 'un', 300); // item suivant, sans saturation
    e = taper(e, 'du', 2000);
    expect(e.itemsSatures).toBe(0);
  });

  it('un même item ne compte jamais deux fois', () => {
    let e = depart('un', 'du');
    for (const t of [100, 200, 300, 400]) e = reducer(e, frappe('x', t, 'u'));
    expect(e.itemsSatures).toBe(1);
  });
});

describe('réinjection après aide', () => {
  /* Gate Codex n°6 : le barreau 2 atteint par INACTIVITÉ ne posait aucun
     drapeau ; l'item aidé pour hésitation n'était jamais réinjecté. */
  it("réinjecte un item aidé par pure inactivité, sans une seule erreur", () => {
    let e = depart('un', 'du');
    e = reducer(e, { type: 'tic', maintenant: DELAI_INACTIVITE + 50 });
    expect(e.barreau).toBe(2);
    expect(e.itemAide).toBe(true);
    e = taper(e, 'un', DELAI_INACTIVITE + 100);
    expect(e.aRevoir).toEqual(['un']);
  });

  it('un item tapé sans hésiter ni se tromper ne revient pas', () => {
    let e = depart('un', 'du');
    e = taper(e, 'un', 0);
    expect(e.aRevoir).toEqual([]);
  });

  it('une erreur réinjecte toujours', () => {
    let e = depart('un', 'du');
    e = reducer(e, frappe('x', 50, 'u'));
    e = taper(e, 'un', 60);
    expect(e.aRevoir).toEqual(['un']);
  });

  it("le drapeau retombe d'un item à l'autre", () => {
    let e = depart('un', 'du', 'ne');
    e = reducer(e, frappe('x', 50, 'u'));
    e = taper(e, 'un', 60);
    expect(e.itemAide).toBe(false);
  });
});

describe('retour d’onglet', () => {
  /* Gate Codex n°8 : le temps passé hors de l'onglet comptait comme de
     l'hésitation — l'enfant revenait sur une aide déjà déclenchée. */
  it("rebase l'horloge du caractère au retour", () => {
    let e = depart('un');
    e = reducer(e, { type: 'reprise', maintenant: 60_000 });
    e = reducer(e, { type: 'tic', maintenant: 60_100 });
    expect(e.barreau).toBeLessThan(2);
  });

  it("sans reprise, une longue absence déclenche bien l'aide d'inactivité", () => {
    let e = depart('un');
    e = reducer(e, { type: 'tic', maintenant: 60_000 });
    expect(e.barreau).toBe(2);
  });
});

describe('Maj contralatérale', () => {
  /* Gate Codex n°5 : la Maj homolatérale validait la frappe. */
  it('refuse la frappe quand la Maj tenue est du mauvais côté', () => {
    let e = depart('7');
    e = reducer(e, frappe('7', 50, '7', { majMauvaisCote: true }));
    expect(e.curseur).toBe(0);
    expect(e.majManquante).toBe(true);
    expect(e.fausse).toBeNull(); // quasi-réussite : jamais une erreur
    expect(e.aide.erreurs).toBe(0);
  });

  it('accepte la frappe quand la Maj est du bon côté', () => {
    let e = depart('7');
    e = reducer(e, frappe('7', 50, '7', { majMauvaisCote: false }));
    expect(e.curseur).toBe(1);
  });
});
