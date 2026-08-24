import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { FournisseurApp } from './state';
import './styles/tokens.css';

createRoot(document.getElementById('racine')!).render(
  <StrictMode>
    <FournisseurApp>
      <App />
    </FournisseurApp>
  </StrictMode>,
);
