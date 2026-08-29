import { useEffect, useState } from 'react';
import {
  compteCourant,
  deconnecter,
  enAttente,
  profilsDistants,
  renommerProfilDistant,
  type Compte,
  type ProfilDistant,
} from '../core/sync';
import { prenomValide, PRENOM_MAX, remplacerIndex } from '../core/profils';
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
  const [file, setFile] = useState(0);
  /** Brouillons de prénom, par profil : seulement ceux que le parent a tapés. */
  const [saisie, setSaisie] = useState<Record<string, string>>({});
  const [echec, setEchec] = useState<string | null>(null);

  const adopterListe = (liste: ProfilDistant[]) => {
    setProfils(liste);
    /* Le cache local suit le compte : un prénom corrigé ici doit s'afficher
       tout de suite sur l'écran « Qui joue ? » et dans la leçon. */
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

  /**
   * Renommer. L'identité d'un enfant est son identifiant serveur : corriger
   * « Timo » en « Timothée » ne touche PAS à sa progression.
   */
  const renommer = async (id: string) => {
    const prenom = (saisie[id] ?? '').trim();
    /* Le même jugement que l'écran de création, et la même borne : un champ
       vidé ne partait EN SILENCE nulle part, et `maxLength` coupait à la
       vingtième lettre un prénom que le serveur acceptait jusqu'à trente. */
    if (!prenomValide(prenom)) {
      setEchec(
        prenom.length === 0
          ? 'Écrivez le prénom de l’enfant : un profil ne peut pas être sans nom.'
          : `Ce prénom est trop long : ${PRENOM_MAX} lettres au maximum.`,
      );
      return;
    }
    setEchec(null);
    try {
      await renommerProfilDistant(id, prenom);
      /* Le brouillon a servi : le champ repart du prénom que le SERVEUR
         confirme, pas de ce qu'on croyait avoir envoyé. */
      setSaisie(({ [id]: _, ...reste }) => reste);
      adopterListe(await profilsDistants());
    } catch {
      /* On remet ce que le serveur sait, et on DIT pourquoi : un champ qui
         revient tout seul à l'ancien prénom, sans un mot, laisse le parent
         croire qu'il a mal tapé. */
      setSaisie(({ [id]: _, ...reste }) => reste);
      setEchec("Le renommage n'a pas pu être enregistré : vérifiez la connexion.");
    }
  };

  useEffect(() => {
    void rafraichir();
  }, []);

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
