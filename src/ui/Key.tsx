import { legendes, type Touche } from '../core/layouts';
import s from './ui.module.css';

export type EtatTouche = 'eteinte' | 'ouverte' | 'cible' | 'fausse' | 'acquise' | 'illuminee';

export function Key({
  touche,
  etat,
  verrouillee,
}: {
  touche: Touche;
  etat: EtatTouche;
  /** cadenas : rangée des chiffres non encore ouverte (jamais un vide gris) */
  verrouillee?: boolean;
}) {
  const { haut, bas } = legendes(touche);
  const classes = [
    s.touche,
    touche.main === 'droite' ? s.droite : '',
    haut ? s.deuxLegendes : '',
    touche.repere ? s.repere : '',
    s[etat] ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} data-code={touche.code} data-etat={etat} aria-hidden="true">
      {verrouillee && <Cadenas />}
      {haut && <span className={s.legendeHaut}>{haut}</span>}
      <span className={s.legendeBas}>{bas}</span>
    </div>
  );
}

/** Petit cadenas dessiné : la touche existe, elle arrive plus tard. */
function Cadenas() {
  return (
    <svg className={s.cadenas} viewBox="0 0 14 16" aria-hidden="true">
      <path
        d="M4 7V4.6a3 3 0 0 1 6 0V7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect x="1.6" y="7" width="10.8" height="8" rx="2" fill="currentColor" />
    </svg>
  );
}
