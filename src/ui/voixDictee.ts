import { useEffect, useState } from 'react';
import { DEBIT_DICTEE, dire, useVoixFrancaise } from './SpeakerButton';

/**
 * La voix de la DICTÉE (#124) : celle du serveur (Piper) quand il en a une —
 * la même sur tous les appareils, lente sans être étirée — et, à défaut, celle
 * du navigateur. Le repli est SILENCIEUX : pas de Piper, pas de réseau, une
 * synthèse qui échoue… l'enfant entend son mot dans tous les cas.
 */

/** `null` tant que le serveur n'a pas répondu OUI ou NON. */
let voixServeur: boolean | null = null;
let question: Promise<boolean> | null = null;

function demanderAuServeur(): Promise<boolean> {
  question ??= fetch('/api/voix/etat')
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<{ disponible?: unknown }>;
    })
    .then((etat) => (voixServeur = etat.disponible === true))
    /* Un échec n'est PAS une réponse : le retenir écarterait la voix du serveur
       pour toute la vie de la page — des jours, sur une tablette qu'on ne
       recharge jamais. La prochaine ouverture de l'accueil reposera la question. */
    .catch(() => {
      question = null;
      return false;
    });
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

/** Un dixième de seconde de VRAI silence : de quoi déverrouiller le lecteur. */
const SILENCE =
  'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';

/** Au-delà, l'enfant n'attend plus le serveur : le navigateur dit le mot. */
const PATIENCE_MS = 3000;

/**
 * Les sons déjà reçus, par mot. Le son est TÉLÉCHARGÉ puis joué depuis la
 * mémoire, plutôt que donné en URL au lecteur : Safari réclame des réponses
 * partielles (`Range`) que la route ne sert pas, et une URL réécrite par le
 * navigateur (`'` → `%27`) ne se compare plus à celle qu'on a demandée.
 */
const sons = new Map<string, Promise<string | null>>();

function sonDe(mot: string): Promise<string | null> {
  let son = sons.get(mot);
  if (!son) {
    son = fetch(`/api/voix/mot?mot=${encodeURIComponent(mot)}`)
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => (b ? URL.createObjectURL(b) : null))
      .catch(() => null);
    sons.set(mot, son);
    // un échec ne se retient pas : le mot sera redemandé la prochaine fois
    void son.then((url) => url ?? sons.delete(mot));
  }
  return son;
}

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

/** Rang de la dernière demande : un mot redemandé fait taire le précédent. */
let demande = 0;

/** Dit un mot de dictée : voix du serveur, sinon voix du navigateur. */
export function direMot(mot: string): void {
  if (!voixServeur || !lecteur) return dire(mot, DEBIT_DICTEE);
  const moi = ++demande;
  const repli = () => moi === demande && dire(mot, DEBIT_DICTEE);
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  lecteur.pause();
  const patience = new Promise<null>((ok) => setTimeout(ok, PATIENCE_MS, null));
  void Promise.race([sonDe(mot), patience]).then((url) => {
    if (moi !== demande) return;
    if (!url) return repli();
    lecteur.src = url;
    lecteur.dataset.mot = mot;
    /* `AbortError` : un autre mot a pris la place — ce n'est pas une panne, et
       le repli ferait parler deux voix à la fois. */
    return lecteur.play().catch((e: unknown) => (e as { name?: string })?.name !== 'AbortError' && repli());
  });
}

/**
 * Fait venir les sons de la liste AVANT que l'enfant n'en ait besoin : une
 * liste enregistrée avant #124, ou un conteneur fraîchement déployé, n'a rien
 * en cache côté serveur, et le premier mot attendrait la synthèse.
 */
export function prechargerLesMots(mots: string[]): void {
  if (voixServeur) for (const mot of mots) void sonDe(mot);
}
