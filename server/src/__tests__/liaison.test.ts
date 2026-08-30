import { describe, expect, it } from 'vitest';
import { creerAuth } from '../auth';
import { creerBase } from '../db/client';
import { lireEnv } from '../env';

/**
 * #32 — la propriété de sécurité de tout ce lot, en un seul endroit.
 *
 * Rattacher une seconde méthode EXPLICITEMENT, depuis l'espace parent, exige
 * d'être déjà connecté : l'attaquant ne rattache pas ce à quoi il n'a pas
 * accès. Lier AUTOMATIQUEMENT à la connexion serait tout autre chose — la
 * vérification d'adresse étant désactivée, n'importe qui pourrait créer un
 * compte mot de passe avec une adresse Gmail qu'il ne possède pas, puis
 * RECEVOIR son titulaire légitime dans son propre compte.
 *
 * Deux réglages séparent les deux, et ce test existe pour qu'on ne les
 * confonde jamais. Il est délibérément écrit sur la CONFIGURATION : le chemin
 * implicite ne peut pas être joué sans un vrai Google, et une propriété qu'on
 * ne peut pas exercer mérite au moins d'être verrouillée là où elle se décide.
 */
const URL_TEST = process.env.TEST_DATABASE_URL;
const d = URL_TEST ? describe : describe.skip;

d('liaison de comptes : ce qui est permis, et ce qui ne l’est jamais', () => {
  const options = () => {
    const env = lireEnv({
      NODE_ENV: 'test',
      DATABASE_URL: URL_TEST,
      BETTER_AUTH_SECRET: 'x'.repeat(40),
    } as NodeJS.ProcessEnv);
    return creerAuth(creerBase(URL_TEST!), env).options;
  };

  /* Lu comme une DONNÉE, et non par le type : TypeScript restreint le type à
     ce qu'on a écrit littéralement, or ce test porte précisément sur ce qu'on
     n'écrit PAS — les réglages laissés à leur défaut. Les voir « absents »
     suffirait à faire passer une assertion qui ne regarde rien. */
  const liaison = () =>
    (options().account?.accountLinking ?? {}) as {
      enabled?: boolean;
      requireLocalEmailVerified?: boolean;
      allowDifferentEmails?: boolean;
    };

  it('le rattachement explicite est autorisé', () => {
    expect(liaison().enabled).toBe(true);
  });

  /**
   * LE test. `requireLocalEmailVerified` vaut `true` par défaut, et c'est lui
   * qui interdit la liaison implicite : nos comptes mot de passe ont
   * `emailVerified = false`, donc une connexion Google ne les rejoint jamais
   * toute seule. Le passer à `false` rouvrirait la prise de compte.
   */
  it('la liaison implicite reste fermée : l’adresse locale non vérifiée ne se rejoint pas', () => {
    expect(liaison().requireLocalEmailVerified).not.toBe(false);
  });

  /* La garde n'a de sens que parce que nos comptes sont bel et bien non
     vérifiés. Si un jour un courriel de vérification part, cette combinaison
     change de nature et il faudra revenir ici. */
  it('et nos comptes mot de passe sont bien non vérifiés', () => {
    expect(options().emailAndPassword?.requireEmailVerification).toBe(false);
  });

  /* On ne rattache pas l'identité d'un tiers : l'adresse du compte Google doit
     être celle du compte ouvert. */
  it('les adresses différentes ne se rattachent pas', () => {
    expect(liaison().allowDifferentEmails).not.toBe(true);
  });
});
