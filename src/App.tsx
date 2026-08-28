import { useApp } from './state';
import { V1Accueil } from './views/V1Accueil';
import { V2Clavier } from './views/V2Clavier';
import { V3GuideDoigt } from './views/V3GuideDoigt';
import { V4Lecon } from './views/V4Lecon';
import { V5FinDeBloc } from './views/V5FinDeBloc';
import { V6Carte } from './views/V6Carte';
import { V7Reglages } from './views/V7Reglages';
import { V9Compte } from './views/V9Compte';

export function App() {
  const app = useApp();
  switch (app.vue) {
    case 'V1':
      return <V1Accueil />;
    case 'V2':
      return <V2Clavier raison={app.raisonVue} />;
    case 'V3':
      return <V3GuideDoigt />;
    case 'V4':
      // clé sur le n° de bloc : chaque bloc repart d'un état de leçon neuf
      return <V4Lecon key={app.bloc} />;
    case 'V5':
      return <V5FinDeBloc />;
    case 'V6':
      return <V6Carte />;
    case 'V7':
      return <V7Reglages />;
    case 'V9':
      return <V9Compte />;
  }
}
