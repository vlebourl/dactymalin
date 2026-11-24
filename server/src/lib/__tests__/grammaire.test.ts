import { describe, expect, it } from 'vitest';
import { SUJETS, THEMES, VERBES } from '../grammaire-banques';
import {
  CATEGORIE_DU_TEMPS,
  DUREES,
  MARQUEURS,
  controleAccepte,
  creerGenerateur,
  marqueurEnFin,
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

  it('niveau marqueurs seul : toujours un marqueur de la bonne catégorie, passé au passé composé', () => {
    for (let i = 0; i < 1000; i++) {
      const t = tirer(Math.random, ['marqueurs']);
      const c = CATEGORIE_DU_TEMPS[t.temps];
      expect(MARQUEURS[c].some((m) => t.marqueur === m || t.marqueur!.startsWith(`${m} `))).toBe(true);
      expect(t.temps).not.toBe('imparfait');
    }
  });

  it('« Il y a » et « Dans » reçoivent une durée, au passé et au futur seulement', () => {
    const marqueurs = Array.from({ length: 3000 }, () => tirer(Math.random, ['marqueurs']));
    const duree = new RegExp(`^(Il y a|Dans) (${DUREES.join('|')})$`);
    const avec = marqueurs.filter((t) => /^(Il y a|Dans)\b/.test(t.marqueur!));
    expect(avec.length).toBeGreaterThan(0);
    for (const t of avec) {
      expect(t.marqueur).toMatch(duree);
      expect(CATEGORIE_DU_TEMPS[t.temps]).toBe(t.marqueur!.startsWith('Il y a') ? 'passe' : 'futur');
    }
  });

  it('niveau marqueurs : le marqueur va en fin de phrase une fois sur deux', () => {
    const N = 3000;
    const enFin = Array.from({ length: N }, () => tirer(Math.random, ['marqueurs'])).filter((t) => t.enFin);
    expect(Math.abs(enFin.length / N - 0.5)).toBeLessThan(0.05);
  });

  it.each([
    ['imparfait', 'imparfait'],
    ['passe_compose', 'passe_compose'],
  ] as const)('niveau %s seul : passés à ce temps, sans marqueur, présent et futur gardés', (niveau, temps) => {
    const tirages = Array.from({ length: 1000 }, () => tirer(Math.random, [niveau]));
    for (const t of tirages) {
      expect(t.marqueur).toBeUndefined();
      expect(t.enFin).toBeUndefined();
      if (CATEGORIE_DU_TEMPS[t.temps] === 'passe') expect(t.temps).toBe(temps);
    }
    for (const c of ['passe', 'present', 'futur']) {
      expect(tirages.some((t) => CATEGORIE_DU_TEMPS[t.temps] === c)).toBe(true);
    }
  });

  it('ne tire jamais de verbe exclu', () => {
    const exclus = ['savoir', 'vouloir', 'pouvoir', 'dire', 'être', 'avoir'];
    for (let i = 0; i < 3000; i++) expect(exclus).not.toContain(tirer().verbe);
  });

  it("ne garde que des verbes qui prennent un COD (phrase sujet + verbe + COD)", () => {
    const intransitifs = [
      'dormir', 'courir', 'marcher', 'nager', 'sauter', 'danser', 'rire', 'crier', 'tomber',
      'grimper', 'partir', 'arriver', 'venir', 'aller', 'sortir', 'rentrer', 'parler', 'jouer', 'mettre',
    ];
    for (const v of intransitifs) expect(VERBES).not.toContain(v);
    expect(VERBES.length).toBeGreaterThanOrEqual(60);
  });
});

describe('phraseValide', () => {
  it.each([
    'Le chat mange une souris.',
    'Mon grand-père répare la passerelle.',
    'Les enfants ont construit un château.',
    'Maël buvait du lait.',
    "Tu prendras de l'eau.",
  ])('accepte %s', (p) => expect(phraseValide(p)).toBe(true));

  it.each([
    'Le chat mange une souris dans le jardin.',
    'Léa donne un livre à Tom.',
    'Le chat mange une souris qui dort.',
    'Léa mange une pomme et une poire.',
    'Le chien, très content, mange un os.',
    'Le hérisson dort sous les feuilles.',
    'Tom mange une pomme avec sa sœur.',
    'Il y a un chat.',
    'Le chat ne mange pas la souris.',
    'Mon cousin regardait les grands bateaux rouges du port de pêche.',
  ])('rejette ce qui sort de sujet + verbe + COD : %j', (p) => expect(phraseValide(p)).toBe(false));

  it.each([
    'Le géant chantera une chanson joyeuse au marché demain matin.',
    'Demain, Léa mangera une pomme.',
    'Léa a déjà mangé.',
    'La semaine prochaine, on partira.',
    "Le renard prenait son petit déjeuner près de la fusée qui brillait dans la nuit noire.",
    'Tom apporte un présent à sa sœur.',
    'Un chat\nqui dort.',
    '',
    '   ',
  ])('rejette %j', (p) => expect(phraseValide(p)).toBe(false));
});

