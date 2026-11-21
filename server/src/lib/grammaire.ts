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
