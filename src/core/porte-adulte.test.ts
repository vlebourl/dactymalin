import { describe, expect, it } from 'vitest';
import {
  A_MAX,
  A_MIN,
  B_MAX,
  B_MIN,
  questionAdulte,
  reponseJuste,
  type QuestionAdulte,
} from './porte-adulte';

describe('la question posée', () => {
  it('annonce le produit de ses deux facteurs', () => {
    for (let i = 0; i < 200; i++) {
      const q = questionAdulte();
      expect(q.reponse).toBe(q.a * q.b);
    }
  });

  it('reste dans des bornes hors de portée mentale d’un enfant de neuf ans', () => {
    for (let i = 0; i < 200; i++) {
      const q = questionAdulte();
      expect(q.a).toBeGreaterThanOrEqual(A_MIN);
      expect(q.a).toBeLessThanOrEqual(A_MAX);
      expect(q.b).toBeGreaterThanOrEqual(B_MIN);
      expect(q.b).toBeLessThanOrEqual(B_MAX);
    }
  });

  it('n’utilise jamais 0, 1 ni 2 comme second facteur', () => {
    // Ce sont les trois multiplications qu'un enfant fait sans y penser.
    for (let i = 0; i < 200; i++) expect(questionAdulte().b).toBeGreaterThan(2);
  });

  it('les bornes sont atteignables : le tirage ne rate ni le bas ni le haut', () => {
    expect(questionAdulte(() => 0)).toMatchObject({ a: A_MIN, b: B_MIN });
    expect(questionAdulte(() => 0.999999)).toMatchObject({ a: A_MAX, b: B_MAX });
  });

  it('change d’une fois sur l’autre : une question figée finirait apprise par cœur', () => {
    const tirages = new Set(
      Array.from({ length: 50 }, () => {
        const q = questionAdulte();
        return `${q.a}x${q.b}`;
      }),
    );
    expect(tirages.size).toBeGreaterThan(1);
  });
});

describe('la réponse acceptée', () => {
  const q: QuestionAdulte = { a: 27, b: 7, reponse: 189 };

  it('ouvre sur le produit exact, et sur rien d’autre', () => {
    expect(reponseJuste(q, '189')).toBe(true);
    expect(reponseJuste(q, '188')).toBe(false);
    expect(reponseJuste(q, '277')).toBe(false);
  });

  it('pardonne les espaces, parce qu’un pavé numérique en glisse', () => {
    expect(reponseJuste(q, ' 189 ')).toBe(true);
  });

  it('un champ vide n’ouvre rien — surtout pas en valant zéro', () => {
    expect(reponseJuste(q, '')).toBe(false);
    expect(reponseJuste(q, '   ')).toBe(false);
    expect(reponseJuste({ a: 0, b: 0, reponse: 0 }, '')).toBe(false);
  });

  it('ni le premier facteur ni le second ne suffisent', () => {
    expect(reponseJuste(q, '27')).toBe(false);
    expect(reponseJuste(q, '7')).toBe(false);
  });
});
