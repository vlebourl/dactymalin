import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  barreau,
  DELAI_INACTIVITE,
  estPropre,
  etatInitial,
  LATENCES,
  prochaineLatence,
  surErreur,
} from './aide';

describe('échelle d\'aide 1→3', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('barreau 1 immédiat quand la latence est nulle (mode débutant)', () => {
    expect(barreau(etatInitial('s', 0), 0)).toBe(1);
  });

  it('barreau 1 seulement à l\'expiration de la fenêtre de rappel', () => {
    const e = etatInitial('s', 1500);
    expect(barreau(e, 0)).toBe(0);
    expect(barreau(e, 1499)).toBe(0);
    expect(barreau(e, 1500)).toBe(1);
  });

  it('barreau 2 à la 1ʳᵉ erreur', () => {
    expect(barreau(surErreur(etatInitial('s', 0), 10), 10)).toBe(2);
  });

  it('barreau 2 après ~3 s sans frappe', () => {
    const e = etatInitial('s', 0);
    expect(barreau(e, DELAI_INACTIVITE - 1)).toBe(1);
    expect(barreau(e, DELAI_INACTIVITE)).toBe(2);
  });

  it('barreau 3 à la 2ᵉ erreur sur le même caractère', () => {
    let e = etatInitial('s', 0);
    e = surErreur(e, 100);
    e = surErreur(e, 200);
    expect(barreau(e, 200)).toBe(3);
  });

  it('barreau 3 terminal : une 3ᵉ erreur n\'ajoute rien', () => {
    let e = etatInitial('s', 0);
    e = surErreur(e, 1);
    e = surErreur(e, 2);
    const apres = surErreur(e, 3);
    expect(barreau(apres, 3)).toBe(3);
    expect(barreau(apres, 99999)).toBe(3);
  });

  it('le barreau ne redescend jamais dans un item', () => {
    let e = etatInitial('s', 0);
    e = surErreur(e, 5000);
    expect(barreau(e, 0)).toBe(2);
  });

  it('l\'aide repart de zéro au caractère suivant', () => {
    expect(barreau(etatInitial('t', 800), 0)).toBe(0);
  });
});

describe('fenêtre de rappel P6', () => {
  it('les quatre paliers de latence sont 0 / 0,8 / 1,5 / 2,5 s', () => {
    expect(LATENCES).toEqual([0, 800, 1500, 2500]);
  });

  it('monte d\'un cran après une réussite autonome', () => {
    expect(prochaineLatence(0, true, false)).toBe(800);
    expect(prochaineLatence(800, true, false)).toBe(1500);
    expect(prochaineLatence(1500, true, false)).toBe(2500);
    expect(prochaineLatence(2500, true, false)).toBe(2500);
  });

  it('retombe instantanément à 0 sur erreur ou dépassement', () => {
    expect(prochaineLatence(2500, false, false)).toBe(0);
    expect(prochaineLatence(800, false, false)).toBe(0);
  });

  it('est plafonnée à 0 s en mode débutant', () => {
    expect(prochaineLatence(0, true, true)).toBe(0);
    expect(prochaineLatence(2500, true, true)).toBe(0);
  });
});

describe('frappe propre', () => {
  it('une frappe sans erreur ni escalade compte pour la maîtrise', () => {
    expect(estPropre(etatInitial('s', 0))).toBe(true);
    expect(estPropre({ ...etatInitial('s', 0), atteint: 1 })).toBe(true);
  });

  it('une erreur ou une escalade au barreau 2 ne compte pas', () => {
    expect(estPropre(surErreur(etatInitial('s', 0), 1))).toBe(false);
    expect(estPropre({ ...etatInitial('s', 0), atteint: 2 })).toBe(false);
  });
});
