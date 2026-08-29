/**
 * Tables de disposition déclaratives. Deux tables DISTINCTES, jamais partagées (cahier 4.6).
 * `base`  = caractère produit sans modificateur.
 * `maj`   = caractère produit avec Maj (palier 7 uniquement).
 * `morte` = touche morte : exclue du curriculum MVP.
 */

export type Main = 'gauche' | 'droite';
export type IdDisposition = 'fr-FR' | 'fr-CH';

export type Touche = {
  code: string;
  base?: string;
  maj?: string;
  main: Main;
  morte?: boolean;
  /**
   * Touche DESSINÉE mais sans aucun rôle : Retour arrière (rien à effacer,
   * cahier 4.2 / spec F3). Comme `morte`, elle n'est jamais proposable.
   */
  inerte?: boolean;
  /** libellé des touches sans caractère (Maj, Entrée…) */
  nom?: string;
  /** touche modificatrice : dessinée seulement quand la leçon l'exige (palier 7) */
  modificateur?: boolean;
  /** largeur en unités de touche (1 par défaut) */
  large?: number;
  /** repère tactile physique (F et J) */
  repere?: boolean;
  /**
   * Hiérarchie des légendes, PORTÉE PAR LA TABLE et jamais déduite du type de
   * caractère : la légende dominante est toujours ce que la touche produit
   * sans modificateur (AZERTY `&` gros / `1` petit ; CH `4` gros / `ç` petit).
   */
  legendePrincipale?: string;
  legendeSecondaire?: string;
};

export type Disposition = {
  id: IdDisposition;
  nom: string;
  nomCourt: string;
  /** rangées du bloc gauche et du bloc droit, hors barre d'espace */
  rangees: Touche[][];
  /** ligne d'explication contextuelle de V2 */
  explication: string;
};

const g = (code: string, base: string, maj?: string, extra: Partial<Touche> = {}): Touche => ({
  code,
  base,
  maj,
  main: 'gauche',
  ...extra,
});
const d = (code: string, base: string, maj?: string, extra: Partial<Touche> = {}): Touche => ({
  code,
  base,
  maj,
  main: 'droite',
  ...extra,
});

/* Les deux Majuscules. Elles n'ont pas de caractère : elles ne sont dessinées
   qu'au palier où la leçon les réclame, et servent de SECONDE touche allumée
   (règle contralatérale P8). */
export const MAJ_GAUCHE = 'ShiftLeft';
export const MAJ_DROITE = 'ShiftRight';

const majG = (): Touche => ({
  code: MAJ_GAUCHE, main: 'gauche', nom: 'Maj', large: 1.25, modificateur: true,
});
const majD = (): Touche => ({
  code: MAJ_DROITE, main: 'droite', nom: 'Maj', large: 1.7, modificateur: true,
});
/* Le Retour arrière n'est PAS dessiné. Le cahier (4.2, spec F3) le voulait
   présent mais éteint ; à l'usage il n'apportait rien — rien ne s'écrit jamais
   de faux, il n'y a donc rien à effacer — et il occupait le bout de la rangée
   des chiffres, là où l'œil d'un enfant cherche le clavier. `inerte` reste
   utilisé par le `²` de FR-FR. */

/* ------------------------------------------------------------------ FR-FR */
/* Matrice PHYSIQUE complète du bloc alphanumérique ISO, d'après kbdfr.
   Rangée des chiffres : légende haute = chiffre (Maj), légende basse = direct. */
