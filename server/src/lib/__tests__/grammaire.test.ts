import { describe, expect, it } from 'vitest';
import { SUJETS, THEMES, VERBES } from '../grammaire-banques';
import {
  CATEGORIE_DU_TEMPS,
  controleAccepte,
  creerGenerateur,
  phraseValide,
  tirer,
  type Demander,
} from '../grammaire';

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

describe('creerGenerateur', () => {
  /** Un `demander` simulé : rejoue une file de réponses et capture les appels. */
  const simule = (reponses: unknown[]) => {
    const appels: { systeme: string; utilisateur: string }[] = [];
    const demander: Demander = async (systeme, utilisateur) => {
      appels.push({ systeme, utilisateur });
      return reponses.shift() ?? null;
    };
    return { demander, appels };
  };
  const phrase = 'Maël mange une pomme.';

  it('phrase valide puis contrôle concordant : 2 appels exactement', async () => {
    const { demander, appels } = simule([{ phrase }, { verbes: [{ verbe: 'mange', categorie: 'passe' }] }]);
    // alea à 0 : catégorie passé
    const r = await creerGenerateur(demander, () => 0)();
    expect(r).toEqual({ phrase, categorie: 'passe' });
    expect(appels).toHaveLength(2);
  });

  it('contrôle à catégories mêlées : nouveau tirage', async () => {
    const { demander, appels } = simule([
      { phrase },
      {
        verbes: [
          { verbe: 'mange', categorie: 'passe' },
          { verbe: 'une', categorie: 'futur' },
        ],
      },
      { phrase },
      { verbes: [{ verbe: 'mange', categorie: 'passe' }] },
    ]);
    const r = await creerGenerateur(demander, () => 0)();
    expect(r?.categorie).toBe('passe');
    expect(appels).toHaveLength(4);
  });

  it('phrase rejetée par le validateur : pas de contrôle, nouveau tirage', async () => {
    const { demander, appels } = simule([
      { phrase: 'Hier, Maël mange une pomme.' },
      { phrase },
      { verbes: [{ verbe: 'mange', categorie: 'passe' }] },
    ]);
    const r = await creerGenerateur(demander, () => 0)();
    expect(r?.phrase).toBe(phrase);
    expect(appels).toHaveLength(3);
  });

  it.each([null, { phrase: 42 }])(
    'réponse %j : essai raté',
    async (mauvaise) => {
      const { demander, appels } = simule([
        mauvaise,
        { phrase },
        { verbes: [{ verbe: 'mange', categorie: 'passe' }] },
      ]);
      const r = await creerGenerateur(demander, () => 0)();
      expect(r?.phrase).toBe(phrase);
      expect(appels).toHaveLength(3);
    },
  );

  it('trois échecs : null, 6 appels au plus', async () => {
    const toujoursMele = [] as unknown[];
    for (let i = 0; i < 3; i++)
      toujoursMele.push({ phrase }, { verbes: [] });
    const { demander, appels } = simule(toujoursMele);
    expect(await creerGenerateur(demander, () => 0)()).toBeNull();
    expect(appels.length).toBeLessThanOrEqual(6);
  });

  it('verbe inventé par le contrôle : nouveau tirage', async () => {
    const { demander, appels } = simule([
      { phrase },
      { verbes: [{ verbe: 'dormira', categorie: 'passe' }] },
      { phrase },
      { verbes: [{ verbe: 'mange', categorie: 'passe' }] },
    ]);
    const r = await creerGenerateur(demander, () => 0)();
    expect(r?.categorie).toBe('passe');
    expect(appels).toHaveLength(4);
  });

  it('la consigne de contrôle ne révèle ni le temps ni la catégorie attendue', async () => {
    const { demander, appels } = simule([{ phrase }, { verbes: [{ verbe: 'mange', categorie: 'passe' }] }]);
    await creerGenerateur(demander, () => 0)();
    const generation = appels[0]!.utilisateur;
    expect(generation).toContain('Temps : passé composé.');
    const controle = appels[1]!.utilisateur;
    expect(controle).toBe(phrase);
    expect(controle).not.toMatch(
      /passé composé|imparfait|futur|présent|passe/i,
    );
  });
});

describe('controleAccepte', () => {
  const dort = { verbes: [{ verbe: 'dort', categorie: 'present' }] };

  it('accepte un verbe présent de la bonne catégorie', () => {
    expect(controleAccepte('Le chat dort.', dort, 'present')).toBe(true);
  });

  it('refuse la mauvaise catégorie', () => {
    expect(controleAccepte('Le chat dort.', dort, 'futur')).toBe(false);
  });

  it('refuse des catégories mêlées', () => {
    const mixte = {
      verbes: [
        { verbe: 'dessinera', categorie: 'futur' },
        { verbe: 'crache', categorie: 'present' },
      ],
    };
    expect(
      controleAccepte(
        'Mon grand-père dessinera un volcan qui crache des étoiles orange.',
        mixte,
        'futur',
      ),
    ).toBe(false);
  });

  it('refuse une liste vide', () => {
    expect(controleAccepte('Le chat dort.', { verbes: [] }, 'present')).toBe(
      false,
    );
  });

  it("refuse un verbe absent de la phrase", () => {
    const faux = { verbes: [{ verbe: 'mange', categorie: 'present' }] };
    expect(controleAccepte('Le chat dort.', faux, 'present')).toBe(false);
  });

  it('refuse une réponse mal formée ou nulle', () => {
    for (const r of [null, undefined, 42, {}, { verbes: 'dort' }, { verbes: [null] }]) {
      expect(controleAccepte('Le chat dort.', r, 'present')).toBe(false);
    }
  });
});
