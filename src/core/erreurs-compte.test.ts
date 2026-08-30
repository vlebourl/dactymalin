import { describe, expect, it } from 'vitest';
import {
  messageDErreurGoogle,
  messageDEchec,
  messageDEchecCompte,
  messageDEchecListe,
  messageDEchecProfil,
} from './erreurs-compte';
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
    ['liste disparue', { statut: 404, code: 'LISTE_INTROUVABLE' }, /n'existe plus/],
    ['liste invalide', { statut: 400, code: 'LISTE_INVALIDE' }, /nom.*au moins un mot|au moins un mot/],
    ['session expirée', { statut: 401 }, /session a expiré/],
    ['serveur en panne', { statut: 503 }, /problème/],
    /* #11 — le refus doit DIRE que c'est le réseau, et que rien n'est perdu.
       « Une erreur inattendue » laisserait le parent croire qu'il a cassé
       quelque chose au moment où il prépare la dictée du lundi. */
    ['hors ligne', {}, /Hors ligne.*réseau/],
  ];

  it.each(cas)('%s', (_titre, erreur, attendu) => {
    expect(messageDEchecListe(erreur)).toMatch(attendu);
  });

  it('hors ligne, il dit aussi que rien n’est perdu', () => {
    expect(messageDEchecListe({})).toMatch(/rien n’est perdu|rien n'est perdu/i);
  });
});

/* #6 — supprimer son compte exige le serveur. Un bouton muet laisserait croire
   que le compte est parti alors qu'il est intact : c'est la pire des issues
   pour un geste qu'on ne fait qu'une fois, en partant. */
describe('messageDEchecCompte', () => {
  /* Il ne jure PAS que rien n'a été supprimé : si le réseau tombe après que le
     serveur a agi, personne ne le sait de ce côté-ci. Il dit ce qu'on sait. */
  it('hors ligne, il dit que la suppression n’est pas confirmée', () => {
    expect(messageDEchecCompte({})).toMatch(/n’a pas pu être confirmée/i);
    expect(messageDEchecCompte({})).toMatch(/Internet/i);
    expect(messageDEchecCompte({})).not.toMatch(/^Rien n/);
  });

  it('session finie ou serveur en panne : chacun son motif', () => {
    expect(messageDEchecCompte({ statut: 401 })).toMatch(/session/i);
    expect(messageDEchecCompte({ statut: 503 })).toMatch(/problème/i);
  });
});

/* #7 — le retour d'un parcours Google qui a échoué. Better Auth ramène le
   navigateur sur l'écran de connexion avec un `?error=` ; sans lecture de ce
   paramètre, le parent revient de chez Google sans un mot d'explication, et
   c'est le chemin d'échec le plus probable en production. */
describe('messageDErreurGoogle', () => {
  it('explique le refus de liaison, qui est le cas fréquent', () => {
    const m = messageDErreurGoogle('account_not_linked')!;
    expect(m).toMatch(/mot de passe/i);
    /* Il dit quoi FAIRE, pas seulement que ça a raté. */
    expect(m).toMatch(/connectez-vous|utilisez/i);
  });

  it('reste compréhensible sur un code qu’on ne connaît pas', () => {
    const m = messageDErreurGoogle('quelque_chose_dimprevu')!;
    expect(m).toMatch(/Google/);
    expect(m).toMatch(/adresse et un mot de passe|réessay/i);
  });

  it('ne dit rien quand il n’y a pas d’erreur', () => {
    expect(messageDErreurGoogle(null)).toBeNull();
    expect(messageDErreurGoogle('')).toBeNull();
  });
});
