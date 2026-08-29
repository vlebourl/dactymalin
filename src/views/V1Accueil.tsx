import { useState } from 'react';
import { disposition } from '../core/layouts';
import { composerBlocPerso } from '../core/generator';
import { motsPersoValides } from '../core/storage';
import { ensembleTouches } from '../core/paliers';
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
  /* Le choix est posé DÈS L'ACCUEIL : le parcours, ou notre liste à nous.
     La liste s'écrit ici même — elle était enfouie dans les réglages. */
  const [listeOuverte, setListeOuverte] = useState(false);
  const [mots, setMots] = useState(app.motsPerso.join('\n'));
  const motsPrets = motsPersoValides(mots.split(/[\n,;]+/));
  const listeJouable = composerBlocPerso(motsPrets, app.disposition).length > 0;

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
        <h1 className={v.titre}>DactyMalin</h1>
        <p className={v.sousTitre}>Apprends où poser tes doigts sur ton vrai clavier.</p>

        {/* Illustration à plat, sans mains ni personnage. */}
        <Keyboard
          id={app.disposition}
          ensemble={ensembleTouches(app.disposition, app.palier)}
          taille="clamp(13px, 2.7vw, 38px)"
          espace={{ etat: 'ouvert', pouce: 'gauche' }}
        />

        <div className={v.choixDepart}>
          <button
            className={[u.bouton, u.primaire, u.geant].join(' ')}
            onClick={() => envoi({ type: 'commencer', perso: false })}
          >
            On commence !
          </button>
          <button
            className={[u.bouton, u.geant].join(' ')}
            aria-expanded={listeOuverte}
            onClick={() => setListeOuverte((x) => !x)}
          >
            Notre liste à nous
          </button>
        </div>

        {listeOuverte && (
          <div className={v.panneauListe}>
            <label className={v.promessePalier} htmlFor="mots-perso">
              Un mot par ligne (les prénoms de la famille, les mots de l'école…).
            </label>
            <textarea
              id="mots-perso"
              className={v.champMots}
              aria-label="Notre liste à nous"
              rows={5}
              value={mots}
              onChange={(ev) => setMots(ev.target.value)}
            />
            <button
              className={[u.bouton, u.primaire].join(' ')}
              disabled={!listeJouable}
              onClick={() => {
                envoi({ type: 'motsPerso', mots: motsPrets });
                envoi({ type: 'commencer', perso: true });
              }}
            >
              On tape notre liste !
            </button>
          </div>
        )}

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
