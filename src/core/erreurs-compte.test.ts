import { describe, expect, it } from 'vitest';
import { messageDEchec, messageDEchecListe, messageDEchecProfil } from './erreurs-compte';
import { LISTES_MAX } from './listes';
import { PRENOM_MAX, PROFILS_MAX } from './profils';

/**
 * Régression (2026-08-29, production) : une inscription refusée affichait
 * « L'adresse est peut-être déjà prise, ou le mot de passe trop court ». Les
 * deux étaient faux — l'adresse était libre (la base ne contenait aucun
 * compte) et le mot de passe faisait 64 caractères. Le serveur avait pourtant
 * répondu précisément ; l'écran jetait sa réponse.
 *
 * Codes relevés sur les réponses réelles de Better Auth 1.7.
 */
describe('messageDEchec', () => {
  const cas: [string, { statut: number; code?: string }, 'connexion' | 'creation', RegExp][] = [
    ['mot de passe trop court', { statut: 400, code: 'PASSWORD_TOO_SHORT' }, 'creation', /trop court/],
    ['adresse invalide', { statut: 400, code: 'VALIDATION_ERROR' }, 'creation', /pas l'air valide/],
    [
      'adresse déjà prise',
      { statut: 422, code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' },
      'creation',
      /déjà un compte/,
    ],
    [
      'identifiants faux',
      { statut: 401, code: 'INVALID_EMAIL_OR_PASSWORD' },
      'connexion',
      /incorrect/,
    ],
    ['trop de tentatives', { statut: 429 }, 'creation', /Trop de tentatives/],
    ['comptes indisponibles', { statut: 503 }, 'connexion', /indisponibles/],
    ['panne serveur', { statut: 500 }, 'creation', /problème/],
  ];

  for (const [nom, erreur, mode, attendu] of cas) {
    it(`dit la vérité : ${nom}`, () => {
      expect(messageDEchec(erreur, mode)).toMatch(attendu);
    });
  }

  it('sans réseau, aucun statut : on parle de connexion, pas du mot de passe', () => {
    expect(messageDEchec(new Error('fetch failed'), 'creation')).toMatch(/joindre le serveur/);
  });

  it('un statut inconnu reste diagnosticable : il est affiché', () => {
    expect(messageDEchec({ statut: 418 }, 'creation')).toMatch(/418/);
  });

  /* Le cœur du bug : ces trois échecs ne doivent PLUS jamais accuser le mot de
     passe ni l'adresse. C'est ce mensonge qui a coûté le diagnostic. */
  it.each([{ statut: 429 }, { statut: 500 }, { statut: 418 }])(
    "n'accuse ni le mot de passe ni l'adresse quand ce n'est pas la cause (%o)",
    (erreur) => {
      const m = messageDEchec(erreur, 'creation');
      expect(m).not.toMatch(/trop court/);
      expect(m).not.toMatch(/déjà un compte/);
    },
  );
});

/**
 * Gérer les enfants (#18) : le serveur refuse pour des raisons PRÉCISES —
 * prénom déjà pris dans le foyer, plafond atteint, profil disparu. Le parent
 * doit lire laquelle, sinon un bouton qui ne fait rien reste un bouton cassé.
 */
describe('messageDEchecProfil', () => {
  const cas: [string, { statut?: number; code?: string }, RegExp][] = [
    ['prénom déjà pris', { statut: 409, code: 'PRENOM_DEJA_PRIS' }, /porte déjà ce prénom/],
    ['plafond atteint', { statut: 409, code: 'TROP_DE_PROFILS' }, new RegExp(`${PROFILS_MAX}`)],
    ['prénom invalide', { statut: 400, code: 'PRENOM_INVALIDE' }, new RegExp(`${PRENOM_MAX}`)],
    ['profil disparu', { statut: 404, code: 'PROFIL_INTROUVABLE' }, /n'existe plus/],
    ['session expirée', { statut: 401 }, /reconnecter/],
    ['hors ligne', {}, /connexion à Internet/],
  ];

  for (const [nom, echec, attendu] of cas) {
    it(`dit ce qui s'est passé : ${nom}`, () => {
      expect(messageDEchecProfil(echec)).toMatch(attendu);
    });
  }

  it("ne reste jamais muet sur un statut qu'il ne connaît pas", () => {
    expect(messageDEchecProfil({ statut: 418 })).toMatch(/418/);
  });
});

/* #9 — la bibliothèque. Un « Créer la liste » qui ne fait rien, sans un mot,
   laisse le parent croire que le bouton est cassé alors que le compte est
   simplement plein. */
describe('messageDEchecListe', () => {
  const cas: [string, { statut?: number; code?: string }, RegExp][] = [
    ['plafond atteint', { statut: 409, code: 'TROP_DE_LISTES' }, new RegExp(`${LISTES_MAX} listes`)],
    ['liste invalide', { statut: 400, code: 'LISTE_INVALIDE' }, /nom.*au moins un mot|au moins un mot/],
    ['session expirée', { statut: 401 }, /session a expiré/],
    ['serveur en panne', { statut: 503 }, /problème/],
    ['hors ligne', {}, /Internet/],
  ];

  it.each(cas)('%s', (_titre, erreur, attendu) => {
    expect(messageDEchecListe(erreur)).toMatch(attendu);
  });
});
