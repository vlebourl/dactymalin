import { createContext } from 'react';

/* `changerDeMode` est nul tant que la grammaire n'est pas disponible : l'accueil
   n'affiche alors aucun bouton de plus. */
export const ContexteMode = createContext<{ changerDeMode: (() => void) | null }>({
  changerDeMode: null,
});
