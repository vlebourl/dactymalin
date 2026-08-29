import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { profilInitial } from './core/profils';
import { associerEtFusionner, compteCourant, type Compte } from './core/sync';
import { FournisseurApp } from './state';
import { Garde } from './ui/Garde';
import { Connexion } from './views/Connexion';
import { V0Profils } from './views/V0Profils';
import './styles/tokens.css';

/* Le choix du joueur précède tout : l'état de l'app se charge depuis la clé
   du profil choisi. `key` remonte l'arbre entier au changement de joueur. */
function Joueur() {
  const [idProfil, setIdProfil] = useState<string | null>(() => profilInitial());
  if (!idProfil) return <V0Profils onChoix={setIdProfil} />;
  return (
    <FournisseurApp idProfil={idProfil} key={idProfil}>
      <Garde>
        <App />
      </Garde>
    </FournisseurApp>
  );
}

/* La connexion précède le joueur. `undefined` = on interroge encore la
   session ; afficher le portail avant la réponse le ferait clignoter chez un
   parent déjà connecté. */
function Racine() {
  const [compte, setCompte] = useState<Compte | null | undefined>(undefined);

  useEffect(() => {
    void (async () => {
      const c = await compteCourant();
      /* L'appariement au compte se faisait à la connexion, dans l'écran
         parent. Le portail l'a remplacée : il se fait donc ici, une fois la
         session connue et AVANT que le joueur ne monte — sinon la leçon lirait
         un stockage qu'on est en train de réécrire. Un échec (hors ligne) ne
         doit jamais empêcher de jouer. */
      if (c) await associerEtFusionner().catch(() => {});
      setCompte(c);
    })();
  }, []);

  if (compte === undefined) return <Attente />;
  if (!compte) return <Connexion onConnecte={setCompte} />;
  return <Joueur />;
}

function Attente() {
  useEffect(() => {
    document.body.dataset.vue = 'chargement';
  }, []);
  return <div aria-busy="true" />;
}

createRoot(document.getElementById('racine')!).render(
  <StrictMode>
    <Racine />
  </StrictMode>,
);
