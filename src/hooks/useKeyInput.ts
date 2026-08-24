import { useEffect, useRef } from 'react';
import { verrMajActif } from '../core/detect';

export type Frappe = {
  code: string;
  key: string;
  repeat: boolean;
  /** touches modificatrices maintenues — en mode débutant, aucune n'est acceptée (P2) */
  avecMaj: boolean;
  avecAutreModificateur: boolean;
};

const MODIFICATEURS = new Set([
  'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'AltGraph', 'Dead',
]);

const CONTROLES = new Set(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']);

function surUnControle(): boolean {
  const cible = document.activeElement as HTMLElement | null;
  if (!cible) return false;
  return CONTROLES.has(cible.tagName) || cible.tabIndex >= 0;
}

/**
 * Écoute globale du clavier physique.
 * Rend le couple (code, key) brut : c'est lui, et lui seul, qui porte
 * l'information de disposition.
 */
export function useKeyInput(
  actif: boolean,
  surFrappe: (f: Frappe) => void,
  surVerrMaj?: (actif: boolean) => void,
): void {
  const refFrappe = useRef(surFrappe);
  const refVerrMaj = useRef(surVerrMaj);
  refFrappe.current = surFrappe;
  refVerrMaj.current = surVerrMaj;

  useEffect(() => {
    if (!actif) return;

    const signalerVerrMaj = (e: KeyboardEvent) => {
      let etat: boolean | null = null;
      try {
        etat = e.getModifierState('CapsLock');
      } catch {
        /* getModifierState absent : on s'en remet au repli observable */
      }
      refVerrMaj.current?.(verrMajActif(e.key, e.shiftKey, etat));
    };

    const surTouche = (e: KeyboardEvent) => {
      signalerVerrMaj(e);
      // Tab n'est JAMAIS intercepté : la navigation clavier doit rester entière.
      // Space n'est neutralisé (défilement / activation de bouton) que si le
      // focus n'est pas sur un contrôle focalisable.
      if (e.code === 'Space' && !surUnControle()) e.preventDefault();
      if (MODIFICATEURS.has(e.key)) return;
      refFrappe.current({
        code: e.code,
        key: e.key,
        repeat: e.repeat,
        avecMaj: e.shiftKey,
        avecAutreModificateur: e.ctrlKey || e.altKey || e.metaKey,
      });
    };

    window.addEventListener('keydown', surTouche);
    window.addEventListener('keyup', signalerVerrMaj);
    return () => {
      window.removeEventListener('keydown', surTouche);
      window.removeEventListener('keyup', signalerVerrMaj);
    };
  }, [actif]);
}
