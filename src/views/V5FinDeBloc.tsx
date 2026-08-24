import { motsNouveaux } from '../core/corpus';
import { toucheDirecte, toucheMaj } from '../core/layouts';
import { ensembleTouches, nouvellesTouches } from '../core/paliers';
import { PROPOSITION_PAUSE } from '../core/encouragements';
import { Keyboard } from '../ui/Keyboard';
import { Stars } from '../ui/Stars';
import { useApp, useEnvoi } from '../state';
import v from './vues.module.css';
import u from '../ui/ui.module.css';

export function V5FinDeBloc() {
  const app = useApp();
  const envoi = useEnvoi();
  const id = app.disposition;

  // Palier montré : celui qui vient de s'ouvrir, sinon celui qu'on travaille.
  const palierMontre = app.palierOuvert ?? app.palier;
  const gains = motsNouveaux(id, palierMontre).filter((m) => !m.includes(' ')).slice(0, 3);
  const illuminees = new Set(
    nouvellesTouches(id, palierMontre)
      .map((c) => (toucheDirecte(id, c) ?? toucheMaj(id, c))?.code)
      .filter((c): c is string => !!c),
  );
  const proposePause = app.blocsConsecutifs >= 4;

  return (
    <div className={v.ecran}>
      <div className={v.centre}>
        <h1 className={v.titre}>{app.titreEncouragement}</h1>

        <Stars nombre={app.etoilesDuBloc} />

        {gains.length > 0 && (
          <p className={v.gainLexical}>
            Tu écris maintenant : <b>{gains.join(', ')}</b>
          </p>
        )}

        <Keyboard
          id={id}
          ensemble={ensembleTouches(id, app.palier)}
          illuminees={illuminees}
          taille={30}
        />

        {proposePause && <p className={v.pause}>{PROPOSITION_PAUSE}</p>}

        <div className={v.deuxBoutons}>
          <button
            className={[u.bouton, proposePause ? '' : u.primaire].join(' ')}
            onClick={() => envoi({ type: 'commencer' })}
          >
            Encore
          </button>
          <button
            className={[u.bouton, proposePause ? u.primaire : ''].join(' ')}
            onClick={() => envoi({ type: 'vue', vue: 'V1' })}
          >
            Retour
          </button>
        </div>

        <button className={u.lien} onClick={() => envoi({ type: 'vue', vue: 'V6' })}>
          Ma carte du clavier
        </button>
      </div>
    </div>
  );
}
