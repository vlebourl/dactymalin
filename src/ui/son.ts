/**
 * Son doux et court sur la RÉUSSITE uniquement. Silence total sur l'erreur.
 * Synthétisé par WebAudio : pas de fichier à charger, pas de dépendance.
 */
let contexte: AudioContext | null = null;

function ctx(): AudioContext | null {
  type AvecPrefixe = typeof globalThis & { webkitAudioContext?: typeof AudioContext };
  const C = globalThis.AudioContext ?? (globalThis as AvecPrefixe).webkitAudioContext;
  if (!C) return null;
  contexte ??= new C();
  return contexte;
}

/** `hauteur` monte légèrement au fil du mot : le geste est ponctué, jamais chronométré. */
export function sonLettre(actif: boolean, hauteur = 0): void {
  if (!actif) return;
  const c = ctx();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25 * Math.pow(2, hauteur / 12), t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.09, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.13);
}

/** Célébration d'item : deux notes, 0,5 à 1 s au total. */
export function sonItem(actif: boolean): void {
  if (!actif) return;
  sonLettre(actif, 7);
  const c = ctx();
  if (!c) return;
  const t = c.currentTime + 0.13;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(783.99, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.11, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.34);
}
