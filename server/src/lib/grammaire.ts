import Anthropic from '@anthropic-ai/sdk';
import { MOTS_INTERDITS, SUJETS, THEMES, VERBES } from './grammaire-banques';

export type Categorie = 'passe' | 'present' | 'futur';
export type Temps = 'passe_compose' | 'imparfait' | 'present' | 'futur_simple';
export type Tirage = { sujet: string; verbe: string; theme: string; temps: Temps; marqueur?: string };

/* Niveaux cochés au début de la série. Présent et futur sont de tous les
   niveaux (sinon la réponse serait toujours « Passé ») ; le niveau dit quel
   passé on tire, et si la phrase commence par un marqueur de temps. */
export type Niveau = 'marqueurs' | 'imparfait' | 'passe_compose';
export const NIVEAUX: readonly Niveau[] = ['marqueurs', 'imparfait', 'passe_compose'];
/** Sans niveau demandé : le passé composé et l'imparfait, sans marqueur. */
export const NIVEAUX_PAR_DEFAUT: readonly Niveau[] = ['passe_compose', 'imparfait'];

/* Le marqueur ouvre la phrase, suivi d'une virgule : « Hier, Léa a mangé une pomme. »
   « Il y a » et « Dans » reçoivent une durée tirée dans DUREES (« Il y a 2 jours »). */
export const MARQUEURS: Record<Categorie, readonly string[]> = {
  passe: ['Hier', 'Avant-hier', 'La semaine dernière', 'Il y a'],
  present: ["Aujourd'hui", 'Maintenant', 'En ce moment'],
  futur: ['Demain', 'Après-demain', 'La semaine prochaine', 'Dans'],
};
export const DUREES: readonly string[] = [
  '2 jours', '3 jours', '5 jours', '2 semaines', '3 semaines',
  '2 mois', '6 mois', '2 ans', '3 ans', '10 ans',
];
const AVEC_DUREE = ['Il y a', 'Dans'];
const tirerMarqueur = (c: Categorie, alea: () => number) => {
  const m = choisir(MARQUEURS[c], alea);
  return AVEC_DUREE.includes(m) ? `${m} ${choisir(DUREES, alea)}` : m;
};

export const CATEGORIE_DU_TEMPS: Record<Temps, Categorie> = {
  passe_compose: 'passe',
  imparfait: 'passe',
  present: 'present',
  futur_simple: 'futur',
};

/* Sujet + verbe + COD, rien d'autre : « Mon grand-père a construit un grand
   château. » tient en 8 mots. Au-delà, un groupe de trop s'est glissé. */
const MOTS_MAX = 8;

/* Ce qui ouvre un groupe ou une proposition de plus (COI, complément de lieu,
   relative, coordination, négation…). « de » n'y est pas : « du lait »,
   « de l'eau » sont des COD. */
const HORS_STRUCTURE = [
  'à', 'au', 'aux', 'dans', 'sur', 'sous', 'avec', 'pour', 'chez', 'vers', 'par', 'sans',
  'pendant', 'devant', 'derrière', 'entre', 'contre', 'près', 'en', 'y',
  'qui', 'que', 'qu', 'quand', 'si', 'comme', 'lorsque', 'parce', 'puis',
  'et', 'ou', 'mais', 'car', 'donc', 'ne', 'pas',
];

const choisir = <T>(liste: readonly T[], alea: () => number): T =>
  liste[Math.floor(alea() * liste.length)]!;

/** Tire un niveau parmi ceux cochés, puis la catégorie (1/3 chacune). Le passé
    est à l'imparfait pour le niveau imparfait, au passé composé sinon. */
export function tirer(
  alea: () => number = Math.random,
  niveaux: readonly Niveau[] = NIVEAUX_PAR_DEFAUT,
): Tirage {
  const niveau = choisir(niveaux, alea);
  const categorie = choisir<Categorie>(['passe', 'present', 'futur'], alea);
  const temps: Temps =
    categorie === 'passe'
      ? niveau === 'imparfait'
        ? 'imparfait'
        : 'passe_compose'
      : categorie === 'present'
        ? 'present'
        : 'futur_simple';
  return {
    ...(niveau === 'marqueurs' && { marqueur: tirerMarqueur(categorie, alea) }),
    sujet: choisir(SUJETS, alea),
    verbe: choisir(VERBES, alea),
    theme: choisir(THEMES, alea),
    temps,
  };
}

