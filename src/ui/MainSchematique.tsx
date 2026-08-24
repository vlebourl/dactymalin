import type { Main } from '../core/layouts';

/**
 * Silhouette vectorielle NEUTRE, index tendu, main à plat vue de dessus.
 * Les photographies sont réservées aux quatre pastilles (addendum) ;
 * partout ailleurs — V3 et overlay d'aide — le schématique reste la règle.
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
  return (
    <svg
      viewBox="0 0 100 130"
      width={largeur}
      style={{ transform: cote === 'droite' ? 'scaleX(-1)' : undefined }}
      aria-hidden="true"
    >
      {/* paume */}
      <path
        d="M20 68 Q18 118 46 126 Q78 128 82 96 L82 62 Z"
        fill={pale}
        stroke={teinte}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* pouce */}
      <path
        d="M20 74 Q4 78 6 92 Q9 104 24 100"
        fill={pale}
        stroke={teinte}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* index — tendu vers la touche */}
      <path
        d={tendu ? 'M63 66 L63 10' : 'M63 66 L63 40'}
        stroke={teinte}
        strokeWidth="13"
        strokeLinecap="round"
        fill="none"
      />
      {/* majeur, annulaire, auriculaire, repliés */}
      <path d="M76 66 L76 44" stroke={teinte} strokeWidth="12" strokeLinecap="round" opacity="0.35" />
      <path d="M50 66 L50 46" stroke={teinte} strokeWidth="12" strokeLinecap="round" opacity="0.35" />
      <path d="M37 68 L37 50" stroke={teinte} strokeWidth="11" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}
