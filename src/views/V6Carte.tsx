import { toucheDirecte, toucheMaj } from '../core/layouts';
import { Cadenas } from '../ui/Key';
import { ensembleTouches, etapes, nouvellesTouches } from '../core/parcours';
import { useApp, useEnvoi } from '../state';
import { Keyboard } from '../ui/Keyboard';
import v from './vues.module.css';
import u from '../ui/ui.module.css';

export function V6Carte() {
  const app = useApp();
  const envoi = useEnvoi();
  const id = app.disposition;

  const acquises = new Set<string>();
  for (let p = 1; p < app.palier; p++) {
    for (const c of nouvellesTouches(app.parcours, id, p)) {
      const code = (toucheDirecte(id, c) ?? toucheMaj(id, c))?.code;
      if (code) acquises.add(code);
    }
  }
  const enCours = new Set<string>(
    nouvellesTouches(app.parcours, id, app.palier)
      .map((c) => (toucheDirecte(id, c) ?? toucheMaj(id, c))?.code)
      .filter((c): c is string => !!c),
  );

  return (
    <div className={v.ecran}>
      <header className={v.entete}>
        <button className={v.retour} onClick={() => envoi({ type: 'vue', vue: 'V1' })} aria-label="Revenir">
          ←
        </button>
        <span />
        <span />
      </header>

      <div className={v.centre}>
        <h1 className={v.titre} style={{ fontSize: 'clamp(28px, 3.4vw, 42px)' }}>
          Ma carte du clavier
        </h1>

        <Keyboard
          id={id}
          ensemble={ensembleTouches(app.parcours, id, app.palier)}
          acquises={acquises}
          illuminees={enCours}
          taille="clamp(13px, 2.7vw, 38px)"
          espace={{ etat: 'ouvert', pouce: 'gauche' }}
        />

        <div className={v.listePaliers}>
          {etapes(app.parcours, id).map((p) => {
            const passe = p.n < app.palier;
            const courant = p.n === app.palier;
            /* Plus aucune étape n'est verrouillée « pour toujours » : les dix
               sont réelles et atteignables. Ce qui reste devant est simplement
               à venir. */
            const aVenir = p.n > app.palier;
            return (
              <div
                key={p.n}
                className={[
                  v.lignePalier,
                  courant ? v.lignePalierCourant : '',
                  aVenir ? v.lignePalierVerrouille : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center' }}>
                  {passe ? <Etoile /> : courant ? <Fleche /> : aVenir ? <Cadenas taille={15} classe="" /> : <Point />}
                </span>
                <span>
                  <span className={v.nomPalier}>
                    Étape {p.n} — {p.titre ?? p.nouvelles.join(' ')}
                  </span>
                  <br />
                  <span className={v.promessePalier}>
                    {p.exemples.length > 0 ? p.exemples.join(', ') : (p.promesse ?? '')}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        <button
          className={[u.bouton, u.primaire].join(' ')}
          onClick={() => envoi({ type: 'commencer', liste: null })}
        >
          Continuer la leçon
        </button>

      </div>
    </div>
  );
}

/* Repères de la liste des paliers : dessinés, jamais des emoji système. */
const Etoile = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M10 1.5 12.5 7l6 .6-4.5 4 1.4 5.9L10 14.4 4.6 17.5 6 11.6 1.5 7.6l6-.6z" fill="var(--teal-vif)" />
  </svg>
);

const Fleche = () => (
  <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M2 1 L10 6 L2 11 z" fill="var(--teal-vif)" />
  </svg>
);

const Point = () => (
  <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
    <circle cx="4" cy="4" r="3" fill="var(--liseré-fort)" />
  </svg>
);
