import type { IdDisposition } from './layouts';
import { ensembleTouches } from './paliers';

/**
 * Corpus unique de VRAIS mots français du lexique 7-12 ans, en minuscules,
 * apostrophe droite, sans majuscule accentuée, sans caractère AltGr (cahier 4.7).
 * Le filtrage par palier ET par disposition est fait par `motsDisponibles` :
 * un mot n'est jamais proposé si un seul de ses caractères est hors ensemble.
 */
export const MOTS: string[] = [
  // — atteignables dès le palier 1 (e f j n s t u + espace)
  'un', 'une', 'tu', 'nu', 'jus', 'fut', 'net', 'tenu', 'tenue', 'sujet', 'neuf',
  'juste', 'justes', 'jeune', 'jeunes', 'jeu', 'je', 'ne', 'te', 'se', 'et',
  'tes', 'ses', 'sent', 'tente', 'tentes', 'un jus', 'un sujet', 'une tente',
  'jet', 'jets', 'sujets', 'tenues', 'nette', 'nettes', 'juteuse',
  'un jeu', 'tu sens', 'je tente', 'une tenue',

  // — palier 2 (+ a i r v)
  'vrai', 'vraie', 'faire', 'avis', 'train', 'suivant', 'univers', 'fruit', 'juin',
  'avenir', 'venir', 'tenir', 'rire', 'vite', 'rive', 'avant', 'ravi', 'artiste',
  'ainsi', 'instant', 'veste', 'raisin', 'nature', 'trente', 'servir', 'nuit',
  'navire', 'averse', 'navet', 'tartine', 'tissu', 'vitre', 'usine', 'farine',
  'vivre', 'suivre', 'jaune', 'ruse', 'vitrine',
  'un train', 'une nuit', 'tu viens', 'je ris', 'un fruit vert', 'un vrai festin',

  // — palier 3 (+ o l d b m)
  'maison', 'bateau', 'lundi', 'soleil', 'tableau', 'bandit', 'monde', 'dinosaure',
  'ballon', 'oiseau', 'domino', 'salade', 'limonade', 'bonjour', 'moulin', 'bouton',
  'tomate', 'malade', 'melon', 'dessin', 'olive', 'danser', 'bonbon', 'animal',
  'salut', 'demain', 'aussi', 'belle', 'boule', 'route', 'libre', 'solide', 'lumiere',
  'lion', 'lune', 'mardi', 'samedi', 'radis', 'salon', 'ombre', 'sable', 'table',
  'jardin', 'jambon', 'mouton', 'souris', 'abeille', 'famille', 'vanille', 'bille',
  'balade', 'matin', 'monstre', 'blond', 'violet', 'marron', 'bleu', 'noir',
  'dos', 'bras', 'jambe', 'moto', 'auto', 'ours', 'midi',
  'un ballon', 'la maison', 'mon bateau', 'la lune brille', 'le lion dort',
  'il est midi', 'il fait beau', 'un beau matin', 'je dessine', 'tu danses',

  // — palier 4 (+ g h p c)
  'chat', 'papa', 'cheval', 'chien', 'grand', 'poisson', 'chocolat', 'gomme',
  'chapeau', 'guitare', 'plage', 'campagne', 'cuisine', 'copain', 'montagne',
  'printemps', 'grenouille', 'peinture', 'chanson', 'citrouille', 'escargot',
  'hibou', 'papillon', 'pluie', 'sourire', 'chaton', 'dauphin', 'girafe', 'singe',
  'tigre', 'cochon', 'lapin', 'poule', 'canard', 'phoque',
  'orage', 'nuage', 'espace', 'glace', 'pirate', 'prince', 'dragon', 'magie',
  'plante', 'poire', 'pomme', 'prune', 'orange', 'citron', 'carotte', 'chou',
  'champignon', 'panda', 'renard', 'requin', 'mouche', 'vache', 'biche', 'loup',
  'pingouin', 'plume', 'grotte', 'piscine', 'cabane', 'copine', 'cartable',
  'un chat', 'le chien', 'du chocolat', 'le chat dort', 'un gros chien',
  'papa chante', 'le poisson nage', 'je mange une pomme', 'la glace au chocolat',

  // — palier 5 (+ é è à ç ; ç seulement quand la disposition l'ouvre)
  'ecole', 'eleve', 'tres', 'apres', 'bebe', 'elephant', 'cafe', 'etoile',
  'ecole', 'cinema', 'fevrier', 'reveil', 'poesie', 'planete',
  'probleme', 'pere', 'mere', 'frere', 'regle', 'legume', 'ocean', 'sante',
  'verite', 'deja', 'voila', 'garcon', 'francais', 'lecon', 'facon',
  'velo', 'metro', 'ete', 'fee', 'musee', 'idee', 'journee', 'annee',
  'chevre', 'lievre', 'panthere', 'riviere', 'sirene',
  'mon velo est rouge', 'la fee vole',

  // — palier 6 (+ q w x y z ù)
  'quatre', 'wagon', 'sandwich', 'taxi', 'zebre', 'yeux', 'quinze', 'zero', 'bizarre',
  'voyage', 'crayon', 'royaume', 'quille', 'musique', 'cirque', 'xylophone',
  'quarante', 'joyeux', 'physique', 'pyjama', 'quelque', 'ou',
  'yaourt', 'yoga', 'zoo', 'onze', 'douze', 'treize', 'seize', 'gaz', 'riz',
  'lezard', 'quartier', 'question', 'quand', 'pourquoi', 'mystere', 'wapiti',
  'noyau', 'tuyau', 'rayon', 'moyen',
  'le zebre est bizarre',
];

