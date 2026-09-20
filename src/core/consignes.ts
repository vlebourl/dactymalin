import type { IdParcours } from './parcours';

/**
 * Les consignes que l'app LIT À VOIX HAUTE (#126). Elles vivent dans le noyau
 * et non dans leurs vues pour une raison : le serveur ne synthétise que les
 * phrases de cette liste. Une consigne écrite ailleurs resterait lisible, mais
 * serait dite par la voix du navigateur — `estUneConsigne` est la frontière
 * entre « la voix de l'app » et « un service vocal pour n'importe quel texte ».
 */

/** V2 — le choix du clavier. */
export const CONSIGNE_CLAVIER = {
  defaut: 'Appuie sur la touche A',
  reconnu: 'Je crois avoir reconnu ton clavier. Appuie sur la touche A pour vérifier.',
  incoherence: 'Tes touches ne sont pas là où je croyais. Appuie sur la touche A.',
} as const;

/**
 * V3 — le guide des doigts. Une version par parcours (cahier l. 996). La
 * frontière gauche/droite et les pouces valent partout ; ce qui change, c'est
 * le DOIGT que le parcours promet. En Dactylo l'index n'est pas l'outil — les
 * dix doigts le sont — et le dire quand même apprenait à l'enfant un geste que
 * sa leçon dément.
 */
export const CONSIGNE_GUIDE: Record<IdParcours, string> = {
  decouverte: "Chaque main garde son côté. L'index est ton outil. Les pouces font l'espace.",
  dactylo:
    "Chaque main garde son côté. Chaque doigt a sa colonne de touches. Les pouces font l'espace.",
};

const DITES = new Set<string>([...Object.values(CONSIGNE_CLAVIER), ...Object.values(CONSIGNE_GUIDE)]);

export const estUneConsigne = (texte: string): boolean => DITES.has(texte);
