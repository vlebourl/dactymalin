import Anthropic from '@anthropic-ai/sdk';
import { MOTS_INTERDITS, SUJETS, THEMES, VERBES } from './grammaire-banques';

export type Categorie = 'passe' | 'present' | 'futur';
export type Temps = 'passe_compose' | 'imparfait' | 'present' | 'futur_simple';
export type Tirage = { sujet: string; verbe: string; theme: string; temps: Temps };

export const CATEGORIE_DU_TEMPS: Record<Temps, Categorie> = {
  passe_compose: 'passe',
  imparfait: 'passe',
  present: 'present',
  futur_simple: 'futur',
};

const MOTS_MAX = 15;

const choisir = <T>(liste: readonly T[], alea: () => number): T =>
  liste[Math.floor(alea() * liste.length)]!;

/** Tire la catégorie (1/3 chacune), puis pour le passé composé ou imparfait (1/2 chacun). */
export function tirer(alea: () => number = Math.random): Tirage {
  const categorie = choisir<Categorie>(['passe', 'present', 'futur'], alea);
  const temps: Temps =
    categorie === 'passe'
      ? choisir<Temps>(['passe_compose', 'imparfait'], alea)
      : categorie === 'present'
        ? 'present'
        : 'futur_simple';
  return {
    sujet: choisir(SUJETS, alea),
    verbe: choisir(VERBES, alea),
    theme: choisir(THEMES, alea),
    temps,
  };
}

const ECHAPPER = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const INTERDITS = MOTS_INTERDITS.map(
  (m) => new RegExp(`(?<!\\p{L})${ECHAPPER(m)}(?!\\p{L})`, 'iu'),
);

/** Une seule ligne, 15 mots au plus, aucun mot interdit (mots entiers, sans casse). */
export function phraseValide(phrase: string): boolean {
  if (!phrase.trim() || phrase.includes('\n')) return false;
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
export type Generateur = () => Promise<PhraseGrammaire | null>;

export const PROMPT_GENERATION =
  "Tu écris des phrases d'exercice de grammaire pour un enfant de 8 ans. On te donne un sujet, un verbe à l'infinitif, un thème et un temps. Écris UNE phrase simple en français qui commence par ce sujet, avec ce verbe comme seul verbe conjugué, au temps demandé, en rapport avec le thème. Vocabulaire du quotidien, 12 mots au plus. N'emploie aucun mot qui indique le moment (hier, demain, aujourd'hui, maintenant, bientôt, autrefois, ce matin, la semaine prochaine…) : seul le verbe doit montrer le temps. Si la combinaison est étrange, écris une phrase amusante mais correcte. Mets uniquement la phrase finale dans le champ phrase.";

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
  return async () => {
    for (let essai = 0; essai < ESSAIS_MAX; essai++) {
      const t = tirer(alea);
      const generee = (await demander(
        PROMPT_GENERATION,
        `Sujet : ${t.sujet}. Verbe : ${t.verbe}. Thème : ${t.theme}. Temps : ${LIBELLE_TEMPS[t.temps]}.`,
        SCHEMA_GENERATION,
      )) as { phrase?: unknown } | null;
      const phrase = generee?.phrase;
      if (typeof phrase !== 'string' || !phraseValide(phrase)) continue;
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
