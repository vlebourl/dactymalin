import { disposition, legendes, type IdDisposition } from '../core/layouts';
import v from '../views/vues.module.css';

/**
 * Mini-clavier fidèle, deux rangées : c'est ce que l'enfant compare à la
 * sérigraphie de son vrai clavier. Partagé par V2 et par les radios de V7 —
 * le cahier demande des radios ILLUSTRÉS, pas deux boutons texte.
 */
export function MiniClavier({ id, echelle = 1 }: { id: IdDisposition; echelle?: number }) {
  const d = disposition(id);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 * echelle }}>
      {[1, 2].map((r) => (
        <div key={r} className={v.miniRangee} style={{ gap: 5 * echelle }}>
          {d.rangees[r]
            .filter((t) => !t.morte)
            .slice(0, 10)
            .map((t) => (
              <span
                key={t.code}
                className={[v.miniTouche, t.main === 'droite' ? v.miniDroite : ''].join(' ')}
                style={{ width: 30 * echelle, height: 30 * echelle, fontSize: 14 * echelle }}
              >
                {legendes(t).bas}
              </span>
            ))}
        </div>
      ))}
    </div>
  );
}
