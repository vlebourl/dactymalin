/**
 * Le nom À DIRE d'un caractère, quand la leçon le donne à voix haute (#126).
 *
 * Une lettre simple ou un chiffre se dit tel quel : la synthèse sait le nommer
 * (« i grec », « double vé »). Le reste s'écrit en toutes lettres, parce que le
 * moteur de Piper lit « à » comme « a » et reste MUET sur toute la ponctuation
 * — vérifié sur sa transcription phonétique. Le même nom sert au repli
 * navigateur : l'enfant entend la même chose, quelle que soit la voix.
 *
 * C'est aussi un ensemble FERMÉ : le serveur ne synthétise que ce qui a un nom
 * ici, et ne devient pas un service vocal pour n'importe quel texte.
 */

const ACCENTS: Record<string, string> = {
  '̀': 'accent grave',
  '́': 'accent aigu',
  '̂': 'accent circonflexe',
  '̈': 'tréma',
  '̧': 'cédille',
};

const SIGNES: Record<string, string> = {
  ' ': 'espace',
  '.': 'point',
  ',': 'virgule',
  ';': 'point-virgule',
  ':': 'deux-points',
  '!': "point d'exclamation",
  '?': "point d'interrogation",
  "'": 'apostrophe',
  '’': 'apostrophe',
  '-': "trait d'union",
  '"': 'guillemet',
  '(': 'parenthèse ouvrante',
  ')': 'parenthèse fermante',
};

export function nomDeLettre(caractere: string): string | null {
  if ([...caractere].length !== 1) return null;
  if (caractere in SIGNES) return SIGNES[caractere];
  const c = caractere.toLowerCase();
  if (/^[a-z0-9]$/.test(c)) return c;
  /* « é » = « e » + accent aigu : la décomposition Unicode donne les deux
     moitiés du nom, sans table lettre par lettre. */
  const [base, accent, ...reste] = [...c.normalize('NFD')];
  if (reste.length === 0 && /^[a-z]$/.test(base ?? '') && accent in ACCENTS) {
    return `${base} ${ACCENTS[accent]}`;
  }
  return null;
}
