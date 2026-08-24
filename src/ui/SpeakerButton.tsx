import v from '../views/vues.module.css';

/** Lit une consigne à voix haute, si une voix française est disponible. */
export function dire(texte: string): void {
  if (typeof speechSynthesis === 'undefined') return;
  const phrase = new SpeechSynthesisUtterance(texte);
  phrase.lang = 'fr-FR';
  phrase.rate = 0.9;
  const voix = speechSynthesis.getVoices().find((x) => x.lang.toLowerCase().startsWith('fr'));
  if (voix) phrase.voice = voix;
  speechSynthesis.cancel();
  speechSynthesis.speak(phrase);
}

export function SpeakerButton({ texte, libelle = 'Écouter' }: { texte: string; libelle?: string }) {
  return (
    <button className={v.hautParleur} onClick={() => dire(texte)} aria-label={libelle}>
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
