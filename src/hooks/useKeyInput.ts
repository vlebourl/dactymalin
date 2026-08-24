import { useEffect, useRef } from 'react';
import { verrMajActif } from '../core/detect';
import { MAJ_DROITE, MAJ_GAUCHE } from '../core/layouts';

export type Frappe = {
  code: string;
  key: string;
  repeat: boolean;
  /** touches modificatrices maintenues — en mode débutant, aucune n'est acceptée (P2) */
  avecMaj: boolean;
  /** Maj GAUCHE réellement maintenue (règle contralatérale P8) */
  majGauche: boolean;
  /** Maj DROITE réellement maintenue */
  majDroite: boolean;
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
 * l'information de disposition. Le CÔTÉ de la touche Maj est suivi
 * explicitement : `shiftKey` ne dit pas laquelle des deux est tenue, et la
 * règle contralatérale n'était donc jamais vérifiée.
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

    /** Codes des Maj physiquement enfoncées à cet instant. */
    const majTenues = new Set<string>();

    const suivreMaj = (e: KeyboardEvent, enfoncee: boolean) => {
      if (e.code === MAJ_GAUCHE || e.code === MAJ_DROITE) {
        if (enfoncee) majTenues.add(e.code);
        else majTenues.delete(e.code);
      }
      // Resynchronisation : un keyup de Maj perdu (changement d'onglet) ne doit
      // pas laisser une Maj fantôme enfoncée pour le reste de la leçon.
      if (!e.shiftKey) majTenues.clear();
    };
    const oublierMaj = () => majTenues.clear();

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
      suivreMaj(e, true);
      // Tab n'est JAMAIS intercepté : la navigation clavier doit rester entière.
      // Space n'est neutralisé (défilement / activation de bouton) que si le
      // focus n'est pas sur un contrôle focalisable.
      if (e.code === 'Space' && !surUnControle()) e.preventDefault();
      if (MODIFICATEURS.has(e.key)) return;
      /* Le focus est sur un bouton : la frappe lui appartient (Espace =
         activation). Elle ne doit pas ÉGALEMENT compter comme frappe
         pédagogique — sans quoi un même Espace validait la lettre et le bouton. */
      if (surUnControle()) return;
      /* Maj tenue mais aucun code observé (fenêtre focalisée Maj déjà enfoncée) :
         on ignore le côté plutôt que de refuser une frappe juste. */
      const cotesInconnus = e.shiftKey && majTenues.size === 0;
      refFrappe.current({
        code: e.code,
        key: e.key,
        repeat: e.repeat,
        avecMaj: e.shiftKey,
        majGauche: cotesInconnus || majTenues.has(MAJ_GAUCHE),
        majDroite: cotesInconnus || majTenues.has(MAJ_DROITE),
        avecAutreModificateur: e.ctrlKey || e.altKey || e.metaKey,
      });
    };

    const surRelache = (e: KeyboardEvent) => {
      signalerVerrMaj(e);
      suivreMaj(e, false);
    };

    window.addEventListener('keydown', surTouche);
    window.addEventListener('keyup', surRelache);
    window.addEventListener('blur', oublierMaj);
    return () => {
      window.removeEventListener('keydown', surTouche);
      window.removeEventListener('keyup', surRelache);
      window.removeEventListener('blur', oublierMaj);
    };
  }, [actif]);
}
