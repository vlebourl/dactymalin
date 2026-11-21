import { describe, expect, it } from 'vitest';
import { SUJETS, THEMES, VERBES } from '../grammaire-banques';
import { CATEGORIE_DU_TEMPS, phraseValide, tirer } from '../grammaire';

describe('tirer', () => {
  it('avec alea à 0 : premiers éléments, catégorie passé', () => {
    const t = tirer(() => 0);
    expect(t.sujet).toBe(SUJETS[0]);
    expect(t.verbe).toBe(VERBES[0]);
    expect(t.theme).toBe(THEMES[0]);
    expect(CATEGORIE_DU_TEMPS[t.temps]).toBe('passe');
  });

  it('répartit les catégories à 1/3 et imparfait à 1/2 des passés', () => {
    const N = 3000;
    const tirages = Array.from({ length: N }, () => tirer());
    const part = (c: string) =>
      tirages.filter((t) => CATEGORIE_DU_TEMPS[t.temps] === c).length / N;
    for (const c of ['passe', 'present', 'futur']) {
      expect(Math.abs(part(c) - 1 / 3)).toBeLessThan(0.05);
    }
    const passes = tirages.filter((t) => CATEGORIE_DU_TEMPS[t.temps] === 'passe');
    const imparfait = passes.filter((t) => t.temps === 'imparfait').length / passes.length;
    expect(Math.abs(imparfait - 0.5)).toBeLessThan(0.07);
  });

  it('ne tire jamais de verbe exclu', () => {
    const exclus = ['savoir', 'vouloir', 'pouvoir', 'dire', 'être', 'avoir'];
    for (let i = 0; i < 3000; i++) expect(exclus).not.toContain(tirer().verbe);
  });
});

describe('phraseValide', () => {
  it.each(['Il y a un chat.', 'Le hérisson dort sous les feuilles.', 'Mon grand-père répare la passerelle.'])(
    'accepte %s',
    (p) => expect(phraseValide(p)).toBe(true),
  );

  it.each([
    'Le géant chantera une chanson joyeuse au marché demain matin.',
    'Demain, Léa mangera une pomme.',
    'Léa a déjà mangé.',
    'La semaine prochaine, on partira.',
    "Le renard prenait son petit déjeuner près de la fusée qui brillait dans la nuit noire.",
    'Un chat\nqui dort.',
    '',
    '   ',
  ])('rejette %j', (p) => expect(phraseValide(p)).toBe(false));
});