/**
 * Les mots ci-dessus sont écrits sans accents pour rester lisibles dans le source ;
 * cette table porte leur orthographe RÉELLE. Un mot accentué n'apparaît donc
 * qu'au palier qui ouvre ses accents.
 */
const ACCENTUES: Record<string, string> = {
  ecole: 'école', eleve: 'élève', tres: 'très', apres: 'après', bebe: 'bébé',
  elephant: 'éléphant', cafe: 'café', etoile: 'étoile', cinema: 'cinéma',
  fevrier: 'février', reveil: 'réveil', poesie: 'poésie',  planete: 'planète', probleme: 'problème', pere: 'père', mere: 'mère',
  frere: 'frère', regle: 'règle', legume: 'légume', ocean: 'océan',
  sante: 'santé', verite: 'vérité', deja: 'déjà', voila: 'voilà',
  garcon: 'garçon', francais: 'français', lecon: 'leçon', facon: 'façon',
  zebre: 'zèbre', zero: 'zéro', lumiere: 'lumière', ou: 'où',
  velo: 'vélo', metro: 'métro', ete: 'été', fee: 'fée', musee: 'musée',
  idee: 'idée', journee: 'journée', annee: 'année', chevre: 'chèvre',
  lievre: 'lièvre', panthere: 'panthère', riviere: 'rivière', sirene: 'sirène',
  lezard: 'lézard', mystere: 'mystère',
  'mon velo est rouge': 'mon vélo est rouge', 'la fee vole': 'la fée vole',
  'le zebre est bizarre': 'le zèbre est bizarre',
};

/** Syllabes de dernier recours, toujours ÉTIQUETÉES « on lit et on tape ». */
export const SYLLABES: string[] = [
  'te', 'ne', 'se', 'fe', 'je', 'tu', 'nu', 'su', 'ra', 'vi', 'la', 'mo',
  'do', 'bo', 'cha', 'pi', 'gu', 'ho',
];

const normalise = (m: string) => ACCENTUES[m] ?? m;

/** Le corpus effectif, orthographe réelle, dédoublonné. */
export const CORPUS: string[] = [...new Set(MOTS.map(normalise))];

export function estTypable(mot: string, ensemble: Set<string>): boolean {
  return [...mot].every((c) => ensemble.has(c));
}

/** Tous les vrais mots typables au palier `numero` sur cette disposition. */
export function motsDisponibles(id: IdDisposition, numero: number): string[] {
  const ensemble = ensembleTouches(id, numero);
  return CORPUS.filter((m) => estTypable(m, ensemble));
}

/** Mots que le palier `numero` vient tout juste de débloquer (gain lexical de V5). */
export function motsNouveaux(id: IdDisposition, numero: number): string[] {
  if (numero <= 1) return motsDisponibles(id, 1);
  const avant = new Set(motsDisponibles(id, numero - 1));
  return motsDisponibles(id, numero).filter((m) => !avant.has(m));
}

/* `syllabesDisponibles` a disparu (#36) : le générateur ne sert plus de
   syllabe de remplissage, et personne d'autre ne l'appelait. La liste
   `SYLLABES` reste le temps que `corpus.ts` vive — elle part avec lui (#48). */

/** Chiffres ouverts au palier `numero`, dans l'ordre croissant. */
export function chiffresDisponibles(id: IdDisposition, numero: number): string[] {
  const ensemble = ensembleTouches(id, numero);
  return '0123456789'.split('').filter((c) => ensemble.has(c));
}
