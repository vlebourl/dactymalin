import { disposition } from '../core/layouts';
import { estJouable } from '../core/listes';
import { ensembleTouches } from '../core/paliers';
import { NOM_PARCOURS } from '../core/parcours';
import { Keyboard } from '../ui/Keyboard';
import { useApp, useEnvoi } from '../state';
import v from './vues.module.css';
import u from '../ui/ui.module.css';

/** Engrenage DESSINÉ : un glyphe système ne rend pas comme une icône. */
function Engrenage() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="3.4" strokeWidth="2" />
      <path
        d="M12 2.6v3M12 18.4v3M2.6 12h3M18.4 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function V1Accueil() {
  const app = useApp();
  const envoi = useEnvoi();
  const d = disposition(app.disposition);
  /* Une carte qui lance un bloc vide n'est pas une carte : la liste vient du
     COMPTE, la disposition vient de CET appareil, et les deux peuvent ne pas
     s'accorder. Mieux vaut pas de carte qu'une carte sans rien à taper. */
  const jouables = app.listes.filter((liste) => estJouable(liste, app.disposition));

  return (
    <div className={v.ecran}>
      <header className={v.entete}>
        <span />
        <span />
        <button
          className={v.engrenage}
          onClick={() => envoi({ type: 'vue', vue: 'V7' })}
          aria-label="Réglages"
        >
          <Engrenage />
        </button>
      </header>

      <div className={v.centre}>
        {/* Le nom est une image : le logo porte une typographie et un jeu de
            couleurs que la police de l'app ne reproduit pas. Il reste dans un
            h1 avec son texte alternatif — la hiérarchie et les lecteurs
            d'écran ne doivent rien perdre au passage. */}
        <h1 className={`${v.titre} ${v.titreLogo}`}>
          <img src="/logo-dactymalin.png" alt="DactyMalin" className={v.logo} />
        </h1>
        <p className={v.sousTitre}>Apprends où poser tes doigts sur ton vrai clavier.</p>

        {/* Illustration à plat, sans mains ni personnage. */}
        <Keyboard
          id={app.disposition}
          ensemble={ensembleTouches(app.disposition, app.palier)}
          taille="clamp(13px, 2.7vw, 38px)"
          espace={{ etat: 'ouvert', pouce: 'gauche' }}
        />

        <button
          className={[u.bouton, u.primaire, u.geant].join(' ')}
          onClick={() => envoi({ type: 'commencer', liste: null })}
        >
          On commence !
        </button>

        {/* #9 — la bibliothèque du foyer, une carte par liste. L'enfant ne
            saisit rien : il reconnaît la carte de sa dictée et appuie. */}
        {jouables.length > 0 && (
          <ul className={v.cartesListes} aria-label="Les listes de la maison">
            {jouables.map((liste) => (
              <li key={liste.id}>
                <button
                  className={v.carteListe}
                  onClick={() => envoi({ type: 'commencer', liste })}
                >
                  <span className={v.carteNom}>{liste.nom}</span>
                  <span className={v.carteMots}>
                    {liste.mots.length} {liste.mots.length > 1 ? 'mots' : 'mot'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Le parcours en cours, DIT : le parent l'a choisi dans les réglages,
            et sans cette ligne rien à l'écran ne permet de savoir lequel des
            deux tourne. Pas de bouton ici — ce choix n'est pas celui de
            l'enfant. */}
        <p className={v.ligneClavier}>
          Ton parcours : <b>{NOM_PARCOURS[app.parcours]}</b>
        </p>

        <p className={v.ligneClavier}>
          Ton clavier : <b>{d.nom}</b>
          <button className={v.petitBouton} onClick={() => envoi({ type: 'vue', vue: 'V2' })}>
            Changer
          </button>
        </p>

        <div className={v.liens}>
          <button className={u.lien} onClick={() => envoi({ type: 'vue', vue: 'V6' })}>
            Ma carte du clavier
          </button>
          <button className={u.lien} onClick={() => envoi({ type: 'vue', vue: 'V3' })}>
            Revoir : où mettre mes doigts
          </button>
        </div>
      </div>
    </div>
  );
}
