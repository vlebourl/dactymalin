import { disposition } from '../core/layouts';
import { ensembleTouches } from '../core/paliers';
import { Keyboard } from '../ui/Keyboard';
import { useApp, useEnvoi } from '../state';
import v from './vues.module.css';
import u from '../ui/ui.module.css';

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
          ⚙
        </button>
      </header>

      <div className={v.centre}>
        <h1 className={v.titre}>Tape avec moi</h1>
        <p className={v.sousTitre}>Apprends où poser tes doigts sur ton vrai clavier.</p>

        {/* Illustration à plat, sans mains ni personnage. */}
        <Keyboard
          id={app.disposition}
          ensemble={ensembleTouches(app.disposition, app.palier)}
          taille={38}
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
