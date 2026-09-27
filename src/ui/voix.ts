import { useEffect, useState } from 'react';
import { estUneConsigne } from '../core/consignes';
import { nomDeLettre } from '../core/nomDeLettre';
import { DEBIT_DICTEE, dire, useVoixFrancaise } from './SpeakerButton';

/**
 * La VOIX de l'app — le mot d'une dictée (#124), le nom d'une lettre donnée au
 * barreau 3 (#126) : celle du serveur (Piper) quand il en a une —
 * la même sur tous les appareils, lente sans être étirée — et, à défaut, celle
 * du navigateur. Le repli est SILENCIEUX : pas de Piper, pas de réseau, une
 * synthèse qui échoue… l'enfant entend son mot, ou sa lettre, dans tous les cas.
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

/** Débit du nom de lettre dit par le NAVIGATEUR (celui de Piper vient du serveur). */
const DEBIT_LETTRE = 0.85;

const urlDuMot = (mot: string) => `/api/voix/mot?mot=${encodeURIComponent(mot)}`;
const urlDeLaLettre = (c: string) => `/api/voix/lettre?c=${encodeURIComponent(c)}`;
const urlDeLaConsigne = (t: string) => `/api/voix/consigne?t=${encodeURIComponent(t)}`;

/**
 * Les sons déjà reçus, par URL. Le son est TÉLÉCHARGÉ puis joué depuis la
 * mémoire, plutôt que donné en URL au lecteur : Safari réclame des réponses
 * partielles (`Range`) que la route ne sert pas, et une URL réécrite par le
 * navigateur (`'` → `%27`) ne se compare plus à celle qu'on a demandée.
 */
const sons = new Map<string, Promise<string | null>>();

function sonDe(adresse: string): Promise<string | null> {
  let son = sons.get(adresse);
  if (!son) {
    son = fetch(adresse)
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => (b ? URL.createObjectURL(b) : null))
      .catch(() => null);
    sons.set(adresse, son);
    // un échec ne se retient pas : le son sera redemandé la prochaine fois
    void son.then((url) => url ?? sons.delete(adresse));
  }
  return son;
}

/**
 * À appeler DANS le clic qui lance une leçon : la voix parle ensuite hors de
 * tout geste — le premier mot d'une dictée à l'ouverture, une lettre au
 * barreau 3. Les deux voix sont amorcées : on ne sait pas laquelle parlera.
 */
export function amorcerLaVoix(): void {
  dire('');
  if (!lecteur) return;
  lecteur.src = SILENCE;
  void lecteur.play().catch(() => {});
}

/** Rang de la dernière demande : un son redemandé fait taire le précédent. */
let demande = 0;

/**
 * Joue le son du serveur ; à défaut, fait dire `texte` par le navigateur.
 * `voixFrancaiseExigee` : un nom de lettre se tait plutôt que d'être dit par
 * une voix étrangère (voir `dire`).
 */
function parler(adresse: string, texte: string, debit: number, voixFrancaiseExigee = false): void {
  const navigateur = () => dire(texte, debit, voixFrancaiseExigee);
  if (!voixServeur || !lecteur) return navigateur();
  const moi = ++demande;
  const repli = () => moi === demande && navigateur();
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  lecteur.pause();
  const patience = new Promise<null>((ok) => setTimeout(ok, PATIENCE_MS, null));
  void Promise.race([sonDe(adresse), patience]).then((url) => {
    if (moi !== demande) return;
    if (!url) return repli();
    lecteur.src = url;
    lecteur.dataset.dit = texte;
    /* `AbortError` : un autre son a pris la place — ce n'est pas une panne, et
       le repli ferait parler deux voix à la fois. */
    return lecteur.play().catch((e: unknown) => (e as { name?: string })?.name !== 'AbortError' && repli());
  });
}

/** Dit un mot de dictée. */
export function direMot(mot: string): void {
  parler(urlDuMot(mot), mot, DEBIT_DICTEE);
}

/**
 * Dit le NOM d'un caractère (« point », « a accent grave »), pas le caractère :
 * une synthèse reste muette sur « . ». Sans nom connu, le navigateur fait ce
 * qu'il peut du caractère brut — le serveur, lui, ne le dirait pas.
 */
export function direLettre(caractere: string): void {
  const nom = nomDeLettre(caractere);
  if (nom === null) return dire(caractere, DEBIT_LETTRE, true);
  parler(urlDeLaLettre(caractere), nom, DEBIT_LETTRE, true);
}

/**
 * Lit une consigne. Seules celles de `core/consignes.ts` existent côté serveur ;
 * toute autre phrase est dite par le navigateur, sans aller-retour inutile.
 */
export function direConsigne(texte: string): void {
  if (!estUneConsigne(texte)) return dire(texte);
  parler(urlDeLaConsigne(texte), texte, 0.9);
}

/**
 * Pose la question de la voix du serveur DÈS le démarrage de l'app : les
 * consignes du choix du clavier et du guide des doigts se lisent avant même
 * que l'accueil — qui la posait seul — ait été monté une fois.
 */
export function sonderLaVoixDuServeur(): void {
  void demanderAuServeur();
}

/**
 * Fait venir les sons de la liste AVANT que l'enfant n'en ait besoin : une
 * liste enregistrée avant #124, ou un conteneur fraîchement déployé, n'a rien
 * en cache côté serveur, et le premier mot attendrait la synthèse.
 */
export function prechargerLesMots(mots: string[]): void {
  if (voixServeur) for (const mot of mots) void sonDe(urlDuMot(mot));
}

/** La lettre sur laquelle l'enfant bute : son nom sera là s'il faut le dire. */
export function prechargerLaLettre(caractere: string): void {
  if (voixServeur && nomDeLettre(caractere) !== null) void sonDe(urlDeLaLettre(caractere));
}
