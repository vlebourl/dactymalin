import type { Main } from '../core/layouts';

/**
 * Silhouette vectorielle NEUTRE, main vue de dessus, index détaché.
 * Les photographies sont réservées aux quatre pastilles (addendum) ;
 * partout ailleurs — V3 et overlay d'aide — le schématique reste la règle.
 *
 * Les quatre doigts sont dessinés SÉPARÉMENT et dépassent franchement de la
 * paume : collés et rentrés, la silhouette se lisait comme une tasse
 * (itération 002, point 15).
 */
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

  /** x, sommet au repos, sommet quand l'index est tendu, largeur du doigt */
  const doigts = [
    { x: 31, repos: 40, tendu: 46, l: 12 }, // auriculaire
    { x: 46, repos: 28, tendu: 36, l: 13 }, // annulaire
    { x: 61, repos: 24, tendu: 32, l: 13.5 }, // majeur
  ];
  const index = { x: 76, repos: 30, tendu: 8, l: 13.5 };

  const doigt = (d: { x: number; l: number }, sommet: number, actif: boolean) => (
    <g key={d.x}>
      <path
        d={`M${d.x} 84 L${d.x} ${sommet}`}
        stroke={teinte}
        strokeWidth={d.l + 4}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M${d.x} 82 L${d.x} ${sommet + 1}`}
        stroke={pale}
        strokeWidth={d.l}
        strokeLinecap="round"
        fill="none"
      />
      {/* ongle : le repère qui dit « c'est un doigt » et donne son sens */}
      <circle cx={d.x} cy={sommet + 6} r={d.l * 0.26} fill={teinte} opacity={actif ? 0.5 : 0.28} />
    </g>
  );

  return (
    <svg
      viewBox="0 0 100 130"
      width={largeur}
      style={{ transform: cote === 'droite' ? 'scaleX(-1)' : undefined }}
      aria-hidden="true"
    >
      {doigts.map((d) => doigt(d, tendu ? d.tendu : d.repos, false))}
      {doigt(index, tendu ? index.tendu : index.repos, true)}

      {/* paume : plus large aux jointures qu'au poignet, coins nettement arrondis */}
      <path
        d="M23 74 Q20 108 32 120 Q50 130 70 122 Q84 114 85 96 L85 72 Q54 64 23 74 Z"
        fill={pale}
        stroke={teinte}
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      {/* Pouce du côté de l'index : main à plat vue de dessus, le pouce d'une
          main gauche pointe vers l'INTÉRIEUR du clavier, pas vers l'extérieur. */}
      <path
        d="M76 84 Q93 88 92 101 Q89 115 71 109"
        fill={pale}
        stroke={teinte}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* jointures : quatre petits creux qui donnent l'échelle de la main */}
      <path
        d="M31 78 v5 M46 76 v5 M61 76 v5 M76 78 v5"
        stroke={teinte}
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}
