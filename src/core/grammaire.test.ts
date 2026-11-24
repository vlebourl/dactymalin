import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EXERCICES_GRAMMAIRE,
  grammaireDisponible,
  phraseSuivante,
  repondre,
  serieFinie,
  type Serie,
} from './grammaire';

describe('grammaireDisponible', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('vrai quand le serveur dit disponible', async () => {
    const fetchSimule = vi.fn(async () => new Response(JSON.stringify({ disponible: true })));
    vi.stubGlobal('fetch', fetchSimule);
    expect(await grammaireDisponible()).toBe(true);
    expect(fetchSimule).toHaveBeenCalledWith('/api/grammaire/etat', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('faux sur un statut non-OK (401)', async () => {
    vi.stubGlobal('fetch', async () => new Response('{}', { status: 401 }));
    expect(await grammaireDisponible()).toBe(false);
  });

  it('faux sur une erreur réseau', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('réseau');
    });
    expect(await grammaireDisponible()).toBe(false);
  });

  it('faux quand la requête est interrompue (délai dépassé)', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new DOMException('délai', 'TimeoutError');
    });
    expect(await grammaireDisponible()).toBe(false);
  });
});

describe('phraseSuivante : délai', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('donne null quand la requête est interrompue', async () => {
    const fetchSimule = vi.fn(async () => {
      throw new DOMException('délai', 'TimeoutError');
    });
    vi.stubGlobal('fetch', fetchSimule);
    expect(await phraseSuivante(new Set(), ['imparfait'])).toBeNull();
    expect(fetchSimule).toHaveBeenCalledWith(
      '/api/grammaire/phrase?niveaux=imparfait',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});


const courante = { phrase: 'Demain, Maël viendra.', categorie: 'futur' as const };
const debut: Serie = { faites: 0, justes: 0, courante, reponse: null };

describe('repondre', () => {
  it('une bonne réponse incrémente justes et faites', () => {
    const s = repondre(debut, 'futur');
    expect(s).toMatchObject({ faites: 1, justes: 1, reponse: 'futur' });
  });
  it('une mauvaise réponse incrémente seulement faites', () => {
    expect(repondre(debut, 'passe')).toMatchObject({ faites: 1, justes: 0, reponse: 'passe' });
  });
  it('une deuxième réponse sur la même phrase ne change rien (double-clic)', () => {
    const une = repondre(debut, 'futur');
    expect(repondre(une, 'passe')).toBe(une);
  });
});

describe('serieFinie', () => {
  it('vraie à 10 réponses seulement', () => {
    expect(serieFinie({ ...debut, faites: 9 })).toBe(false);
    expect(serieFinie({ ...debut, faites: 10 })).toBe(true);
  });
});

describe('phraseSuivante', () => {
  afterEach(() => vi.unstubAllGlobals());
  const reponse = (p: unknown, status = 200) => ({ ok: status === 200, status, json: async () => p });

  it('un doublon déclenche un deuxième appel, et la phrase retenue est mémorisée', async () => {
    const autre = { phrase: 'Hier, il pleuvait.', categorie: 'passe' };
    const f = vi.fn().mockResolvedValueOnce(reponse(courante)).mockResolvedValueOnce(reponse(autre));
    vi.stubGlobal('fetch', f);
    const vues = new Set([courante.phrase]);
    expect(await phraseSuivante(vues, ['imparfait'])).toEqual(autre);
    expect(f).toHaveBeenCalledTimes(2);
    expect(vues.has(autre.phrase)).toBe(true);
  });
  it('ne redemande qu’une fois', async () => {
    const f = vi.fn().mockResolvedValue(reponse(courante));
    vi.stubGlobal('fetch', f);
    await phraseSuivante(new Set([courante.phrase]), ['imparfait']);
    expect(f).toHaveBeenCalledTimes(2);
  });
  it('une réponse 503 donne null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reponse({ code: 'GRAMMAIRE_INDISPONIBLE' }, 503)));
    expect(await phraseSuivante(new Set(), ['imparfait'])).toBeNull();
  });
  it('une erreur réseau donne null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('hors ligne')));
    expect(await phraseSuivante(new Set(), ['imparfait'])).toBeNull();
  });
});

describe('EXERCICES_GRAMMAIRE', () => {
  it("ne contient que l'exercice « temps »", () => {
    expect(EXERCICES_GRAMMAIRE.map((e) => [e.id, e.titre])).toEqual([
      ['temps', 'Passé, présent ou futur ?'],
    ]);
  });
});
