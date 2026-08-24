import { toucheDirecte, toucheMaj } from '../core/layouts';
import { ensembleTouches, nouvellesTouches, PALIERS } from '../core/paliers';
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
    for (const c of nouvellesTouches(id, p)) {
      const code = (toucheDirecte(id, c) ?? toucheMaj(id, c))?.code;
      if (code) acquises.add(code);
    }
  }
  const enCours = new Set<string>(
    nouvellesTouches(id, app.palier)
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
          ensemble={ensembleTouches(id, app.palier)}
          acquises={acquises}
          illuminees={enCours}
          taille={34}
          espace={{ etat: 'ouvert', pouce: 'gauche' }}
        />

        <div className={v.listePaliers}>
          {PALIERS.map((p) => {
            const passe = p.numero < app.palier;
            const courant = p.numero === app.palier;
            return (
              <div
                key={p.numero}
                className={[
                  v.lignePalier,
                  courant ? v.lignePalierCourant : '',
                  p.verrouille ? v.lignePalierVerrouille : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span aria-hidden="true">{p.verrouille ? '🔒' : passe ? '★' : courant ? '▸' : '·'}</span>
                <span>
                  <span className={v.nomPalier}>{p.titre}</span>
                  <br />
                  <span className={v.promessePalier}>{p.promesse}</span>
                </span>
              </div>
            );
          })}
        </div>

        <button className={[u.bouton, u.primaire].join(' ')} onClick={() => envoi({ type: 'commencer' })}>
          Continuer la leçon
        </button>
      </div>
    </div>
  );
}
