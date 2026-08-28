import { useEffect, useState, type FormEvent } from 'react';
import {
  associerEtFusionner,
  compteCourant,
  connecter,
  creerCompte,
  deconnecter,
  enAttente,
  profilsDistants,
  type Compte,
  type ProfilDistant,
} from '../core/sync';
import { useEnvoi } from '../state';
import v from './vues.module.css';
import u from '../ui/ui.module.css';

/**
 * Écran PARENT. Il est le seul de l'app à parler comme à un adulte : mot de
 * passe, synchronisation, suppression. Un enfant n'a rien à faire ici, et on
 * n'y arrive que par les réglages.
 */
export function V9Compte() {
  const envoi = useEnvoi();
  const [compte, setCompte] = useState<Compte | null>(null);
  const [profils, setProfils] = useState<ProfilDistant[]>([]);
  const [mode, setMode] = useState<'connexion' | 'creation'>('connexion');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [file, setFile] = useState(0);

  const rafraichir = async () => {
    const c = await compteCourant();
    setCompte(c);
    setFile(enAttente());
    if (!c) return setProfils([]);
    try {
      setProfils(await profilsDistants());
    } catch {
      setProfils([]);
    }
  };

  useEffect(() => {
    void rafraichir();
  }, []);

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setOccupe(true);
    try {
      if (mode === 'creation') await creerCompte(email, motDePasse, email.split('@')[0]);
      else await connecter(email, motDePasse);
      setMotDePasse('');
      /* On apparie et on fusionne AVANT d'afficher : le parent doit voir tout
         de suite ce que le compte contient réellement. */
      await associerEtFusionner();
      await rafraichir();
    } catch {
      setErreur(
        mode === 'creation'
          ? "Impossible de créer le compte. L'adresse est peut-être déjà prise, ou le mot de passe trop court (10 caractères au moins)."
          : 'Adresse ou mot de passe incorrect.',
      );
    } finally {
      setOccupe(false);
    }
  };

  return (
    <div className={v.ecran}>
      <header className={v.entete}>
        <button
          className={v.retour}
          onClick={() => envoi({ type: 'vue', vue: 'V7' })}
          aria-label="Revenir"
        >
          ←
        </button>
        <h1 className={v.titrePetit}>Notre compte</h1>
        <span />
      </header>

      <div className={v.centre}>
        <p className={v.sousTitre}>
          Un compte sert à retrouver la progression des enfants depuis un autre ordinateur.
          <br />
          L'app fonctionne très bien sans : tout reste alors sur cet appareil.
        </p>

        {compte ? (
          <div className={v.panneauListe}>
            <p>
              Connecté en tant que <b>{compte.email}</b>.
            </p>
            <p className={v.promessePalier}>
              {file === 0
                ? 'Toutes les progressions sont synchronisées.'
                : `${file} progression(s) en attente d'envoi.`}
            </p>
            <ul className={v.listeProfils}>
              {profils.map((p) => (
                <li key={p.id}>
                  <b>{p.prenom}</b>{' '}
                  <span className={v.promessePalier}>
                    {p.etat ? `palier ${p.etat.palier}` : 'aucune progression enregistrée'}
                  </span>
                </li>
              ))}
              {profils.length === 0 && (
                <li className={v.promessePalier}>Aucun profil sur le compte pour l'instant.</li>
              )}
            </ul>
            <button
              className={u.bouton}
              onClick={async () => {
                await deconnecter();
                /* On revient au formulaire de CONNEXION : après une
                   déconnexion, on se reconnecte, on ne recrée pas un compte. */
                setMode('connexion');
                await rafraichir();
              }}
            >
              Se déconnecter
            </button>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
