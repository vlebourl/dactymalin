import { useEffect } from 'react';
import v from './vues.module.css';
import u from '../ui/ui.module.css';

export function ChoixMode({ onChoix }: { onChoix: (m: 'orthographe' | 'grammaire') => void }) {
  useEffect(() => {
    document.body.dataset.vue = 'MODE';
  }, []);
  return (
    <div className={v.ecran}>
      <div className={v.centre}>
        <h1 className={`${v.titre} ${v.titreLogo}`}>
          <img src="/logo-dactymalin.png" alt="DactyMalin" className={v.logo} />
        </h1>
        <p className={v.sousTitre}>Qu'est-ce qu'on fait aujourd'hui ?</p>
        <button
          className={[u.bouton, u.primaire, u.geant].join(' ')}
          onClick={() => onChoix('orthographe')}
        >
          Orthographe
        </button>
        <button
          className={[u.bouton, u.primaire, u.geant].join(' ')}
          onClick={() => onChoix('grammaire')}
        >
          Grammaire
        </button>
      </div>
    </div>
  );
}
