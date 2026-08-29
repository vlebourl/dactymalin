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

export type Mode = 'connexion' | 'creation';

type Echec = { statut?: number; code?: string };

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
