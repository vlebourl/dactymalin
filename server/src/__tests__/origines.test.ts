import { describe, expect, it } from 'vitest';
import { creerAuth } from '../auth';
import { creerBase } from '../db/client';
import { lireEnv } from '../env';

/**
 * #66 — deux domaines servent la même application, et l'un des deux refusait
 * toute connexion.
 *
 * `dacty.tiarkaerell.com` et `typing.tiarkaerell.com` menaient au même serveur.
 * Une seule origine pouvant être déclarée, l'autre recevait un 403
 * « Invalid origin » sur CHAQUE appel de compte, création comprise. Le parent
 * n'en voyait que « une erreur inattendue (403) », et sur le bouton Google
 * « Impossible de joindre Google » : l'application inventait une panne de
 * réseau là où le serveur refusait poliment son propre front.
 *
 * Deux détails expliquent pourquoi la panne a survécu si longtemps, et
 * pourquoi ce test est écrit sur la CONFIGURATION plutôt que sur la route :
 *
 *  1. Better Auth ne vérifie l'origine que si la requête porte un COOKIE. Un
 *     `curl` passe donc là où le navigateur — qui en envoie toujours un — se
 *     fait refouler. Le serveur avait l'air sain vu du terminal.
 *  2. Sous `NODE_ENV=test`, Better Auth désactive lui-même ce contrôle
 *     (`skipOriginCheck`). Aucun test HTTP ne peut donc l'exercer ici, et le
 *     mesurer exigerait de mentir sur l'environnement.
 *
 * Reste la seule chose qui décide vraiment : la liste des origines de
 * confiance. C'est elle qui était incomplète, c'est elle qu'on verrouille.
 */
/* `typing` a depuis été abandonné, et la production ne déclare plus que
   `dacty`. Les deux restent ici parce que la propriété mesurée est « une
   liste d'origines », pas « ces deux domaines-là » : le jour où un second
   domaine reviendra, c'est ce test qui dira s'il est accepté. */
const DACTY = 'https://dacty.tiarkaerell.com';
const TYPING = 'https://typing.tiarkaerell.com';

const originesDeConfiance = (frontendUrl?: string): string[] => {
  const env = lireEnv({
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://personne@localhost:5432/rien',
    BETTER_AUTH_SECRET: 'x'.repeat(40),
    BETTER_AUTH_URL: DACTY,
    ...(frontendUrl === undefined ? {} : { FRONTEND_URL: frontendUrl }),
  } as NodeJS.ProcessEnv);
  return creerAuth(creerBase(env.DATABASE_URL!), env).options.trustedOrigins as string[];
};

describe('les origines autorisées à parler à l’API', () => {
  it('déclare les DEUX domaines quand les deux sont donnés', () => {
    const origines = originesDeConfiance(`${DACTY},${TYPING}`);
    expect(origines).toContain(DACTY);
    expect(origines).toContain(TYPING);
  });

  /* Les espaces autour de la virgule sont ceux qu'on écrit sans y penser dans
     un panneau de configuration. Ils ne doivent pas produire une origine
     invisible, refusée en silence chez le parent. */
  it('supporte les espaces autour de la virgule', () => {
    expect(originesDeConfiance(`${DACTY} , ${TYPING}`)).toEqual(
      expect.arrayContaining([DACTY, TYPING]),
    );
  });

  /* Une seule valeur reste le cas ordinaire, et doit continuer de marcher. */
  it('accepte une origine unique, écrite sans virgule', () => {
    expect(originesDeConfiance(DACTY)).toContain(DACTY);
  });

  /* Le garde-fou n'est pas devenu une passoire : ce qui n'est pas déclaré
     n'entre pas dans la liste. Sans cette moitié, on aurait « corrigé » le bug
     en ouvrant l'API à n'importe quel site. */
  it('ne déclare rien d’autre que ce qui est donné', () => {
    expect(originesDeConfiance(DACTY)).not.toContain(TYPING);
    expect(originesDeConfiance(undefined)).toEqual([]);
  });

  /* Une valeur mal écrite doit empêcher le DÉMARRAGE, pas se transformer en
     origine muette : le conteneur qui accepte de servir avec une liste
     tronquée est exactement ce qui a produit la panne. */
  it('refuse de démarrer sur une origine qui n’est pas une URL', () => {
    expect(() => originesDeConfiance(`${DACTY},pas-une-url`)).toThrow(/FRONTEND_URL/);
  });
});
