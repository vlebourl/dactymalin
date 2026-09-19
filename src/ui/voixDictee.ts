import { useEffect, useState } from 'react';
import { DEBIT_DICTEE, dire, useVoixFrancaise } from './SpeakerButton';

/**
 * La voix de la DICTÉE (#124) : celle du serveur (Piper) quand il en a une —
 * la même sur tous les appareils, lente sans être étirée — et, à défaut, celle
 * du navigateur. Le repli est SILENCIEUX : pas de Piper, pas de réseau, une
 * synthèse qui échoue… l'enfant entend son mot dans tous les cas.
 */

/** `null` tant que le serveur n'a pas répondu. Lu une fois par session de page. */
let voixServeur: boolean | null = null;
let question: Promise<boolean> | null = null;

function demanderAuServeur(): Promise<boolean> {
  question ??= fetch('/api/voix/etat')
    .then((r) => (r.ok ? r.json() : { disponible: false }))
    .then((etat: { disponible?: unknown }) => etat.disponible === true)
    .catch(() => false)
    .then((disponible) => (voixServeur = disponible));
  return question;
}

/**
 * La dictée peut-elle parler ? Oui dès que l'UNE des deux voix existe ; `null`
 * tant qu'on ne sait pas — conclure « non » trop tôt fermerait la dictée à tort.
 */
export function useVoixDictee(): boolean | null {
  const navigateur = useVoixFrancaise();
  const [serveur, setServeur] = useState(voixServeur);
  useEffect(() => {
    let vivant = true;
    void demanderAuServeur().then((d) => vivant && setServeur(d));
    return () => {
      vivant = false;
    };
  }, []);
  if (navigateur || serveur) return true;
  return navigateur === null || serveur === null ? null : false;
}

/* UN seul lecteur, réutilisé : iPad et Android ne laissent jouer un son qu'après
   un geste, et c'est l'ÉLÉMENT qui est déverrouillé, pas la page. */
const lecteur = typeof Audio === 'undefined' ? null : new Audio();

/** Un WAV vide — de quoi déverrouiller le lecteur sans rien faire entendre. */
const SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=';

const sonDe = (mot: string) => `/api/voix/mot?mot=${encodeURIComponent(mot)}`;

/**
 * À appeler DANS le clic qui lance la dictée : le premier mot est dit à
 * l'ouverture de la leçon, donc hors de tout geste. Les deux voix sont
 * amorcées — on ne sait pas encore laquelle parlera.
 */
export function amorcerLaVoix(): void {
  dire('');
  if (!lecteur) return;
  lecteur.src = SILENCE;
  void lecteur.play().catch(() => {});
}

/** Dit un mot de dictée : voix du serveur, sinon voix du navigateur. */
export function direMot(mot: string): void {
  if (!voixServeur || !lecteur) return dire(mot, DEBIT_DICTEE);
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  const src = sonDe(mot);
  lecteur.src = src;
  lecteur.play().catch((echec: unknown) => {
    /* Un mot redemandé entre-temps INTERROMPT celui-ci (`AbortError`) : ce
       n'est pas une panne, et le repli ferait parler deux voix à la fois. */
    const interrompu = (echec as { name?: string })?.name === 'AbortError';
    if (!interrompu && lecteur.src.endsWith(src)) dire(mot, DEBIT_DICTEE);
  });
}

/**
 * Fait venir les sons de la liste AVANT que l'enfant n'en ait besoin : une
 * liste enregistrée avant #124, ou un conteneur fraîchement déployé, n'a rien
 * en cache, et le premier mot attendrait la synthèse.
 */
export function prechargerLesMots(mots: string[]): void {
  if (!voixServeur) return;
  for (const mot of mots) void fetch(sonDe(mot)).catch(() => {});
}
