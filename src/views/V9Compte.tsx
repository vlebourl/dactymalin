import { useEffect, useRef, useState } from 'react';
import { messageDEchecListe, messageDEchecProfil } from '../core/erreurs-compte';
import { motsDeLaSaisie, NOM_LISTE_MAX, type Liste } from '../core/listes';
import {
  chargerIndex,
  prenomValide,
  PRENOM_MAX,
  profilsEnCache,
  remplacerIndex,
} from '../core/profils';
import {
  compteCourant,
  creerListeDistante,
  creerProfilDistant,
  listesDistantes,
  modifierListeDistante,
  supprimerListeDistante,
  deconnecter,
  enAttente,
  profilsDistants,
  renommerProfilDistant,
  supprimerProfilDistant,
  type Compte,
  type ProfilDistant,
} from '../core/sync';
import { useApp, useEnvoi } from '../state';
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
 * « Supprimer », puis un « oui » explicite. La confirmation NOMME ce qu'elle
 * détruit — « êtes-vous sûr ? » ne dit pas de quoi on parle, et c'est le seul
 * geste irréversible de l'application.
 *
 * « Annuler » démonte le bouton qui avait le focus : sans le lui rendre, il
 * retombe sur le corps du document et qui navigue au clavier se retrouve nulle
 * part. Ce défaut a déjà été corrigé une fois ici ; il n'existe qu'en un seul
 * endroit pour ne pas avoir à l'être deux.
 */
function ConfirmationSuppression({
  quoi,
  question,
  surOui,
}: {
  /** Ce qu'on supprime, nommé : il apparaît sur les deux boutons. */
  quoi: string;
  /** La phrase qui dit ce que ça coûte. */
  question: string;
  surOui: () => void;
}) {
  const [confirme, setConfirme] = useState(false);
  const bouton = useRef<HTMLButtonElement>(null);
  const rendreLeFocus = useRef(false);

  useEffect(() => {
    if (!confirme && rendreLeFocus.current) {
      bouton.current?.focus();
      rendreLeFocus.current = false;
    }
  }, [confirme]);

  if (!confirme) {
    return (
      <button
        ref={bouton}
        className={u.lien}
        aria-label={`Supprimer ${quoi}`}
        onClick={() => setConfirme(true)}
      >
        Supprimer
      </button>
    );
  }

  return (
    <span className={v.confirmation} role="alert">
      {question}{' '}
      <button
        className={v.petitBouton}
        autoFocus
        onClick={() => {
          setConfirme(false);
          surOui();
        }}
      >
        {`Oui, supprimer ${quoi}`}
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
  );
}

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
  const [echec, setEchec] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

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

  const supprimer = async () => {
    if (occupe) return;
    setOccupe(true);
    setEchec(null);
    try {
      await supprimerProfilDistant(profil.id);
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
      <ConfirmationSuppression
        quoi={profil.prenom}
        question={`Supprimer ${profil.prenom} et toute sa progression ? C'est définitif.`}
        surOui={() => void supprimer()}
      />
      {echec && (
        <span className={v.erreurCompte} role="alert">
          {' '}
          {echec}
        </span>
      )}
    </li>
  );
}

/**
 * Une ligne « liste » : son nom, ses mots, et sa suppression. Elle est repliée
 * par défaut — trente listes dépliées feraient un mur d'où le parent ne
 * retrouverait plus la sienne.
 *
 * Comme pour les enfants, chaque ligne porte SON brouillon et SON message : un
 * refus affiché en haut du panneau, loin du champ fautif, n'apprend à personne
 * quelle liste il concerne.
 */
