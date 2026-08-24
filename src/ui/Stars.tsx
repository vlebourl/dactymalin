import s from './ui.module.css';

/** Étoiles figuratives, jamais un chiffre. Une étoile n'est jamais retirée. */
export function Stars({ nombre }: { nombre: number }) {
  return (
    <div className={s.etoiles} role="img" aria-label="Tes étoiles de ce bloc">
      {Array.from({ length: nombre }, (_, i) => (
        <svg
          key={i}
          className={s.etoile}
          viewBox="0 0 24 24"
          style={{ animationDelay: `${i * 70}ms` }}
          aria-hidden="true"
        >
          <path
            d="M12 2.6l2.7 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8 6.3 20.1l1.4-6.4L2.8 9.3l6.5-.7z"
            fill="var(--orange-moyen)"
            stroke="var(--orange-vif)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}
