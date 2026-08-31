import { ensembleTouches, type IdParcours } from '../core/parcours';
import { Keyboard } from '../ui/Keyboard';
import { MainSchematique } from '../ui/MainSchematique';
import { useApp, useEnvoi } from '../state';
import { dire } from '../ui/SpeakerButton';
import v from './vues.module.css';
import u from '../ui/ui.module.css';

/**
 * Une version par parcours (cahier l. 996). La frontière gauche/droite et les
 * pouces valent partout ; ce qui change, c'est le DOIGT que le parcours promet.
 * En Dactylo l'index n'est pas l'outil — les dix doigts le sont — et le dire
 * quand même apprenait à l'enfant un geste que sa leçon dément.
 */
const CONSIGNE: Record<IdParcours, string> = {
  decouverte:
    'Chaque main garde son côté. L\'index est ton outil. Les pouces font l\'espace.',
  dactylo:
    'Chaque main garde son côté. Chaque doigt a sa colonne de touches. Les pouces font l\'espace.',
};

export function V3GuideDoigt() {
  const app = useApp();
  const envoi = useEnvoi();
  const consigne = CONSIGNE[app.parcours];
  /* Index surligné en Découverte, main au repos en Dactylo (cahier l. 1005). */
  const indexTendu = app.parcours === 'decouverte';

  return (
    <div className={v.ecran}>
      <div className={v.centre}>
        <h1 className={v.titre}>Chaque main garde son côté</h1>
        <p className={v.sousTitre} data-consigne-guide>
          {consigne}
        </p>

        <div className={v.deuxCotes}>
          <div className={v.coteMain}>
            <MainSchematique cote="gauche" largeur={150} tendu={indexTendu} />
            <p className={v.etiquetteCote}>main gauche</p>
          </div>
          <Keyboard
            id={app.disposition}
            ensemble={ensembleTouches(app.parcours, app.disposition, app.etape)}
            taille="clamp(16px, 4.4vw, 54px)"
            espace={{ etat: 'ouvert', pouce: 'gauche' }}
          />
          <div className={v.coteMain}>
            <MainSchematique cote="droite" largeur={150} tendu={indexTendu} />
            <p className={v.etiquetteCote}>main droite</p>
          </div>
        </div>
        <p className={v.etiquetteCote}>la barre d'espace : tes deux pouces</p>

        <div className={v.deuxBoutons}>
          <button className={u.bouton} onClick={() => dire(consigne)}>
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