function LigneListe({ liste, surChangement }: { liste: Liste; surChangement: () => Promise<void> }) {
  const app = useApp();
  const [ouverte, setOuverte] = useState(false);
  const [nom, setNom] = useState(liste.nom);
  const [motsSaisis, setMotsSaisis] = useState(liste.mots.join('\n'));
  const [occupe, setOccupe] = useState(false);
  const [echec, setEchec] = useState<string | null>(null);

  const { mots: aEnregistrer, refuses } = motsDeLaSaisie(motsSaisis, app.disposition);
  const inchangee =
    nom.trim() === liste.nom && aEnregistrer.join('\n') === liste.mots.join('\n');

  const enregistrer = async () => {
    if (occupe) return;
    setOccupe(true);
    setEchec(null);
    try {
      await modifierListeDistante(liste.id, nom.trim(), aEnregistrer);
      setOuverte(false);
      await surChangement();
    } catch (erreur) {
      setEchec(messageDEchecListe(erreur));
    } finally {
      setOccupe(false);
    }
  };

  const supprimer = async () => {
    if (occupe) return;
    setOccupe(true);
    setEchec(null);
    try {
      await supprimerListeDistante(liste.id);
      await surChangement();
    } catch (erreur) {
      setEchec(messageDEchecListe(erreur));
      /* La liste a disparu ailleurs — l'autre appareil du foyer l'a supprimée.
         La relecture retire la ligne morte tout de suite, plutôt que de laisser
         le parent devant un message qui lui demande de recharger. */
      if ((erreur as { code?: string })?.code === 'LISTE_INTROUVABLE') await surChangement();
    } finally {
      setOccupe(false);
    }
  };

  return (
    <li>
      <b>{liste.nom}</b>{' '}
      <span className={v.promessePalier}>
        — {liste.mots.length} {liste.mots.length > 1 ? 'mots' : 'mot'}
      </span>{' '}
      <button
        className={v.petitBouton}
        aria-expanded={ouverte}
        onClick={() => {
          /* Rouvrir repart de ce que le SERVEUR dit, pas d'un brouillon
             abandonné il y a trois clics. */
          setNom(liste.nom);
          setMotsSaisis(liste.mots.join('\n'));
          setEchec(null);
          setOuverte((x) => !x);
        }}
      >
        {ouverte ? 'Fermer' : `Modifier ${liste.nom}`}
      </button>{' '}
      <ConfirmationSuppression
        quoi={liste.nom}
        question={`Supprimer « ${liste.nom} » ? Elle disparaîtra de l'accueil des enfants.`}
        surOui={() => void supprimer()}
      />

      {ouverte && (
        <div className={v.panneauListe}>
          <input
            className={v.champNom}
            value={nom}
            maxLength={NOM_LISTE_MAX}
            aria-label={`Nom de ${liste.nom}`}
            onChange={(e) => {
              setNom(e.target.value);
              setEchec(null);
            }}
          />
          <textarea
            className={v.champMots}
            aria-label={`Les mots de ${liste.nom}`}
            rows={5}
            value={motsSaisis}
            onChange={(e) => {
              setMotsSaisis(e.target.value);
              setEchec(null);
            }}
          />
          {refuses.length > 0 && <MotsEcartes mots={refuses} />}
          <button
            className={[u.bouton, u.primaire].join(' ')}
            disabled={occupe || inchangee || nom.trim().length === 0 || aEnregistrer.length === 0}
            onClick={() => void enregistrer()}
          >
            Enregistrer
          </button>
        </div>
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

/**
 * Le mot que CETTE disposition ne sait pas écrire d'une seule frappe. Il reste
 * dans la liste — elle appartient au compte, et un autre appareil l'écrira
 * peut-être très bien. Il est seulement écarté de la leçon ici, et le parent
 * l'apprend maintenant plutôt qu'en cherchant pourquoi il n'arrive jamais.
 */
function MotsEcartes({ mots }: { mots: string[] }) {
  return (
    <p className={v.erreurCompte} role="status">
      Ce clavier ne sait pas écrire {mots.map((m) => `« ${m} »`).join(', ')} d'une seule frappe :{' '}
      {mots.length > 1 ? 'ces mots ne seront pas proposés' : 'ce mot ne sera pas proposé'} dans la
      leçon sur cet appareil.
    </p>
  );
}

/**
 * La bibliothèque du foyer (#9). Le parent SEUL écrit ici : un enfant qui
 * apprend à taper ne saisit pas vingt mots, et l'accueil est l'écran qui dit
 * « appuie ici pour jouer », pas un formulaire.
 *
 * Les listes appartiennent au compte, donc les deux enfants voient les mêmes.
 */
function Bibliotheque() {
  const app = useApp();
  const envoi = useEnvoi();
  const [nom, setNom] = useState('');
  const [mots, setMots] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [echec, setEchec] = useState<string | null>(null);

  /* Averti À LA SAISIE, pas au moment de jouer : « la fête » demande une
     touche morte, deux frappes pour un caractère attendu. Le bloc l'écarterait
     en silence et le parent chercherait longtemps pourquoi. */
  const { mots: aEnregistrer, refuses } = motsDeLaSaisie(mots, app.disposition);

  /* Relire la bibliothèque après un changement accepté par le serveur : les
     cartes de l'accueil viennent du même état, donc elles suivent. */
  const relire = async () => envoi({ type: 'listes', listes: await listesDistantes() });

  const creer = async () => {
    if (occupe) return;
    setOccupe(true);
    setEchec(null);
    try {
      await creerListeDistante(nom.trim(), aEnregistrer);
      setNom('');
      setMots('');
      await relire();
    } catch (erreur) {
      setEchec(messageDEchecListe(erreur));
    } finally {
      setOccupe(false);
    }
  };

  return (
    <>
      <h2 className={v.titrePetit}>Nos listes</h2>
      <p className={v.promessePalier}>
        Une liste apparaît sur l'accueil de chaque enfant. La jouer rapporte des étoiles, mais ne
        fait pas avancer la leçon : elle peut contenir des lettres pas encore apprises.
      </p>

      <ul className={v.listeProfils}>
        {app.listes.map((liste: Liste) => (
          <LigneListe key={liste.id} liste={liste} surChangement={relire} />
        ))}
        {app.listes.length === 0 && (
          <li className={v.promessePalier}>Aucune liste pour l'instant.</li>
        )}
      </ul>

      <input
        className={v.champNom}
        value={nom}
        maxLength={NOM_LISTE_MAX}
        placeholder="Nom de la liste"
        aria-label="Nom de la liste"
        onChange={(e) => {
          setNom(e.target.value);
          setEchec(null);
        }}
      />
      <textarea
        className={v.champMots}
        aria-label="Les mots de la liste"
        rows={5}
        value={mots}
        placeholder="Un mot par ligne"
        onChange={(e) => {
          setMots(e.target.value);
          setEchec(null);
        }}
      />

      {refuses.length > 0 && <MotsEcartes mots={refuses} />}

      {echec && (
        <p className={v.erreurCompte} role="alert">
          {echec}
        </p>
      )}

      <button
        className={[u.bouton, u.primaire].join(' ')}
        disabled={occupe || nom.trim().length === 0 || aEnregistrer.length === 0}
        onClick={() => void creer()}
      >
        Créer la liste
      </button>
    </>
  );
}

export function V9Compte() {
  const envoi = useEnvoi();
  /* « Hors ligne » n'est pas déduit de `navigator.onLine` : ce drapeau ment
     dans les deux sens — il annonce « en ligne » sur un Wi-Fi de train qui ne
     mène nulle part, et il revient à `true` sur une page rouverte depuis le
     cache alors que rien ne passe. Ce qui fait foi, c'est la requête qui vient
     d'échouer. */
  const [horsLigne, setHorsLigne] = useState(false);
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
      setHorsLigne(false);
    } catch {
      setHorsLigne(true);
      /* Hors ligne, on montre ce que l'appareil CONNAÎT du foyer plutôt qu'une
         liste vide : « aucun profil sur le compte » serait un mensonge, et le
         parent croirait avoir perdu ses enfants (#3). On ne réécrit pas le
         cache — il n'y a rien de neuf à en dire. */
      setProfils(profilsEnCache().map((p) => ({ ...p, majLe: null })));
    }
    /* La bibliothèque est relue À CHAQUE ouverture de l'espace parent : c'est
       ici que le parent l'édite, donc ici qu'elle doit être à jour. */
    try {
      envoi({ type: 'listes', listes: await listesDistantes() });
    } catch {
      /* Silencieux : les listes déjà connues restent affichées. */
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
              {horsLigne
                ? /* Ce n'est pas une panne : l'application marche, et le travail
                     de l'enfant est gardé ici en attendant le réseau. */
                  /* Ce que la phrase ne promet PAS : que les listes soient
                     lisibles ici. Elles viennent du réseau et ne sont pas
                     encore gardées sur l'appareil — c'est #11. Dire « elles ne
                     se modifient qu'en ligne » laisserait croire qu'on peut au
                     moins les voir. */
                  `Hors ligne. ${
                    file === 0
                      ? 'Rien n’attend d’être envoyé.'
                      : `${file} progression(s) partiront au retour du réseau.`
                  } Les enfants et la bibliothèque reviendront avec le réseau.`
                : file === 0
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

            <Bibliotheque />

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
