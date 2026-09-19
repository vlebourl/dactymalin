import { useEffect, useState } from 'react';
import v from '../views/vues.module.css';

/**
 * Débit de la DICTÉE (#118) : un mot dit pour être écrit, pas pour être
 * compris. À régler À L'OREILLE, sur les appareils de la maison — chaque
 * moteur de synthèse a sa propre idée de « 0.7 ».
 */
export const DEBIT_DICTEE = 0.7;

const voixFrancaise = () =>
  speechSynthesis.getVoices().find((x) => x.lang?.toLowerCase().startsWith('fr'));

/** Lit un texte à voix haute, si une voix française est disponible. */
export function dire(texte: string, debit = 0.9): void {
  if (typeof speechSynthesis === 'undefined') return;
  // La synthèse vocale ne doit jamais pouvoir faire tomber l'écran qui l'appelle.
  try {
    const phrase = new SpeechSynthesisUtterance(texte);
    phrase.lang = 'fr-FR';
    phrase.rate = debit;
    const voix = voixFrancaise();
    if (voix) phrase.voice = voix;
    speechSynthesis.cancel();
    speechSynthesis.speak(phrase);
  } catch {
    /* voix indisponible */
  }
}

/**
 * iPad et Android ne laissent parler une page qu'APRÈS un geste. Le premier
 * mot d'une dictée est dit à l'ouverture de la leçon, donc hors du geste : une
 * phrase vide, dite DANS le clic qui lance la dictée, lève le verrou.
 */
export function amorcerLaVoix(): void {
  dire('');
}

/** Délai laissé aux voix pour se déclarer avant de conclure qu'il n'y en a pas. */
const ATTENTE_VOIX_MS = 1500;

/**
 * Y a-t-il une voix française ? `null` tant qu'on ne sait pas : la liste des
 * voix se charge EN DIFFÉRÉ sur Chrome et Android, et conclure « aucune » à la
 * première image fermerait la dictée à tort.
 */
export function useVoixFrancaise(): boolean | null {
  const [presente, setPresente] = useState<boolean | null>(() =>
    typeof speechSynthesis === 'undefined' ? false : voixFrancaise() ? true : null,
  );
  useEffect(() => {
    if (typeof speechSynthesis === 'undefined') return;
    const relire = () => setPresente((avant) => (voixFrancaise() ? true : avant));
    relire();
    speechSynthesis.addEventListener?.('voiceschanged', relire);
    const echeance = setTimeout(() => setPresente((avant) => avant ?? false), ATTENTE_VOIX_MS);
    return () => {
      speechSynthesis.removeEventListener?.('voiceschanged', relire);
      clearTimeout(echeance);
    };
  }, []);
  return presente;
}

export function SpeakerButton({
  texte,
  libelle = 'Écouter',
  debit,
}: {
  texte: string;
  libelle?: string;
  debit?: number;
}) {
  return (
    <button
      className={v.hautParleur}
      onClick={(ev) => {
        /* Un clic souris ne garde pas le focus : les frappes suivantes
           appartiennent à la leçon, pas au bouton. */
        if (ev.detail > 0) ev.currentTarget.blur();
        dire(texte, debit);
      }}
      aria-label={libelle}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M4 9.5h3.6L12 5.6v12.8L7.6 14.5H4z" fill="currentColor" />
        <path
          d="M15.6 9.2a4 4 0 0 1 0 5.6M18.2 6.6a7.6 7.6 0 0 1 0 10.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