const ECHAPPER = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const INTERDITS = [...MOTS_INTERDITS, ...HORS_STRUCTURE].map(
  (m) => new RegExp(`(?<!\\p{L})${ECHAPPER(m)}(?!\\p{L})`, 'iu'),
);

/**
 * Une seule ligne, 8 mots au plus, sans virgule, sans mot qui donne le temps
 * ni mot qui ouvre un groupe de plus (mots entiers, sans casse). Avec un
 * marqueur : la phrase commence par « <marqueur>, » et le reste suit la même règle.
 */
export function phraseValide(phrase: string, marqueur?: string): boolean {
  if (marqueur) {
    const debut = `${marqueur}, `;
    if (phrase.slice(0, debut.length).toLowerCase() !== debut.toLowerCase()) return false;
    return phraseValide(phrase.slice(debut.length));
  }
  if (!phrase.trim() || phrase.includes('\n') || phrase.includes(',')) return false;
  const mots = phrase.split(/[\s']+/).filter(Boolean);
  if (mots.length > MOTS_MAX) return false;
  return !INTERDITS.some((re) => re.test(phrase));
}

/** Un appel au modèle qui renvoie l'objet JSON du format imposé, ou null (refus, coupure, JSON invalide, erreur réseau). */
export type Demander = (
  systeme: string,
  utilisateur: string,
  schema: object,
) => Promise<unknown | null>;
export type PhraseGrammaire = { phrase: string; categorie: Categorie };
export type Generateur = (niveaux?: readonly Niveau[]) => Promise<PhraseGrammaire | null>;

export const PROMPT_GENERATION =
  "Tu écris des phrases d'exercice de grammaire pour un enfant de 7 ans (CE1). On te donne un sujet, un verbe à l'infinitif, un thème et un temps. Écris UNE phrase très simple en français, construite EXACTEMENT ainsi : le sujet donné, puis le verbe donné conjugué au temps demandé, puis un complément d'objet direct (COD). Le COD est un groupe nominal court : un déterminant et un nom, avec au plus un adjectif, choisi en rapport avec le thème. La phrase doit avoir du sens : si le thème ne va pas avec le verbe, ignore le thème et choisis un COD logique pour ce verbe. Rien d'autre : pas de complément d'objet indirect (à…, au…), pas de complément de lieu, de temps ou de manière, pas d'adverbe, pas de proposition relative ou subordonnée, pas de « et », pas de négation, pas de virgule. 8 mots au plus, vocabulaire du quotidien. Exemples de la forme attendue : « Le chat mange une souris. », « Ma sœur a peint un grand soleil. », « Les enfants rangeront leurs jouets. ». Si on te donne un marqueur de temps, c'est la seule exception : la phrase commence par ce marqueur, écrit tel quel, suivi d'une virgule, puis le sujet, le verbe et le COD (ex. « Hier, le chat a mangé une souris. »). Mets uniquement la phrase finale dans le champ phrase.";

export const PROMPT_CONTROLE =
  "Tu aides un enfant de CE1. Relève TOUS les verbes conjugués de la phrase, y compris ceux des propositions subordonnées (après qui, que, quand, si, pendant que…). Pour un temps composé, donne l'auxiliaire et le participe ensemble (ex. « a mangé »). Ne relève ni les infinitifs, ni les participes présents, ni les gérondifs. Pour chaque verbe, donne sa catégorie : passe (passé composé, imparfait), present ou futur.";

const SCHEMA_GENERATION = {
  type: 'object',
  properties: { phrase: { type: 'string' } },
  required: ['phrase'],
  additionalProperties: false,
};
export const SCHEMA_CONTROLE = {
  type: 'object',
  properties: {
    verbes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          verbe: { type: 'string' },
          categorie: { type: 'string', enum: ['passe', 'present', 'futur'] },
        },
        required: ['verbe', 'categorie'],
        additionalProperties: false,
      },
    },
  },
  required: ['verbes'],
  additionalProperties: false,
};

