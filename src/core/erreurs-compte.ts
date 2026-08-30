/**
 * Traduire ce que le serveur dit vraiment.
 *
 * L'écran de connexion affichait une phrase unique — « adresse peut-être déjà
 * prise, ou mot de passe trop court » — quel que soit l'échec. Le jour où une
 * inscription a été refusée en production, les DEUX causes nommées étaient
 * fausses : l'adresse était libre et le mot de passe faisait 64 caractères.
 * Un message qui accuse l'utilisateur à tort est pire qu'un message absent.
 *
 * Les codes viennent des réponses réelles de Better Auth, relevées sur le
 * serveur, pas de sa documentation.
 */

import { LISTES_MAX, NOM_LISTE_MAX } from './listes';
import { PRENOM_MAX, PROFILS_MAX } from './profils';

export type Mode = 'connexion' | 'creation';

type Echec = { statut?: number; code?: string };

/** Sans code, ou avec un code inconnu : le statut décide, et il est toujours dit. */
const parDefaut = (statut: number | undefined, sur401: string) => {
  if (statut === 401) return sur401;
  if (statut !== undefined && statut >= 500) {
    return 'Le serveur a un problème. Réessayez dans un instant.';
  }
  return inattendu(statut);
};

/** Dernier recours : jamais muet sur le statut, pour rester diagnosticable. */
const inattendu = (statut?: number) =>
  statut === undefined
    ? "Impossible de joindre le serveur. Vérifie la connexion à Internet."
    : `Le serveur a répondu une erreur inattendue (${statut}). Réessaie dans un instant.`;

export function messageDEchec(erreur: unknown, mode: Mode): string {
  const { statut, code } = (erreur ?? {}) as Echec;

  switch (code) {
    case 'PASSWORD_TOO_SHORT':
      return 'Le mot de passe est trop court : il en faut 10 caractères au moins.';
    case 'VALIDATION_ERROR':
      return "Cette adresse électronique n'a pas l'air valide.";
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return "Cette adresse a déjà un compte. Connecte-toi plutôt que d'en créer un.";
    case 'INVALID_EMAIL_OR_PASSWORD':
      return 'Adresse ou mot de passe incorrect.';
  }

  /* Sans code : on se rabat sur le statut. 429 est le plus important — c'est
     lui qui se déguisait en « ton mot de passe est trop court ». */
  if (statut === 429) {
    return "Trop de tentatives d'affilée. Attends une minute, puis réessaie.";
  }
  if (statut === 401) return 'Adresse ou mot de passe incorrect.';
  if (statut === 503) {
    return "Les comptes sont indisponibles pour le moment. Réessaie dans un instant.";
  }
  if (statut !== undefined && statut >= 500) {
    return 'Le serveur a un problème. Réessaie dans un instant.';
  }
  if (statut === 422) {
    return mode === 'creation'
      ? "Cette adresse a déjà un compte. Connecte-toi plutôt que d'en créer un."
      : 'Adresse ou mot de passe incorrect.';
  }
  return inattendu(statut);
}

/**
 * Même principe, pour la gestion des enfants (#18) : le serveur nomme la cause
 * dans `code`, l'écran la traduit. Un « Ajouter » qui ne fait rien, sans un
 * mot, laisse le parent croire que le bouton est cassé — alors que le foyer a
 * simplement déjà un Timo.
 */
export function messageDEchecProfil(erreur: unknown): string {
  const { statut, code } = (erreur ?? {}) as Echec;

  switch (code) {
    case 'PRENOM_DEJA_PRIS':
      return 'Un enfant du foyer porte déjà ce prénom. Choisissez-en un autre.';
    case 'TROP_DE_PROFILS':
      return `Ce compte a atteint ses ${PROFILS_MAX} enfants. Supprimez-en un pour en ajouter un autre.`;
    case 'PRENOM_INVALIDE':
      return `Ce prénom ne convient pas : au moins une lettre, ${PRENOM_MAX} au maximum.`;
    case 'PROFIL_INTROUVABLE':
      return "Cet enfant n'existe plus sur le compte. Rechargez la page.";
  }

  return parDefaut(statut, 'La session a expiré. Il faut se reconnecter.');
}

/**
 * Et pour la bibliothèque (#9). Même règle : le serveur nomme la cause, l'écran
 * la traduit. Le parent qui prépare la dictée du lundi soir n'a pas à deviner
 * pourquoi son bouton reste sans effet.
 */
