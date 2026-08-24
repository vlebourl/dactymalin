import { disposition } from '../core/layouts';
import { ensembleTouches } from '../core/paliers';
import { Keyboard } from '../ui/Keyboard';
import { useApp, useEnvoi } from '../state';
import v from './vues.module.css';
import u from '../ui/ui.module.css';

/** Engrenage DESSINÉ : un glyphe système ne rend pas comme une icône. */
function Engrenage() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="3.4" strokeWidth="2" />
      <path
        d="M12 2.6v3M12 18.4v3M2.6 12h3M18.4 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function V1Accueil() {
  const app = useApp();
  const envoi = useEnvoi();
  const d = disposition(app.disposition);

  return (
    <div className={v.ecran}>
      <header className={v.entete}>
        <span />
        <span />
        <button
          className={v.engrenage}
          onClick={() => envoi({ type: 'vue', vue: 'V7' })}
          aria-label="Réglages"
        >
          <Engrenage />
        </button>
      </header>

      <div className={v.centre}>
        <h1 className={v.titre}>Tape avec moi</h1>
        <p className={v.sousTitre}>Apprends où poser tes doigts sur ton vrai clavier.</p>

        {/* Illustration à plat, sans mains ni personnage. */}
        <Keyboard
          id={app.disposition}
          ensemble={ensembleTouches(app.disposition, app.palier)}
          taille="clamp(13px, 2.7vw, 38px)"
          espace={{ etat: 'ouvert', pouce: 'gauche' }}
        />

        <button className={[u.bouton, u.primaire, u.geant].join(' ')} onClick={() => envoi({ type: 'commencer' })}>
          On commence !
        </button>

        <p className={v.ligneClavier}>
          Ton clavier : <b>{d.nom}</b>
          <button className={v.petitBouton} onClick={() => envoi({ type: 'vue', vue: 'V2' })}>
            Changer
          </button>
        </p>

        <div className={v.liens}>
          <button className={u.lien} onClick={() => envoi({ type: 'vue', vue: 'V6' })}>
            Ma carte du clavier
          </button>
          <button className={u.lien} onClick={() => envoi({ type: 'vue', vue: 'V3' })}>
            Revoir : où mettre mes doigts
          </button>
        </div>
      </div>
    </div>
  );
}
