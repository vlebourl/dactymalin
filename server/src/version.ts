import { readFileSync } from 'node:fs';

/**
 * De quoi reconnaître la construction qui tourne (#105).
 *
 * Le numéro de `package.json` ne bouge pas d'un déploiement à l'autre : seul,
 * il répondrait la même chose sur du code vieux d'un mois.
 *
 * On ne retient donc que ce qui est VRAI au moment où le serveur répond :
 *
 * - `SOURCE_COMMIT`, que Coolify pose dans l'environnement du CONTENEUR au
 *   démarrage. Elle n'atteint PAS le `docker build` — Coolify n'émet un
 *   `--build-arg` que pour les variables déclarées de l'application — donc on
 *   la lit à l'exécution. Y figer un SHA au moment où l'image est écrite
 *   donnerait un identifiant qui a l'air juste en mentant, pire que « 0.1.0 ».
 * - l'instant de démarrage du processus. C'est LUI qui distingue deux
 *   constructions successives du même code : le cache de couches Docker rend
 *   identique toute date inscrite dans l'image, et le commit ne bouge pas non
 *   plus quand le code n'a pas bougé.
 */
export type Identifiant = {
  /** Le numéro du paquet. Utile au lecteur, insuffisant à lui seul. */
  version: string;
  /** Le commit court déployé, ou `null` hors Coolify (développement local). */
  commit: string | null;
  /** Instant de démarrage, en ISO. Ce qui change à chaque déploiement. */
  demarre: string;
};

/** Version du paquet, lue une fois : c'est le repère le plus lisible. */
function versionPaquet(): string {
  try {
    const brut = readFileSync(new URL('../../package.json', import.meta.url), 'utf8');
    return (JSON.parse(brut) as { version?: string }).version ?? 'inconnue';
  } catch {
    return 'inconnue';
  }
}

export const VERSION = versionPaquet();

export function identifiantVersion(env: NodeJS.ProcessEnv, demarre: Date): Identifiant {
  /* Une valeur vide vaut absente : Coolify pose la variable partout, et une
     chaîne vide affichée telle quelle ressemblerait à un commit tronqué. */
  const sha = (env.SOURCE_COMMIT ?? '').trim();
  return {
    version: VERSION,
    commit: sha === '' ? null : sha.slice(0, 7),
    demarre: demarre.toISOString(),
  };
}