/** Le contrôle est accepté si tous les verbes relevés (au moins un, présents dans la phrase) sont de la catégorie attendue. */
export function controleAccepte(
  phrase: string,
  reponse: unknown,
  attendue: Categorie,
): boolean {
  const verbes = (reponse as { verbes?: unknown } | null)?.verbes;
  if (!Array.isArray(verbes) || verbes.length === 0) return false;
  const minuscule = phrase.toLowerCase();
  return verbes.every((v) => {
    const { verbe, categorie } = (v ?? {}) as {
      verbe?: unknown;
      categorie?: unknown;
    };
    return (
      categorie === attendue &&
      typeof verbe === 'string' &&
      verbe.trim() !== '' &&
      minuscule.includes(verbe.trim().toLowerCase())
    );
  });
}

const LIBELLE_TEMPS: Record<Temps, string> = {
  passe_compose: 'passé composé',
  imparfait: 'imparfait',
  present: "présent de l'indicatif",
  futur_simple: 'futur simple',
};

const ESSAIS_MAX = 3;

/** Génère une phrase puis la fait contrôler à l'aveugle (sans lui dire le temps visé). */
export function creerGenerateur(
  demander: Demander,
  alea: () => number = Math.random,
): Generateur {
  return async (niveaux = NIVEAUX_PAR_DEFAUT) => {
    for (let essai = 0; essai < ESSAIS_MAX; essai++) {
      const t = tirer(alea, niveaux);
      const generee = (await demander(
        PROMPT_GENERATION,
        `Sujet : ${t.sujet}. Verbe : ${t.verbe}. Thème : ${t.theme}. Temps : ${LIBELLE_TEMPS[t.temps]}.` +
          (t.marqueur ? ` Marqueur de temps : ${t.marqueur}.` : ''),
        SCHEMA_GENERATION,
      )) as { phrase?: unknown } | null;
      const phrase = generee?.phrase;
      if (typeof phrase !== 'string' || !phraseValide(phrase, t.marqueur)) continue;
      const controle = await demander(PROMPT_CONTROLE, phrase, SCHEMA_CONTROLE);
      const attendue = CATEGORIE_DU_TEMPS[t.temps];
      if (controleAccepte(phrase, controle, attendue)) {
        return { phrase, categorie: attendue };
      }
    }
    return null;
  };
}

/** Client Anthropic mince : sortie JSON structurée, toute erreur donne null (la clé n'est jamais journalisée). */
export function demanderAvecAnthropic(cle: string): Demander {
  const client = new Anthropic({ apiKey: cle, maxRetries: 1, timeout: 15_000 });
  return async (system, utilisateur, schema) => {
    try {
      const reponse = await client.messages.create({
        model: 'claude-haiku-5-5',
        max_tokens: 1024,
        output_config: {
          effort: 'low',
          format: {
            type: 'json_schema',
            schema: schema as Record<string, unknown>,
          },
        },
        system,
        messages: [{ role: 'user', content: utilisateur }],
      });
      if (reponse.stop_reason !== 'end_turn') return null;
      const texte = reponse.content
        .map((b) => (b.type === 'text' ? b.text : ''))
        .join('');
      return JSON.parse(texte) as unknown;
    } catch (e) {
      console.error(
        'grammaire : appel Anthropic échoué',
        e instanceof Anthropic.APIError
          ? `APIError ${e.status}`
          : (e as Error)?.name,
      );
      return null;
    }
  };
}

/** Verdict sur une clé saisie par un parent, avant de l'enregistrer. */
export type VerifierCle = (cle: string) => Promise<'valide' | 'refusee' | 'injoignable'>;

/**
 * Un mini-appel payant (16 tokens au plus) : 401/403 veut dire que la clé est
 * refusée, toute autre erreur qu'on n'a pas pu trancher. La clé n'est jamais
 * journalisée, ni l'erreur entière (elle peut porter les en-têtes).
 */
export const verifierAvecAnthropic: VerifierCle = async (cle) => {
  const client = new Anthropic({ apiKey: cle, maxRetries: 0, timeout: 10_000 });
  try {
    await client.messages.create({
      model: 'claude-haiku-5-5',
      max_tokens: 16,
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content: 'Réponds OK.' }],
    });
    return 'valide';
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
      return 'refusee';
    }
    console.error(
      'grammaire : vérification de clé impossible',
      e instanceof Anthropic.APIError ? `APIError ${e.status}` : (e as Error)?.name,
    );
    return 'injoignable';
  }
};
