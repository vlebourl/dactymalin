import { useEffect, useState } from 'react';
import {
  activerProfil,
  ajouterProfil,
  chargerIndex,
  effacerDemandeDeChoix,
  type IndexProfils,
} from '../core/profils';
import { creerProfilDistant } from '../core/sync';
import v from './vues.module.css';
import u from '../ui/ui.module.css';

/**
 * « Qui joue ? » — montré avant tout quand plusieurs joueurs existent, quand le
 * compte n'en a encore aucun, ou quand les réglages ont demandé un changement.
 *
 * Les joueurs sont ceux DU COMPTE : la liste vient du serveur (le cache local
 * l'a reçue au démarrage), et un nouveau joueur y est créé avant d'exister
 * ici. C'est ce qui le fait apparaître sur la tablette comme sur l'ordinateur.
 */
export function V0Profils({ onChoix }: { onChoix: (id: string) => void }) {
  const [ix, setIx] = useState<IndexProfils>(() => chargerIndex());
  const [nom, setNom] = useState('');
  const [creation, setCreation] = useState(ix.liste.length === 0);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    document.body.dataset.vue = 'V0';
    effacerDemandeDeChoix();
  }, []);

  const choisir = (id: string) => {
    activerProfil(id);
    onChoix(id);
  };

  const creer = async () => {
    if (occupe) return;
    setOccupe(true);
    setErreur(null);
    try {
      const cree = await creerProfilDistant(nom.trim() || `Joueur ${ix.liste.length + 1}`);
      setIx(ajouterProfil({ id: cree.id, nom: cree.prenom }));
      onChoix(cree.id);
    } catch {
      /* Créer un joueur DEMANDE le réseau : c'est le serveur qui lui donne son
         identifiant. Le dire plutôt que fabriquer un profil local qui n'aurait
         d'existence sur aucun autre appareil. */
      setErreur("Il faut être connecté à internet pour ajouter un joueur.");
      setOccupe(false);
    }
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

        {erreur && (
          <p className={v.erreurCompte} role="alert">
            {erreur}
          </p>
        )}

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
              onKeyDown={(e) => e.key === 'Enter' && void creer()}
            />
            <button className={v.petitBouton} disabled={occupe} onClick={() => void creer()}>
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
