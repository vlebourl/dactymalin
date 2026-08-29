import { useEffect, useState } from 'react';
import { messageDEchecProfil } from '../core/erreurs-compte';
import {
  chargerIndex,
  prenomValide,
  PRENOM_MAX,
  remplacerIndex,
} from '../core/profils';
import {
  compteCourant,
  creerProfilDistant,
  deconnecter,
  enAttente,
  profilsDistants,
  renommerProfilDistant,
  supprimerProfilDistant,
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
 *
 * C'est ici que le parent GÈRE ses enfants (#18) — ajouter, renommer,
 * supprimer. Les réglages, eux, se contentent de les lister : les boutons qui
 * détruisent une progression ne sont pas à portée d'un enfant de sept ans qui
 * cherchait le bouton des sons.
 */
export function V9Compte() {
  const envoi = useEnvoi();
  const [compte, setCompte] = useState<Compte | null>(null);
  const [profils, setProfils] = useState<ProfilDistant[]>([]);
  const [file, setFile] = useState(0);
  /** Brouillons de prénom, par profil : seulement ceux que le parent a tapés. */
  const [saisie, setSaisie] = useState<Record<string, string>>({});
  /** Enfant dont la suppression attend un « oui » explicite. */
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  const [nouveau, setNouveau] = useState('');
  const [echec, setEchec] = useState<string | null>(null);

  const adopterListe = (liste: ProfilDistant[]) => {
    setProfils(liste);
    /* Le cache local suit le compte : un prénom corrigé ici doit s'afficher
       tout de suite sur l'écran « Qui joue ? » et dans la leçon, et un enfant
       supprimé doit emporter sa progression en cache. */
    remplacerIndex(liste.map((p) => ({ id: p.id, nom: p.prenom })));
    /* On ne touche PAS aux champs : la liste arrive du réseau, donc à un
       moment qu'on ne choisit pas, et elle effaçait le prénom que le parent
       était en train de taper. Un champ sans brouillon affiche déjà celui du
       serveur. */
  };

  const rafraichir = async () => {
    const c = await compteCourant();
    setCompte(c);
    setFile(enAttente());
    if (!c) return setProfils([]);
    try {
      adopterListe(await profilsDistants());
    } catch {
      setProfils([]);
    }
  };

  useEffect(() => {
    void rafraichir();
  }, []);

  /** Le motif d'un refus de prénom, dit avant même d'appeler le serveur. */
  const refusLocal = (prenom: string): string | null =>
    prenomValide(prenom)
      ? null
      : prenom.trim().length === 0
        ? 'Écrivez le prénom de l’enfant : un profil ne peut pas être sans nom.'
        : `Ce prénom est trop long : ${PRENOM_MAX} lettres au maximum.`;

  const ajouter = async () => {
    const refus = refusLocal(nouveau);
    if (refus) return setEchec(refus);
    setEchec(null);
    try {
      await creerProfilDistant(nouveau.trim());
      setNouveau('');
      adopterListe(await profilsDistants());
    } catch (erreur) {
      /* Prénom déjà pris, plafond atteint, session expirée : le serveur dit
         laquelle, et le parent la lit. Un bouton qui ne fait rien sans un mot
         est un bouton cassé. */
      setEchec(messageDEchecProfil(erreur));
    }
  };

  /**
   * Renommer. L'identité d'un enfant est son identifiant serveur : corriger
   * « Timo » en « Timothée » ne touche PAS à sa progression.
   */
  const renommer = async (id: string) => {
    const prenom = (saisie[id] ?? '').trim();
    const refus = refusLocal(prenom);
    if (refus) return setEchec(refus);
    setEchec(null);
    try {
      await renommerProfilDistant(id, prenom);
      /* Le brouillon a servi : le champ repart du prénom que le SERVEUR
         confirme, pas de ce qu'on croyait avoir envoyé. */
      setSaisie(({ [id]: _, ...reste }) => reste);
      adopterListe(await profilsDistants());
    } catch (erreur) {
      setSaisie(({ [id]: _, ...reste }) => reste);
      setEchec(messageDEchecProfil(erreur));
    }
  };

  /**
   * Supprimer, après un « oui » explicite : c'est le seul geste de l'app qui
   * détruit une progression, et il est irréversible. La confirmation nomme
   * l'enfant — « êtes-vous sûr ? » ne dit pas de QUI on parle.
   */
  const supprimer = async (id: string) => {
    setEchec(null);
    const actif = chargerIndex().actif;
    try {
      await supprimerProfilDistant(id);
      setASupprimer(null);
      adopterListe(await profilsDistants());
      /* L'enfant supprimé était celui en train de jouer : son état est chargé
         dans l'application entière, et le laisser tourner ferait écrire une
         progression à un profil qui n'existe plus. */
      if (id === actif) location.reload();
    } catch (erreur) {
      setEchec(messageDEchecProfil(erreur));
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

      <div className={`${v.centre} ${v.centreDefilant}`}>
        <p className={v.sousTitre}>
          Ce compte garde la progression de chaque enfant et la retrouve d'un ordinateur à
          l'autre.
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

            {echec && (
              <p className={v.erreurCompte} role="alert">
                {echec}
              </p>
            )}

            <h2 className={v.titrePetit}>Nos enfants</h2>
            <ul className={v.listeProfils}>
              {profils.map((p) => (
                <li key={p.id}>
                  <input
                    className={v.champNom}
                    value={saisie[p.id] ?? p.prenom}
                    aria-label={`Prénom de ${p.prenom}`}
                    onChange={(e) => {
                      setSaisie({ ...saisie, [p.id]: e.target.value });
                      setEchec(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && void renommer(p.id)}
                  />
                  <button
                    className={v.petitBouton}
                    disabled={(saisie[p.id] ?? p.prenom).trim() === p.prenom}
                    onClick={() => void renommer(p.id)}
                  >
                    Renommer
                  </button>{' '}
                  <span className={v.promessePalier}>
                    {p.etat ? `palier ${p.etat.palier}` : 'aucune progression enregistrée'}
                  </span>{' '}
                  {aSupprimer === p.id ? (
                    <span className={v.confirmation}>
                      Supprimer {p.prenom} et toute sa progression ? C'est définitif.{' '}
                      <button
                        className={v.petitBouton}
                        onClick={() => void supprimer(p.id)}
                      >{`Oui, supprimer ${p.prenom}`}</button>{' '}
                      <button className={u.lien} onClick={() => setASupprimer(null)}>
                        Annuler
                      </button>
                    </span>
                  ) : (
                    <button
                      className={u.lien}
                      aria-label={`Supprimer ${p.prenom}`}
                      onClick={() => {
                        setEchec(null);
                        setASupprimer(p.id);
                      }}
                    >
                      Supprimer
                    </button>
                  )}
                </li>
              ))}
              {profils.length === 0 && (
                <li className={v.promessePalier}>Aucun profil sur le compte pour l'instant.</li>
              )}
            </ul>

            {/* Ajouter un enfant est un geste de PARENT : il se fait ici, pas
                sur l'écran où l'enfant vient choisir son prénom pour jouer. */}
            <p className={v.ligneClavier}>
              <input
                className={v.champNom}
                value={nouveau}
                placeholder="Prénom du nouvel enfant"
                aria-label="Prénom du nouvel enfant"
                onChange={(e) => {
                  setNouveau(e.target.value);
                  setEchec(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && void ajouter()}
              />
              <button className={v.petitBouton} onClick={() => void ajouter()}>
                Ajouter un enfant
              </button>
            </p>

            <button
              className={u.bouton}
              onClick={async () => {
                await deconnecter();
                /* Le portail vit AU-DESSUS de cet arbre : seul un rechargement
                   le lui rend la main. */
                location.reload();
              }}
            >
              Se déconnecter
            </button>
          </div>
        ) : (
          /* La session a expiré pendant qu'on était ici : le portail reprend
             la main au rechargement. Il n'y a plus de formulaire de connexion
             dans l'application — un seul chemin d'authentification, le portail. */
          <p className={v.panneauListe}>
            La session a expiré.{' '}
            <button className={u.lien} type="button" onClick={() => location.reload()}>
              Se reconnecter
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
