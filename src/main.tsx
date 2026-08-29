import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { profilInitial } from './core/profils';
import { compteCourant, listesDistantes, synchroniserProfils, type Compte } from './core/sync';
import { FournisseurApp } from './state';
import { Garde } from './ui/Garde';
import { Connexion } from './views/Connexion';
import { V0Profils } from './views/V0Profils';
import './styles/tokens.css';

/* Le choix du joueur précède tout : l'état de l'app se charge depuis la clé
   du profil choisi — son identifiant SERVEUR. `key` remonte l'arbre entier au
   changement de joueur. */
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
      /* Les profils sont ceux du COMPTE : on va les chercher ici, une fois la
         session connue et AVANT que le joueur ne monte — sinon la leçon lirait
         un stockage qu'on est en train de réécrire. Un échec (hors ligne) ne
         doit jamais empêcher de jouer : le cache local prend alors le relais. */
      if (c) await synchroniserProfils().catch(() => {});
      setCompte(c);
    })();
  }, []);

  /* On entre par le portail comme on entre au démarrage : les profils du
     compte D'ABORD. Sans cela, le parent qui vient de se connecter tombait sur
     « Qui joue ? » avec un cache vide, alors que son compte a des enfants. */
  const entrer = async (c: Compte) => {
    await synchroniserProfils().catch(() => {});
    /* La bibliothèque est rafraîchie À LA CONNEXION (#11), et pas seulement au
       montage du joueur : un parent qui se connecte puis reste sur « Qui
       joue ? » repartirait sinon avec la bibliothèque de sa session d'avant.
       On ne fait qu'emplir le cache — l'écran la lira au montage. */
    await listesDistantes().catch(() => {});
    setCompte(c);
  };

  if (compte === undefined) return <Attente />;
  if (!compte) return <Connexion onConnecte={(c) => void entrer(c)} />;
  return <Joueur />;
}

function Attente() {
  useEffect(() => {
    document.body.dataset.vue = 'chargement';
  }, []);
  return <div aria-busy="true" />;
}

/* La coquille de l'application est gardée pour le prochain démarrage sans
   réseau (#3). L'enregistrement échoue silencieusement là où les service
   workers n'existent pas (navigation privée sur certains navigateurs) : c'est
   un confort, jamais une condition pour jouer. */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void (async () => {
      try {
        await navigator.serviceWorker.register('/sw.js');
        const pret = await navigator.serviceWorker.ready;
        /* Les requêtes de cette première visite sont parties AVANT que le
           worker ne prenne les commandes : il n'a donc rien vu du document ni
           du script de l'application. On lui dit ce qu'on a chargé, sans quoi
           il faudrait un SECOND passage en ligne avant de pouvoir démarrer
           sans réseau — et le parent qui ouvre l'app une fois puis part en
           voyage n'en ferait pas un. */
        const aGarder = [
          location.href,
          ...performance
            .getEntriesByType('resource')
            .map((r) => r.name)
            .filter((url) => url.startsWith(location.origin) && !url.includes('/api/')),
        ];
        (pret.active ?? navigator.serviceWorker.controller)?.postMessage({
          type: 'garder',
          urls: [...new Set(aGarder)],
        });
      } catch {
        /* Pas de service worker (navigation privée, contexte non sécurisé) :
           c'est un confort de démarrage, jamais une condition pour jouer. */
      }
    })();
  });
}

createRoot(document.getElementById('racine')!).render(
  <StrictMode>
    <Racine />
  </StrictMode>,
);
