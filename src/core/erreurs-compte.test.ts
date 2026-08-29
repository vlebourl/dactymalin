import { describe, expect, it } from 'vitest';
import { messageDEchec } from './erreurs-compte';

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
