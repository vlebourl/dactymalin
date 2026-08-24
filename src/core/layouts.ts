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
  /** libellé des touches sans caractère (Maj, Entrée…) */
  nom?: string;
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

/* ------------------------------------------------------------------ FR-FR */
/* Rangée des chiffres : légende haute = chiffre (Maj), légende basse = caractère direct. */
const FR_FR: Disposition = {
  id: 'fr-FR',
  nom: 'Français (AZERTY)',
  nomCourt: 'AZERTY',
  explication: 'Sur ce clavier, les chiffres arrivent au palier de la touche Majuscule.',
  rangees: [
    [
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
      d('Quote', 'ù'),
    ],
    [
      g('KeyZ', 'w'),
      g('KeyX', 'x'),
      g('KeyC', 'c'),
      g('KeyV', 'v'),
      g('KeyB', 'b'),
      d('KeyN', 'n'),
      d('KeyM', ','),
      d('Comma', ';', '.'), // le point exige Maj en FR-FR ⇒ palier 7
      d('Period', ':', '/'),
      d('Slash', '!'),
    ],
  ],
};

/* ------------------------------------------------------------------ FR-CH */
/* Chiffres DIRECTS. ç = Maj+4. ù = touche morte (^) ⇒ hors MVP. Point direct. */
const FR_CH: Disposition = {
  id: 'fr-CH',
  nom: 'Suisse romand (QWERTZ)',
  nomCourt: 'QWERTZ',
  explication: 'Sur ce clavier, tu tapes des nombres dès la première leçon.',
  rangees: [
    [
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
      d('BracketLeft', 'è'),
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
      d('Semicolon', 'é'),
      d('Quote', 'à'),
    ],
    [
      g('KeyZ', 'y'),
      g('KeyX', 'x'),
      g('KeyC', 'c'),
      g('KeyV', 'v'),
      g('KeyB', 'b'),
      d('KeyN', 'n'),
      d('KeyM', 'm'),
      d('Comma', ','),
      d('Period', '.'),
      d('Slash', '-'),
    ],
  ],
};

/* La touche morte `^` de CH-FR est déclarée ici pour être DESSINÉE mais jamais proposée. */
FR_CH.rangees[1].push({ code: 'BracketRight', base: '¨', main: 'droite', morte: true });
FR_FR.rangees[1].push({ code: 'BracketLeft', base: '^', main: 'droite', morte: true });

export const DISPOSITIONS: Record<IdDisposition, Disposition> = { 'fr-FR': FR_FR, 'fr-CH': FR_CH };

export const TOUTES_DISPOSITIONS: Disposition[] = [FR_FR, FR_CH];

export function disposition(id: IdDisposition): Disposition {
  return DISPOSITIONS[id];
}

export function touches(id: IdDisposition): Touche[] {
  return DISPOSITIONS[id].rangees.flat();
}

/** Trouve la touche qui produit `caractere` SANS modificateur. */
export function toucheDirecte(id: IdDisposition, caractere: string): Touche | undefined {
  return touches(id).find((t) => !t.morte && t.base === caractere);
}

/** Trouve la touche qui produit `caractere` AVEC Maj. */
export function toucheMaj(id: IdDisposition, caractere: string): Touche | undefined {
  return touches(id).find((t) => !t.morte && t.maj === caractere);
}

/** Main à laquelle appartient un caractère directement typable. */
export function mainDe(id: IdDisposition, caractere: string): Main | undefined {
  if (caractere === ' ') return undefined; // l'espace dépend du contexte (P8)
  return toucheDirecte(id, caractere)?.main;
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
