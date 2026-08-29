import type { Main } from '../core/layouts';

/**
 * Silhouette vectorielle NEUTRE, main vue de dessus, index détaché.
 * Les photographies sont réservées aux quatre pastilles (addendum) ;
 * partout ailleurs — V3 et overlay d'aide — le schématique reste la règle.
 *
 * Dessinée en DEUX COUCHES de la même forme : la sombre, épaissie par le trait,
 * puis la pâle par-dessus. Les doigts et la paume fusionnent donc en un seul
 * contour continu, et l'écart entre deux doigts devient un simple trait — ce
 * qu'un contour par doigt posé SUR une paume ne savait pas faire (la ligne
 * haute de la paume barrait la main).
 */

/** Épaisseur du contour, en unités du viewBox. */
const TRAIT = 3.6;
/** Ligne où les doigts s'enfoncent dans la paume : jamais visible. */
const RACINE = 96;

export function MainSchematique({
  cote,
  largeur = 120,
  tendu = true,
}: {
  cote: Main;
  largeur?: number;
  tendu?: boolean;
}) {
  const teinte = cote === 'gauche' ? 'var(--teal-vif)' : 'var(--orange-vif)';
  const pale = cote === 'gauche' ? 'var(--teal-pale)' : 'var(--orange-pale)';

  /* x, sommet au repos, sommet quand l'index est tendu, largeur du doigt.
     Les quatre doigts dépassent franchement de la paume : collés et rentrés,
     la silhouette se lisait comme une tasse (itération 002, point 15). */
  const doigts = [
    { x: 21, repos: 48, tendu: 48, l: 12.5 }, // auriculaire
    { x: 35, repos: 32, tendu: 32, l: 13 }, // annulaire
    { x: 49, repos: 26, tendu: 26, l: 13 }, // majeur
    { x: 63, repos: 34, tendu: 12, l: 13 }, // index
  ];

  /* Une couche = toute la main d'une seule couleur. Sombre avec le trait,
     pâle sans : la différence des deux EST le contour. */
  const couche = (couleur: string, trait: number) => (
    <g
      fill={couleur}
      stroke={couleur}
      strokeWidth={trait}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {doigts.map((d) => (
        <line
          key={d.x}
          x1={d.x}
          y1={RACINE}
          x2={d.x}
          y2={tendu ? d.tendu : d.repos}
          strokeWidth={d.l + trait}
        />
      ))}
      {/* Pouce du côté de l'index : main à plat vue de dessus, le pouce d'une
          main gauche pointe vers l'INTÉRIEUR du clavier, pas vers l'extérieur. */}
      <line x1={69} y1={99} x2={87} y2={83} strokeWidth={15 + trait} />
      {/* paume : son flanc part exactement au bord de l'auriculaire — décalé,
          il laissait un décroché au raccord — puis s'évase vers le talon. */}
      <path d="M14.75 72 L13.6 100 Q16 122 42 125 Q70 122 70 96 L70 72 Z" />
    </g>
  );

  return (
    <svg
      viewBox="0 0 100 130"
      width={largeur}
      style={{ transform: cote === 'droite' ? 'scaleX(-1)' : undefined }}
      aria-hidden="true"
    >
      {couche(teinte, TRAIT)}
      {couche(pale, 0)}
      {/* ongle : le repère qui dit « c'est un doigt » et donne son sens.
          Celui de l'index est plus marqué — c'est le doigt que la leçon vise. */}
      {doigts.map((d, i) => (
        <circle
          key={d.x}
          cx={d.x}
          cy={(tendu ? d.tendu : d.repos) + 6}
          r={d.l * 0.2}
          fill={teinte}
          opacity={i === doigts.length - 1 ? 0.5 : 0.28}
        />
      ))}
    </svg>
  );
}
