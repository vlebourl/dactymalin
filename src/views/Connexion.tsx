import { useEffect, useState, type FormEvent } from 'react';
import { messageDEchec } from '../core/erreurs-compte';
import { compteCourant, connecter, creerCompte, type Compte } from '../core/sync';
import v from './vues.module.css';
import u from '../ui/ui.module.css';

/**
 * PORTAIL. Premier écran de l'application, franchi une fois par appareil.
 *
 * Il vit AU-DESSUS du fournisseur d'état, comme « Qui joue ? » : la connexion
 * précède le choix d'un profil enfant, donc elle ne peut pas être une valeur
 * de `app.vue`, que seul le reducer d'un profil déjà chargé connaît.
 *
 * C'est un écran de PARENT : il parle d'adresse et de mot de passe. L'enfant ne
 * le voit jamais — le parent le franchit à l'installation, et la session dure
 * soixante jours.
 */
export function Connexion({ onConnecte }: { onConnecte: (c: Compte) => void }) {
  const [mode, setMode] = useState<'connexion' | 'creation'>('connexion');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    document.body.dataset.vue = 'connexion';
  }, []);

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setOccupe(true);
    try {
      if (mode === 'creation') await creerCompte(email, motDePasse, email.split('@')[0]);
      else await connecter(email, motDePasse);
      /* On relit la session plutôt que de croire la réponse : c'est le cookie
         qui fait foi pour tous les appels suivants. */
      const compte = await compteCourant();
      if (!compte) throw new Error('session absente après authentification');
      onConnecte(compte);
    } catch (echec) {
      /* On dit ce que le SERVEUR a répondu. L'ancien message inventait deux
         causes possibles et se trompait sur les deux : une inscription refusée
         pour tout autre motif — trop de tentatives, panne, réseau — accusait le
         mot de passe de l'utilisateur. */
      setErreur(messageDEchec(echec, mode));
      setOccupe(false);
    }
  };

  return (
    <div className={v.ecran}>
      <div className={v.centre}>
        {/* Même logo que l'accueil : le portail est désormais le PREMIER écran
            de l'application, c'est lui qui la nomme. Le nom est une image (cf.
            V1Accueil), donc il porte son texte alternatif. */}
        <h1 className={`${v.titre} ${v.titreLogo}`}>
          <img src="/logo-dactymalin.png" alt="DactyMalin" className={v.logo} />
        </h1>
        <p className={v.sousTitre}>
          Un compte de parent, une fois, sur cet appareil.
          <br />
          Il garde la progression de chaque enfant et la retrouve d'un ordinateur à l'autre.
        </p>

        <form className={v.panneauListe} onSubmit={soumettre}>
          <label className={v.promessePalier} htmlFor="courriel">
            Adresse électronique
          </label>
          <input
            id="courriel"
            className={v.champMots}
            type="email"
            autoComplete="username"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className={v.promessePalier} htmlFor="mdp">
            Mot de passe {mode === 'creation' && '(10 caractères au moins)'}
          </label>
          <input
            id="mdp"
            className={v.champMots}
            type="password"
            autoComplete={mode === 'creation' ? 'new-password' : 'current-password'}
            required
            minLength={mode === 'creation' ? 10 : 1}
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
          {erreur && (
            <p className={v.erreurCompte} role="alert">
              {erreur}
            </p>
          )}
          <button className={[u.bouton, u.primaire].join(' ')} disabled={occupe} type="submit">
            {mode === 'creation' ? 'Créer notre compte' : 'Se connecter'}
          </button>
          <button
            className={u.lien}
            type="button"
            onClick={() => {
              setErreur(null);
              setMode(mode === 'creation' ? 'connexion' : 'creation');
            }}
          >
            {mode === 'creation' ? "J'ai déjà un compte" : 'Créer un compte'}
          </button>
          {/* Sans service d'envoi d'email, aucun lien de réinitialisation ne
              peut partir : mieux vaut le dire que le laisser espérer. */}
          <p className={v.promessePalier}>
            Il n'y a pas de récupération par courriel : notez le mot de passe quelque part.
          </p>
        </form>
      </div>
    </div>
  );
}