const FR_FR: Disposition = {
  id: 'fr-FR',
  nom: 'Français (AZERTY)',
  nomCourt: 'AZERTY',
  explication: 'Sur ce clavier, les chiffres arrivent au palier de la touche Majuscule.',
  rangees: [
    [
      g('Backquote', '²', undefined, { inerte: true }),
      g('Digit1', '&', '1'),
      g('Digit2', 'é', '2'),
      g('Digit3', '"', '3'),
      g('Digit4', "'", '4'),
      g('Digit5', '(', '5'),
      d('Digit6', '-', '6'),
      d('Digit7', 'è', '7'),
      d('Digit8', '_', '8'),
      d('Digit9', 'ç', '9'),
      d('Digit0', 'à', '0'),
      d('Minus', ')', '°'),
      d('Equal', '=', '+'),
    ],
    [
      g('KeyQ', 'a'),
      g('KeyW', 'z'),
      g('KeyE', 'e'),
      g('KeyR', 'r'),
      g('KeyT', 't'),
      d('KeyY', 'y'),
      d('KeyU', 'u'),
      d('KeyI', 'i'),
      d('KeyO', 'o'),
      d('KeyP', 'p'),
      d('BracketLeft', '^', '¨', { morte: true }),
      d('BracketRight', '$', '£'),
    ],
    [
      g('KeyA', 'q'),
      g('KeyS', 's'),
      g('KeyD', 'd'),
      g('KeyF', 'f', undefined, { repere: true }),
      g('KeyG', 'g'),
      d('KeyH', 'h'),
      d('KeyJ', 'j', undefined, { repere: true }),
      d('KeyK', 'k'),
      d('KeyL', 'l'),
      d('Semicolon', 'm'),
      d('Quote', 'ù', '%'),
      d('Backslash', '*', 'µ'),
    ],
    [
      majG(),
      g('IntlBackslash', '<', '>'),
      g('KeyZ', 'w'),
      g('KeyX', 'x'),
      g('KeyC', 'c'),
      g('KeyV', 'v'),
      g('KeyB', 'b'),
      d('KeyN', 'n'),
      d('KeyM', ',', '?'),
      d('Comma', ';', '.'), // le point exige Maj en FR-FR ⇒ palier 7
      d('Period', ':', '/'),
      d('Slash', '!', '§'),
      majD(),
    ],
  ],
};

/* ------------------------------------------------------------------ FR-CH */
/* Matrice PHYSIQUE complète d'après kbdsf_2. Chiffres DIRECTS. ç = Maj+4.
   ù = touche morte (^) ⇒ hors MVP. Point direct. */
const FR_CH: Disposition = {
  id: 'fr-CH',
  nom: 'Suisse romand (QWERTZ)',
  nomCourt: 'QWERTZ',
  explication: 'Sur ce clavier, tu tapes des nombres dès la première leçon.',
  rangees: [
    [
      g('Backquote', '§', '°'),
      g('Digit1', '1', '+'),
      g('Digit2', '2', '"'),
      g('Digit3', '3', '*'),
      g('Digit4', '4', 'ç'),
      g('Digit5', '5', '%'),
      d('Digit6', '6', '&'),
      d('Digit7', '7', '/'),
      d('Digit8', '8', '('),
      d('Digit9', '9', ')'),
      d('Digit0', '0', '='),
      d('Minus', "'", '?'),
      d('Equal', '^', '`', { morte: true }),
    ],
    [
      g('KeyQ', 'q'),
      g('KeyW', 'w'),
      g('KeyE', 'e'),
      g('KeyR', 'r'),
      g('KeyT', 't'),
      d('KeyY', 'z'),
      d('KeyU', 'u'),
      d('KeyI', 'i'),
      d('KeyO', 'o'),
      d('KeyP', 'p'),
      d('BracketLeft', 'è', 'ü'),
      d('BracketRight', '¨', '!', { morte: true }),
    ],
    [
      g('KeyA', 'a'),
      g('KeyS', 's'),
      g('KeyD', 'd'),
      g('KeyF', 'f', undefined, { repere: true }),
      g('KeyG', 'g'),
      d('KeyH', 'h'),
      d('KeyJ', 'j', undefined, { repere: true }),
      d('KeyK', 'k'),
      d('KeyL', 'l'),
      d('Semicolon', 'é', 'ö'),
      d('Quote', 'à', 'ä'),
      d('Backslash', '$', '£'),
    ],
    [
      majG(),
      g('IntlBackslash', '<', '>'),
      g('KeyZ', 'y'),
      g('KeyX', 'x'),
      g('KeyC', 'c'),
      g('KeyV', 'v'),
      g('KeyB', 'b'),
      d('KeyN', 'n'),
      d('KeyM', 'm'),
      d('Comma', ',', ';'),
      d('Period', '.', ':'),
      d('Slash', '-', '_'),
      majD(),
    ],
  ],
};

