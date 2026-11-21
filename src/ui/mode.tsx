import { createContext } from 'react';

/* `changerDeMode` est nul tant que la grammaire n'est pas disponible : l'accueil
   n'affiche alors aucun bouton de plus. `rafraichirGrammaire` relit l'état
   après que l'espace parent a posé ou retiré la clé — sans rechargement. */
export const ContexteMode = createContext<{
  changerDeMode: (() => void) | null;
  rafraichirGrammaire: () => Promise<void>;
}>({
  changerDeMode: null,
  rafraichirGrammaire: async () => {},
});
