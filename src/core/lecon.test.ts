import { describe, expect, it } from 'vitest';
import {
  creerEtat,
  reducer,
  verdictFrappe,
  type ActionLecon,
  type EtatLecon,
  type FrappeLecon,
} from './lecon';
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

  /* #79 : la question « tu veux arrêter ? » immobilise la leçon. Le temps
     qu'elle dure n'appartient pas à l'enfant — il lui est RENDU, sinon
     répondre « non » lui aurait coûté des secondes de chronomètre. */
  it('rend à la leçon le temps pendant lequel elle était figée', () => {
    const e = creerEtat(items('un'), 0, 0, 10_000);
    expect(e.finLe).toBe(10_000);
    const repris = reducer(e, { type: 'reprise', maintenant: 3_000, pause: 2_500 });
    expect(repris.finLe).toBe(12_500);
    // la durée MESURÉE de la leçon ne compte pas la pause non plus
    expect(repris.debut).toBe(2_500);
  });

  it('une reprise sans pause laisse le chronomètre où il est', () => {
    const e = creerEtat(items('un'), 0, 0, 10_000);
    const repris = reducer(e, { type: 'reprise', maintenant: 3_000 });
    expect(repris.finLe).toBe(10_000);
    expect(repris.debut).toBe(0);
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

  /* Gate Codex : la vue jouait le son de réussite sur `caractere === attendu`,
     donc AUSSI sur la frappe que le reducer venait de refuser (mauvaise Maj).
     Le verdict est désormais unique et partagé. */
  it('donne le même verdict que le reducer, pour le son comme pour l’état', () => {
    const e = depart('7');
    const mauvaise = frappe('7', 50, '7', { majMauvaisCote: true }) as FrappeLecon;
    const bonne = frappe('7', 50, '7', { majMauvaisCote: false }) as FrappeLecon;
    expect(verdictFrappe(e, mauvaise)).toBe('quasi');
    expect(verdictFrappe(e, bonne)).toBe('reussite');
    expect(verdictFrappe(e, frappe('k', 50, '7') as FrappeLecon)).toBe('faute');
    // pendant la célébration, la frappe ne compte pas — et ne sonne pas
    expect(verdictFrappe({ ...e, celebration: 10 }, bonne)).toBe('inerte');
    expect(reducer(e, mauvaise).curseur).toBe(0);
  });
});

describe('célébration et perte de focus', () => {
  /* Verdict Codex final : `reprise` rebasait le caractère et l'erreur mais pas
     la célébration — revenir après 700 ms d'absence sautait l'item suivant
     à la première image, célébration invisible. */
  it("la célébration est rejouée entière après une reprise", () => {
    let e = depart('un', 'ne');
    for (const [i, c] of [...'un'].entries()) e = reducer(e, frappe(c, 10 + i * 10, c));
    expect(e.celebration).not.toBeNull();
    // absence longue, puis retour : reprise rebase la célébration
    e = reducer(e, { type: 'reprise', maintenant: 10_000 });
    e = reducer(e, { type: 'tic', maintenant: 10_050 });
    expect(e.i).toBe(0); // l'item n'a pas été sauté
    e = reducer(e, { type: 'tic', maintenant: 10_900 });
    expect(e.i).toBe(1); // elle se termine ensuite normalement
  });
});


/* #61 : `noterFrappe` n'était appelé nulle part. La leçon se jouait sans que
   rien ne la compte — vitesse, précision et barreau 3 restaient vides à
   jamais, et les garde-fous §7.1 et §7.5 étaient inapplicables. Rien de ce
   qui suit n'atteint l'écran de l'enfant (P1) : la vue ne fait que le
   transmettre. */
describe('ce que la leçon observe (§4.7)', () => {
  it('compte les lettres écrites, les fautes, et la propreté de chaque touche', () => {
    let e = depart('et');
    e = reducer(e, frappe('x', 10, 'e')); // faute : rien ne s'écrit (P3)
    e = reducer(e, frappe('e', 20, 'e'));
    e = reducer(e, frappe('t', 30, 't'));
    expect(e.rapport.lettres).toBe(2);
    expect(e.rapport.fautes).toBe(1);
    // le « e » a été raté une fois : il compte, mais pas comme propre
    expect(e.rapport.touches.e).toEqual({ propres: 0, total: 1 });
    expect(e.rapport.touches.t).toEqual({ propres: 1, total: 1 });
  });

  it('compte les positions où le dernier barreau d’aide s’est déclenché', () => {
    let e = depart('et');
    e = reducer(e, frappe('x', 10, 'e'));
    e = reducer(e, frappe('x', 20, 'e')); // 2ᵉ erreur ⇒ barreau 3, terminal
    expect(e.barreau).toBe(3);
    e = reducer(e, frappe('e', 30, 'e'));
    e = reducer(e, frappe('t', 40, 't'));
    expect(e.rapport.barreau3).toBe(1);
  });

  /* La quasi-réussite n'est ni une erreur ni une réussite pour le reducer : la
     précision mesurée doit dire la même chose que la leçon vécue. */
  it('ne compte la quasi-réussite ni en lettre ni en faute', () => {
    let e = depart('Et');
    e = reducer(e, frappe('E', 10, 'E', { majMauvaisCote: true }));
    expect(e.rapport).toEqual(depart('Et').rapport);
  });

  it('la leçon close porte sa durée : la vitesse a un dénominateur', () => {
    const e = taper(depart('et'), 'et');
    expect(e.fini).toBe(true);
    expect(e.rapport.ms).toBeGreaterThan(0);
  });
});