describe('phraseValide avec marqueur', () => {
  it.each([
    ['Hier', 'Hier, Léa a mangé une pomme.'],
    ['La semaine prochaine', 'La semaine prochaine, Tom lavera la voiture.'],
    ["Aujourd'hui", "Aujourd'hui, le chat mange une souris."],
    ['Il y a 2 jours', 'Il y a 2 jours, Léa a lavé la voiture.'],
    ['Dans 3 ans', 'Dans 3 ans, Tom construira une maison.'],
  ])('accepte « %s, » + sujet verbe COD', (m, p) => expect(phraseValide(p, m)).toBe(true));

  it.each([
    ['Hier', 'Léa a mangé une pomme.'],
    ['Hier', 'Demain, Léa mangera une pomme.'],
    ['Hier', 'Hier Léa a mangé une pomme.'],
    ['Hier', 'Hier, Léa a mangé une pomme dans le jardin.'],
    ['Hier', 'Hier, Léa a mangé une pomme, puis une poire.'],
    ['Demain', 'Demain, Léa mangera une pomme demain.'],
  ])('rejette avec « %s » : %j', (m, p) => expect(phraseValide(p, m)).toBe(false));
});

describe('marqueurEnFin', () => {
  it.each([
    ['Hier', 'Léa a mangé une pomme.', 'Léa a mangé une pomme hier.'],
    ['Il y a 2 jours', 'Léa a lavé la voiture.', 'Léa a lavé la voiture il y a 2 jours.'],
    ['Dans 3 ans', 'Tom construira une maison.', 'Tom construira une maison dans 3 ans.'],
    ["Aujourd'hui", 'Le chat mange une souris.', "Le chat mange une souris aujourd'hui."],
    ['La semaine dernière', 'On a visité un musée', 'On a visité un musée la semaine dernière.'],
    ['Demain', 'Tu gagneras la course ! ', 'Tu gagneras la course demain.'],
  ])('« %s » après %j', (m, p, attendu) => expect(marqueurEnFin(p, m)).toBe(attendu));
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

describe('creerGenerateur : niveaux', () => {
  it('niveau marqueurs : le marqueur est demandé, puis exigé en tête de phrase', async () => {
    const appels: string[] = [];
    const reponses: unknown[] = [
      { phrase: 'Léa a mangé une pomme.' }, // marqueur oublié : rejetée
      { phrase: 'Hier, Léa a mangé une pomme.' },
      { verbes: [{ verbe: 'a mangé', categorie: 'passe' }] },
    ];
    const demander: Demander = async (_s, u) => {
      appels.push(u);
      return reponses.shift() ?? null;
    };
    // alea à 0 : niveau marqueurs, catégorie passé, marqueur « Hier »
    const r = await creerGenerateur(demander, () => 0)(['marqueurs']);
    expect(r).toEqual({ phrase: 'Hier, Léa a mangé une pomme.', categorie: 'passe' });
    expect(appels[0]).toContain('Marqueur de temps : Hier.');
    expect(appels).toHaveLength(3);
  });

  it('marqueur en fin : phrase demandée et contrôlée sans marqueur, puis le serveur l\'ajoute', async () => {
    const appels: string[] = [];
    const reponses: unknown[] = [
      { phrase: 'Maintenant, Léa mange une pomme.' }, // marqueur en tête : rejetée
      { phrase: 'Léa mange une pomme.' },
      { verbes: [{ verbe: 'mange', categorie: 'present' }] },
    ];
    const demander: Demander = async (_s, u) => {
      appels.push(u);
      return reponses.shift() ?? null;
    };
    // alea à 0,5 : catégorie présent, marqueur « Maintenant », en fin de phrase
    const r = await creerGenerateur(demander, () => 0.5)(['marqueurs']);
    expect(r).toEqual({ phrase: 'Léa mange une pomme maintenant.', categorie: 'present' });
    expect(appels[0]).not.toContain('Marqueur');
    expect(appels[2]).toBe('Léa mange une pomme.');
    expect(appels).toHaveLength(3);
  });

  it('sans marqueur, la consigne ne parle pas de marqueur', async () => {
    const appels: string[] = [];
    const demander: Demander = async (_s, u) => {
      appels.push(u);
      return null;
    };
    await creerGenerateur(demander, () => 0)(['imparfait']);
    expect(appels[0]).toContain('Temps : imparfait.');
    expect(appels[0]).not.toContain('Marqueur');
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
