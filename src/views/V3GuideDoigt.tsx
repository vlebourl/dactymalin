import { ensembleTouches } from '../core/paliers';
import { Keyboard } from '../ui/Keyboard';
import { MainSchematique } from '../ui/MainSchematique';
import { useApp, useEnvoi } from '../state';
import { dire } from '../ui/SpeakerButton';
import v from './vues.module.css';
import u from '../ui/ui.module.css';

const CONSIGNE =
  'Chaque main garde son côté. L\'index est ton outil. Les pouces font l\'espace.';

export function V3GuideDoigt() {
  const app = useApp();
  const envoi = useEnvoi();

  return (
    <div className={v.ecran}>
      <div className={v.centre}>
        <h1 className={v.titre}>Chaque main garde son côté</h1>
        <p className={v.sousTitre}>{CONSIGNE}</p>

        <div className={v.deuxCotes}>
          <div className={v.coteMain}>
            <MainSchematique cote="gauche" largeur={150} tendu={false} />
            <p className={v.etiquetteCote}>main gauche</p>
          </div>
          <Keyboard
            id={app.disposition}
            ensemble={ensembleTouches(app.disposition, app.palier)}
            taille="clamp(16px, 4.4vw, 54px)"
            etiquetteFrontiere="la frontière"
            espace={{ etat: 'ouvert', pouce: 'gauche' }}
          />
          <div className={v.coteMain}>
            <MainSchematique cote="droite" largeur={150} tendu={false} />
            <p className={v.etiquetteCote}>main droite</p>
          </div>
        </div>
        <p className={v.etiquetteCote}>la barre d'espace : tes deux pouces</p>

        <div className={v.deuxBoutons}>
          <button className={u.bouton} onClick={() => dire(CONSIGNE)}>
            Réécouter
          </button>
          <button
            className={[u.bouton, u.primaire].join(' ')}
            onClick={() => {
              // La boucle du cahier est V1 → « On commence ! » → V4 : l'accueil
              // n'est jamais sauté, même à la toute première session.
              envoi({ type: 'guideDoigtVu' });
              envoi({ type: 'vue', vue: 'V1' });
            }}
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
