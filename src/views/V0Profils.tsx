import { useEffect, useState } from 'react';
import {
  activerProfil,
  ajouterProfil,
  chargerIndex,
  effacerDemandeDeChoix,
  prenomValide,
  PRENOM_MAX,
  type IndexProfils,
} from '../core/profils';
import { adopterProgressionHistorique, creerProfilDistant } from '../core/sync';
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
  /** Ce que le RÉSEAU a refusé : n'existe qu'après un essai. */
  const [echecReseau, setEchecReseau] = useState<string | null>(null);

  useEffect(() => {
    document.body.dataset.vue = 'V0';
    effacerDemandeDeChoix();
  }, []);

  const choisir = (id: string) => {
    activerProfil(id);
    onChoix(id);
  };

  /* Le motif du refus, ou `null` si le prénom passe. C'est `prenomValide` qui
     juge — la vue ne fait que traduire son verdict — sinon l'écran finirait
     par dire « c'est bon » là où le serveur répond « non ». */
  const refus = prenomValide(nom)
    ? null
    : nom.trim().length === 0
      ? 'Écris ton prénom pour commencer.'
      : `Ce prénom est trop long : ${PRENOM_MAX} lettres au maximum.`;

  /* Le motif se montre dès la saisie — l'enfant le voit disparaître quand il
     corrige, sans avoir à réessayer pour savoir si c'est bon ; l'échec réseau,
     lui, n'existe qu'après un essai. */
  const message = echecReseau ?? (nom.length > 0 ? refus : null);

  const creer = async () => {
    if (occupe) return;
    /* Un prénom vide donnait « Joueur 2 », sans un mot : un nom que personne
       ne garde et que personne ne pense à changer. On le REFUSE, en disant
       pourquoi — y compris sur un champ jamais touché, où rien ne s'affiche
       encore. */
    if (refus) {
      setEchecReseau(refus);
      return;
    }
    setOccupe(true);
    setEchecReseau(null);
    try {
      const premier = ix.liste.length === 0;
      const cree = await creerProfilDistant(nom.trim());
      setIx(ajouterProfil({ id: cree.id, nom: cree.prenom }));
      /* Premier enfant du compte sur cet appareil : s'il y a une progression
         d'avant les identifiants serveur, elle est à lui. */
      if (premier) await adopterProgressionHistorique(cree.id);
      onChoix(cree.id);
    } catch {
      /* Créer un joueur DEMANDE le réseau : c'est le serveur qui lui donne son
         identifiant. Le dire plutôt que fabriquer un profil local qui n'aurait
         d'existence sur aucun autre appareil. */
      setEchecReseau("Il faut être connecté à internet pour ajouter un joueur.");
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

        {/* `status` et non `alert` : le message change à chaque frappe, et une
            région assertive le rejetterait à la figure de qui écoute l'écran,
            lettre après lettre. */}
        {message && (
          <p className={v.erreurCompte} role="status">
            {message}
          </p>
        )}

        {creation ? (
          <p className={v.ligneClavier}>
            <input
              className={v.champNom}
              value={nom}
              /* Pas de `maxLength` : couper à la trentième lettre sans un mot
                 laisse l'enfant devant un prénom qui n'est pas le sien. On
                 laisse écrire, et on DIT que c'est trop long. */
              placeholder="Ton prénom"
              aria-label="Ton prénom"
              autoFocus
              onChange={(e) => {
                setNom(e.target.value);
                setEchecReseau(null);
              }}
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
