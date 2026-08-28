import { useEffect, useState } from 'react';
import {
  activerProfil,
  chargerIndex,
  creerProfil,
  effacerDemandeDeChoix,
  type IndexProfils,
} from '../core/profils';
import v from './vues.module.css';
import u from '../ui/ui.module.css';

/**
 * « Qui joue ? » — montré avant tout quand plusieurs joueurs existent, ou
 * quand les réglages ont demandé un changement. Chaque joueur a sa propre
 * progression, sur cet appareil, sans aucun compte en ligne.
 */
export function V0Profils({ onChoix }: { onChoix: (id: string) => void }) {
  const [ix] = useState<IndexProfils>(() => chargerIndex());
  const [nom, setNom] = useState('');
  const [creation, setCreation] = useState(ix.liste.length === 0);

  useEffect(() => {
    document.body.dataset.vue = 'V0';
    effacerDemandeDeChoix();
  }, []);

  const choisir = (id: string) => {
    activerProfil(id);
    onChoix(id);
  };

  const creer = () => {
    const [, id] = creerProfil(chargerIndex(), nom);
    onChoix(id);
  };

  return (
    <div className={v.ecran}>
      <div className={v.centre}>
        <h1 className={v.titre}>Qui joue ?</h1>
        <p className={v.sousTitre}>Chacun garde sa propre progression.</p>

        <div className={v.liens} data-profils={ix.liste.length}>
          {ix.liste.map((p) => (
            <button
              key={p.id}
              className={[u.bouton, u.primaire, u.geant].join(' ')}
              onClick={() => choisir(p.id)}
            >
              {p.nom}
            </button>
          ))}
        </div>

        {creation ? (
          <p className={v.ligneClavier}>
            <input
              className={v.champNom}
              value={nom}
              maxLength={20}
              placeholder="Ton prénom"
              aria-label="Ton prénom"
              autoFocus
              onChange={(e) => setNom(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && creer()}
            />
            <button className={v.petitBouton} onClick={creer}>
              C'est parti !
            </button>
          </p>
        ) : (
          <p className={v.ligneClavier}>
            <button className={v.petitBouton} onClick={() => setCreation(true)}>
              Nouveau joueur
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
