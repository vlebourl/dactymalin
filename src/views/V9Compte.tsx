import { useEffect, useRef, useState } from 'react';
import { messageDEchecProfil } from '../core/erreurs-compte';
import { chargerIndex, prenomValide, PRENOM_MAX, remplacerIndex } from '../core/profils';
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
/**
 * Le motif d'un refus de prénom, dit sans attendre le serveur. C'est
 * `prenomValide` qui juge — ici on ne fait que traduire son verdict.
 */
const refusDePrenom = (prenom: string): string | null =>
  prenomValide(prenom)
    ? null
    : prenom.trim().length === 0
      ? 'Écrivez le prénom de l’enfant : un profil ne peut pas être sans nom.'
      : `Ce prénom est trop long : ${PRENOM_MAX} lettres au maximum.`;

/**
 * Une ligne « enfant » : son prénom modifiable, où il en est, et sa
 * suppression. Chaque ligne porte SON brouillon et SON message — un refus de
 * renommage affiché en haut du panneau, loin du champ fautif, n'apprend à
 * personne quel enfant il concerne.
 */
function LigneEnfant({
  profil,
  estActif,
  surChangement,
}: {
  profil: ProfilDistant;
  /** Le joueur en cours sur cet appareil : le supprimer ferme sa session. */
  estActif: boolean;
  /** Relire la liste du compte après un changement accepté par le serveur. */
  surChangement: () => Promise<void>;
}) {
  const [brouillon, setBrouillon] = useState<string | null>(null);
  const [confirme, setConfirme] = useState(false);
  const [echec, setEchec] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const boutonSupprimer = useRef<HTMLButtonElement>(null);
  const rendreLeFocus = useRef(false);

  /* « Annuler » démonte le bouton qui avait le focus : sans ça, il retombe sur
     le corps du document et qui navigue au clavier se retrouve nulle part. */
  useEffect(() => {
    if (!confirme && rendreLeFocus.current) {
      boutonSupprimer.current?.focus();
      rendreLeFocus.current = false;
    }
  }, [confirme]);

  const nom = brouillon ?? profil.prenom;

  const renommer = async () => {
    const refus = refusDePrenom(nom);
    if (refus) return setEchec(refus);
    if (occupe) return;
    setOccupe(true);
    setEchec(null);
    try {
      await renommerProfilDistant(profil.id, nom.trim());
      /* Le brouillon a servi : le champ repart du prénom que le SERVEUR
         confirme, pas de ce qu'on croyait avoir envoyé. */
      setBrouillon(null);
      await surChangement();
    } catch (erreur) {
      setBrouillon(null);
      setEchec(messageDEchecProfil(erreur));
    } finally {
      setOccupe(false);
    }
  };

  /**
   * Supprimer, après un « oui » explicite : c'est le seul geste de l'app qui
   * détruit une progression, et il est irréversible. La confirmation NOMME
   * l'enfant — « êtes-vous sûr ? » ne dit pas de qui on parle.
   */
  const supprimer = async () => {
    if (occupe) return;
    setOccupe(true);
    setEchec(null);
    try {
      await supprimerProfilDistant(profil.id);
      setConfirme(false);
      await surChangement();
      /* L'enfant supprimé était celui en train de jouer : son état est chargé
         dans l'application entière, et la laisser tourner lui ferait écrire la
         progression d'un profil qui n'existe plus. */
      if (estActif) location.reload();
    } catch (erreur) {
      setEchec(messageDEchecProfil(erreur));
    } finally {
      setOccupe(false);
    }
  };

  return (
    <li>
      <input
        className={v.champNom}
        value={nom}
        aria-label={`Prénom de ${profil.prenom}`}
        onChange={(e) => {
          setBrouillon(e.target.value);
          setEchec(null);
        }}
        onKeyDown={(e) => e.key === 'Enter' && void renommer()}
      />
      <button
        className={v.petitBouton}
        disabled={nom.trim() === profil.prenom}
        onClick={() => void renommer()}
      >
        Renommer
      </button>{' '}
      <span className={v.promessePalier}>
        {profil.etat ? `palier ${profil.etat.palier}` : 'aucune progression enregistrée'}
      </span>{' '}
      {confirme ? (
        <span className={v.confirmation} role="alert">
          Supprimer {profil.prenom} et toute sa progression ? C'est définitif.{' '}
          <button className={v.petitBouton} autoFocus onClick={() => void supprimer()}>
            {`Oui, supprimer ${profil.prenom}`}
          </button>{' '}
          <button
            className={u.lien}
            onClick={() => {
              rendreLeFocus.current = true;
              setConfirme(false);
            }}
          >
            Annuler
          </button>
        </span>
      ) : (
        <button
          ref={boutonSupprimer}
          className={u.lien}
          aria-label={`Supprimer ${profil.prenom}`}
          onClick={() => {
            setEchec(null);
            setConfirme(true);
          }}
        >
          Supprimer
        </button>
      )}
      {echec && (
        <span className={v.erreurCompte} role="alert">
          {' '}
          {echec}
        </span>
      )}
    </li>
  );
}

export function V9Compte() {
  const envoi = useEnvoi();
  const [compte, setCompte] = useState<Compte | null>(null);
  const [profils, setProfils] = useState<ProfilDistant[]>([]);
  const [file, setFile] = useState(0);
  const [nouveau, setNouveau] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [echec, setEchec] = useState<string | null>(null);

  const adopterListe = (liste: ProfilDistant[]) => {
    setProfils(liste);
    /* Le cache local suit le compte : un prénom corrigé ici doit s'afficher
       tout de suite sur l'écran « Qui joue ? » et dans la leçon, et un enfant
       supprimé doit emporter sa progression en cache. */
    remplacerIndex(liste.map((p) => ({ id: p.id, nom: p.prenom })));
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

  const relire = async () => adopterListe(await profilsDistants());

  /* Ajouter un enfant est un geste de PARENT : il se fait ici, pas sur l'écran
     où l'enfant vient choisir son prénom pour jouer. */
  const ajouter = async () => {
    const refus = refusDePrenom(nouveau);
    if (refus) return setEchec(refus);
    if (occupe) return;
    setOccupe(true);
    setEchec(null);
    try {
      await creerProfilDistant(nouveau.trim());
      setNouveau('');
      await relire();
    } catch (erreur) {
      /* Prénom déjà pris, plafond atteint, session expirée : le serveur dit
         laquelle, et le parent la lit. Un bouton qui ne fait rien sans un mot
         est un bouton cassé. */
      setEchec(messageDEchecProfil(erreur));
    } finally {
      setOccupe(false);
    }
  };

  const actif = chargerIndex().actif;

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

            <h2 className={v.titrePetit}>Nos enfants</h2>
            <ul className={v.listeProfils}>
              {profils.map((p) => (
                <LigneEnfant
                  key={p.id}
                  profil={p}
                  estActif={p.id === actif}
                  surChangement={relire}
                />
              ))}
              {profils.length === 0 && (
                <li className={v.promessePalier}>Aucun profil sur le compte pour l'instant.</li>
              )}
            </ul>

            {echec && (
              <p className={v.erreurCompte} role="alert">
                {echec}
              </p>
            )}

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
              <button className={v.petitBouton} disabled={occupe} onClick={() => void ajouter()}>
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
