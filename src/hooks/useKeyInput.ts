import { useEffect, useRef } from 'react';
import { verrMajActif } from '../core/detect';
import { MAJ_DROITE, MAJ_GAUCHE, touches, type IdDisposition } from '../core/layouts';

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

/** Verr.Maj rapporté par le navigateur ; `null` quand il ne le rapporte pas. */
function etatVerrMaj(e: KeyboardEvent): boolean | null {
  try {
    return e.getModifierState('CapsLock');
  } catch {
    /* getModifierState absent : on s'en remet au repli observable */
    return null;
  }
}

/**
 * Certains pilotes synthétiques laissent dans `key` le caractère SANS Maj.
 * On ne corrige donc que si `key` vaut exactement le caractère direct de la
 * disposition configurée : un vrai événement navigateur, déjà modifié, ne
 * correspond pas et ressort brut. Une exception assumée : si le clavier
 * PHYSIQUE n'est pas celui qui est configuré, la valeur produite peut
 * coïncider avec un caractère direct de la table et se voir réinterprétée
 * comme sur la disposition enseignée — c'est précisément l'incohérence que
 * la surveillance F7 finit par détecter.
 */
function appliquerMaj(id: IdDisposition | undefined, e: KeyboardEvent): string {
  if (!id || !e.shiftKey) return e.key;
  const touche = touches(id).find((t) => t.code === e.code);
  if (touche?.base !== e.key) return e.key;
  if (touche.maj) return touche.maj;
  /* Verr.Maj + Maj produit une MINUSCULE : capitaliser ici validait comme
     réussite une frappe dont la sortie physique est bien un `a`. */
  if (etatVerrMaj(e)) return e.key;
  return /^[a-z]$/.test(e.key) ? e.key.toUpperCase() : e.key;
}

/**
 * Écoute globale du clavier physique.
 * Rend le couple (code, key) brut pour la détection de disposition. Quand une
 * disposition connue est fournie, corrige seulement les pilotes qui laissent
 * dans `key` la valeur sans Maj. Le CÔTÉ de la touche Maj est suivi
 * explicitement : `shiftKey` ne dit pas laquelle des deux est tenue.
 */
export function useKeyInput(
  actif: boolean,
  surFrappe: (f: Frappe) => void,
  surVerrMaj?: (actif: boolean) => void,
  idDisposition?: IdDisposition,
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
      refVerrMaj.current?.(verrMajActif(e.key, e.shiftKey, etatVerrMaj(e)));
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
      /* Maj tenue mais aucun code observé (fenêtre reprise Maj déjà enfoncée) :
         côté INCONNU = aucun côté tenu. Déclarer les deux rendait une Maj
         homolatérale indiscernable de la bonne ; le côté inconnu vaut donc
         quasi-réussite (« garde la Maj de ta main X ») jusqu'à ce qu'un vrai
         ShiftLeft/ShiftRight soit observé — jamais une réussite. */
      refFrappe.current({
        code: e.code,
        key: appliquerMaj(idDisposition, e),
        repeat: e.repeat,
        avecMaj: e.shiftKey,
        majGauche: majTenues.has(MAJ_GAUCHE),
        majDroite: majTenues.has(MAJ_DROITE),
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
  }, [actif, idDisposition]);
}
