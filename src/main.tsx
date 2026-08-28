import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { profilInitial } from './core/profils';
import { FournisseurApp } from './state';
import { Garde } from './ui/Garde';
import { V0Profils } from './views/V0Profils';
import './styles/tokens.css';

/* Le choix du joueur précède tout : l'état de l'app se charge depuis la clé
   du profil choisi. `key` remonte l'arbre entier au changement de joueur. */
function Racine() {
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

createRoot(document.getElementById('racine')!).render(
  <StrictMode>
    <Racine />
  </StrictMode>,
);
