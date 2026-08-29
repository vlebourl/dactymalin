import type { Sauvegarde } from './storage';
import type { Maitrise } from './progression';

/**
 * Réconciliation de deux progressions du MÊME enfant, faites sur deux
 * appareils. La règle est « le plus avancé gagne », jamais « le dernier
 * écrit gagne » : un enfant qui a joué sur l'ordinateur du salon ne doit pas
 * perdre son palier parce qu'il a ouvert l'app sur le portable ensuite.
 *
 * Fonction PURE : elle ne lit ni le réseau, ni le stockage, ni l'horloge.
 */
export function fusionner(
  a: { etat: Sauvegarde; majLe: number },
  b: { etat: Sauvegarde; majLe: number },
): Sauvegarde {
  const [ancien, recent] = a.majLe <= b.majLe ? [a, b] : [b, a];
  const avance = a.etat.palier >= b.etat.palier ? a.etat : b.etat;

  return {
    version: 1,
    /* Réglages et clavier : préférences, pas progression — le plus RÉCENT
       gagne, c'est le dernier choix de la famille. */
    disposition: recent.etat.disposition,
    dispositionChoisieALaMain:
      recent.etat.dispositionChoisieALaMain || ancien.etat.dispositionChoisieALaMain,
    reglages: recent.etat.reglages,
    /* Acquis : ils ne se perdent pas. */
    palier: Math.max(a.etat.palier, b.etat.palier),
    blocsSurPalier:
      a.etat.palier === b.etat.palier
        ? Math.max(a.etat.blocsSurPalier, b.etat.blocsSurPalier)
        : avance.blocsSurPalier,
    // compteur monotone : il ne redescend jamais
    bloc: Math.max(a.etat.bloc, b.etat.bloc),
    maitrise: fusionnerMaitrise(a.etat.maitrise, b.etat.maitrise),
    guideDoigtVu: a.etat.guideDoigtVu || b.etat.guideDoigtVu,
  };
}

/** Union par caractère des numéros de bloc, dédoublonnés et triés. */
export function fusionnerMaitrise(a: Maitrise, b: Maitrise): Maitrise {
  const sortie: Maitrise = {};
  for (const cle of new Set([...Object.keys(a), ...Object.keys(b)])) {
    sortie[cle] = [...new Set([...(a[cle] ?? []), ...(b[cle] ?? [])])].sort((x, y) => x - y);
  }
  return sortie;
}
