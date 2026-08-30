import { describe, expect, it } from 'vitest';
import { creerSession, TAILLE_VAGUE } from './session';

const options = { id: 'fr-FR' as const, parcours: 'decouverte' as const, etape: 2, graine: 7 };

describe('le flux d’exercices d’une leçon', () => {
  it('sert une première vague dès sa création', () => {
    const s = creerSession(options);
    expect(s.items().length).toBe(TAILLE_VAGUE);
  });

  it('ne sert jamais deux fois le même exercice', () => {
    const s = creerSession(options);
    for (let k = 0; k < 12; k++) s.recharger();
    const textes = s.items().map((i) => i.texte);
    expect(new Set(textes).size).toBe(textes.length);
  });

  it('rallonge la file sans rien retirer de ce qui a déjà été joué', () => {
    const s = creerSession(options);
    const avant = s.items().map((i) => i.texte);
    s.recharger();
    expect(
      s
        .items()
        .map((i) => i.texte)
        .slice(0, avant.length),
    ).toEqual(avant);
  });

  /* La couverture des touches NOUVELLES est l'affaire du début de séance : la
     refaire à chaque vague servirait les mêmes quelques mots en boucle. */
  it('couvre les touches nouvelles dans les premiers exercices servis', () => {
    const s = creerSession({ ...options, etape: 3 });
    const texte = s
      .items()
      .map((i) => i.texte)
      .join('')
      .toLowerCase();
    for (const c of ['l', 'c', 'f', 'b']) {
      expect(texte.includes(c), `« ${c} » absent de la première vague`).toBe(true);
    }
  });

  it('à graine égale, sert exactement la même suite', () => {
    const a = creerSession(options);
    const b = creerSession(options);
    for (let k = 0; k < 5; k++) {
      a.recharger();
      b.recharger();
    }
    expect(a.items().map((i) => i.texte)).toEqual(b.items().map((i) => i.texte));
  });

  it('à graine différente, sert autre chose', () => {
    const a = creerSession(options);
    const b = creerSession({ ...options, graine: 99 });
    expect(a.items().map((i) => i.texte)).not.toEqual(b.items().map((i) => i.texte));
  });

  /* Le corpus d'une étape est fini. Quand il est épuisé, la séance s'arrête —
     elle ne recommence pas au début, ce qui ferait retaper les mêmes mots. */
  it('s’épuise proprement quand l’étape n’a plus rien à servir', () => {
    const s = creerSession({ ...options, etape: 1 });
    let precedent = -1;
    for (let k = 0; k < 400 && s.items().length !== precedent; k++) {
      precedent = s.items().length;
      s.recharger();
    }
    expect(s.epuisee()).toBe(true);
    const textes = s.items().map((i) => i.texte);
    expect(new Set(textes).size).toBe(textes.length);
  });
});