export function messageDEchecListe(erreur: unknown): string {
  const { statut, code } = (erreur ?? {}) as Echec;

  /* Pas de statut = le serveur n'a pas répondu. La bibliothèque se lit hors
     ligne mais ne s'y modifie pas (#11) : c'est un choix, pas une panne, et le
     parent doit l'entendre comme tel — sans quoi il croirait avoir cassé
     quelque chose au moment de préparer la dictée du lundi. Rien n'est mis en
     file d'attente, donc rien ne partira tout seul : il faut revenir. */
  if (statut === undefined) {
    return 'Hors ligne : une liste se prépare avec le réseau. Rien n’est perdu — reprenez une fois reconnecté.';
  }

  switch (code) {
    case 'TROP_DE_LISTES':
      /* La suppression existe (#10) : le message peut de nouveau indiquer la
         sortie, parce qu'elle est vraiment là. */
      return `Ce compte a atteint ses ${LISTES_MAX} listes. Supprimez-en une pour en ajouter une autre.`;
    case 'LISTE_INTROUVABLE':
      return "Cette liste n'existe plus sur le compte. Rechargez la page.";
    case 'LISTE_INVALIDE':
      return `Il faut un nom (${NOM_LISTE_MAX} caractères au maximum) et au moins un mot.`;
  }

  return parDefaut(statut, 'La session a expiré. Il faut se reconnecter.');
}

/**
 * Et pour la suppression du compte (#6). Elle exige le serveur : un bouton
 * resté muet laisserait le parent croire qu'il est parti sans laisser de
 * trace, alors que son compte est intact. C'est la pire issue possible pour un
 * geste qu'on ne fait qu'une fois, en partant.
 */
export function messageDEchecCompte(erreur: unknown): string {
  const { statut } = (erreur ?? {}) as Echec;

  if (statut === undefined) {
    /* « Rien n'a été supprimé » serait un mensonge si le réseau tombait APRÈS
       que le serveur a supprimé : on ne sait pas de quel côté la coupure a eu
       lieu. On dit ce qu'on sait — la réponse n'est pas arrivée — et ce qu'il
       faut faire pour le vérifier. */
    return "La suppression n’a pas pu être confirmée : le serveur n’a pas répondu. Vérifiez la connexion à Internet, puis rouvrez cet écran pour voir où en est le compte.";
  }
  return parDefaut(statut, 'La session a expiré : reconnectez-vous, puis recommencez.');
}

/**
 * Le retour d'un parcours Google qui a échoué (#7). Better Auth ne renvoie pas
 * une réponse d'API : il RAMÈNE le navigateur sur l'écran de connexion avec un
 * `?error=`. Sans lecture de ce paramètre, le parent part chez Google, revient,
 * et retrouve le formulaire sans un mot — le pire des échecs, celui qui laisse
 * croire à une panne.
 *
 * `account_not_linked` est le cas FRÉQUENT, et il est voulu : la liaison
 * automatique est désactivée. L'adresse est déjà celle d'un compte à mot de
 * passe, et elle ne peut pas en ouvrir un second — la colonne est unique.
 */
export function messageDErreurGoogle(code: string | null | undefined): string | null {
  if (!code) return null;
  if (code === 'account_not_linked') {
    /* Depuis #32, ce message a une SUITE : le parent n'est plus enfermé dans
       la méthode par laquelle il a commencé. Il se connecte comme d'habitude,
       puis rattache Google depuis l'espace parent — un geste qui exige d'être
       déjà dans le compte, et c'est précisément ce qui le rend sûr. */
    return "Cette adresse a déjà un compte avec mot de passe. Connectez-vous avec ce mot de passe, puis rattachez Google depuis l’espace parent : par sécurité, les deux ne sont jamais reliés automatiquement.";
  }
  return "La connexion avec Google n’a pas abouti. Réessayez, ou utilisez une adresse et un mot de passe.";
}

/**
 * Rattacher Google au compte ouvert (#32). Deux refus arrivent vraiment : le
 * réseau, et une adresse Google qui n'est pas celle du compte — Better Auth
 * l'exige, et c'est un garde-fou, pas une contrariété : on ne rattache pas
 * l'identité d'un tiers.
 */
export function messageDEchecRattachement(erreur: unknown): string {
  const { statut, code } = (erreur ?? {}) as Echec;

  if (statut === undefined) {
    return 'Le serveur n’a pas répondu : rien n’a changé. Vérifiez la connexion à Internet, puis réessayez.';
  }
  if (code === 'EMAIL_DOES_NOT_MATCH') {
    return 'Ce compte Google porte une autre adresse. Le rattachement demande le compte Google de la même adresse que celle-ci.';
  }
  return parDefaut(statut, 'La session a expiré : reconnectez-vous, puis recommencez.');
}