export const DISPOSITIONS: Record<IdDisposition, Disposition> = { 'fr-FR': FR_FR, 'fr-CH': FR_CH };

export const TOUTES_DISPOSITIONS: Disposition[] = [FR_FR, FR_CH];

export function disposition(id: IdDisposition): Disposition {
  return DISPOSITIONS[id];
}

export function touches(id: IdDisposition): Touche[] {
  return DISPOSITIONS[id].rangees.flat();
}

/**
 * DESSINABLE ≠ PROPOSABLE. Toute touche physique est dessinée ; seules celles
 * qui produisent réellement un caractère utilisable peuvent devenir une cible.
 * Sont dessinées mais jamais proposées : les touches mortes (`^`, `¨`), les
 * inertes (`²`) et les modificateurs.
 */
export function estProposable(t: Touche): boolean {
  return !t.morte && !t.inerte && !t.modificateur;
}

/** Trouve la touche qui produit `caractere` SANS modificateur. */
export function toucheDirecte(id: IdDisposition, caractere: string): Touche | undefined {
  return touches(id).find((t) => estProposable(t) && t.base === caractere);
}

/** Trouve la touche qui produit `caractere` AVEC Maj. */
export function toucheMaj(id: IdDisposition, caractere: string): Touche | undefined {
  const declaree = touches(id).find((t) => estProposable(t) && t.maj === caractere);
  if (declaree) return declaree;
  /* Maj + lettre = capitale sur TOUTE disposition : la déclarer 26 fois par
     table serait de la redite. Les accentuées sont exclues par le regex ASCII
     — le cahier interdit `É À È Ç`. */
  return /^[A-Z]$/.test(caractere) ? toucheDirecte(id, caractere.toLowerCase()) : undefined;
}

/**
 * Touche PORTEUSE d'un caractère, qu'il s'écrive directement ou avec Maj.
 * C'est elle qui est visée sur le clavier virtuel : au palier 7, `8` (FR-FR) et
 * `ç` (CH-FR) n'ont pas de touche directe, mais leur touche porteuse existe.
 */
export function toucheDe(id: IdDisposition, caractere: string): Touche | undefined {
  return toucheDirecte(id, caractere) ?? toucheMaj(id, caractere);
}

/** Le caractère exige-t-il de tenir Maj sur cette disposition ? */
export function exigeMaj(id: IdDisposition, caractere: string): boolean {
  return !toucheDirecte(id, caractere) && !!toucheMaj(id, caractere);
}

/** Main à laquelle appartient un caractère, direct ou shifté. */
export function mainDe(id: IdDisposition, caractere: string): Main | undefined {
  if (caractere === ' ') return undefined; // l'espace dépend du contexte (P8)
  return toucheDe(id, caractere)?.main;
}

/**
 * Légendes à imprimer sur la touche.
 * `bas` = légende DOMINANTE = ce que la touche produit sans modificateur.
 * `haut` = légende secondaire = ce qu'elle produit avec Maj, s'il y en a une.
 * Aucune branche conditionnelle sur le type de caractère : la hiérarchie vient
 * de la table (régression CH-FR : la touche du 4 affichait `ç` en dominante).
 */
export function legendes(t: Touche): { haut?: string; bas: string } {
  if (t.nom) return { bas: t.nom };
  const base = t.legendePrincipale ?? t.base ?? '';
  const secondaire = t.legendeSecondaire ?? t.maj;
  // Seules les lettres ASCII passent en capitale : la sérigraphie réelle imprime
  // « é è à ù ç » en minuscule, et le cahier interdit les capitales accentuées.
  const bas = /^[a-z]$/i.test(base) ? base.toUpperCase() : base;
  return secondaire ? { haut: secondaire, bas } : { bas };
}
