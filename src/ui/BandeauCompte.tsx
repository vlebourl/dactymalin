import type { Compte } from '../core/sync';
import s from './ui.module.css';

/**
 * Le compte connecté, dit une fois pour toute l'application (#19).
 *
 * Il est monté AU-DESSUS du commutateur de vues, donc il traverse les
 * changements d'écran sans se démonter ni se recharger : l'information ne
 * clignote pas entre deux vues, et aucune vue n'a à la redire.
 *
 * Il n'est PAS un bouton : rendre focalisable un texte qui n'agit pas est un
 * défaut d'accessibilité, et tout ce qu'on ferait ici — changer de compte, se
 * déconnecter — vit déjà dans l'espace parent.
 *
 * C'est donc un REPÈRE (`aside` → `complementary`), et non un `div` nu. La
 * différence n'est pas cosmétique : un `div` sans rôle porte le rôle implicite
 * `generic`, qui n'accepte AUCUN nom accessible — son `aria-label` était donc
 * purement décoratif, ignoré par les lecteurs d'écran. Devenu repère, il porte
 * son nom et se rejoint par la navigation entre repères, sans qu'on ait à
 * rendre focalisable un texte inerte.
 *
 * Il disparaît PENDANT LA LEÇON. Le cahier des charges est catégorique sur cet
 * écran-là : un enfant de sept ans « ne doit décoder qu'une seule chose à
 * l'écran », et « rien sur les côtés ». Une adresse électronique est du texte
 * d'adulte, dense et illisible pour lui — et la raison d'être du bandeau, le
 * parent sur un ordinateur partagé, ne se pose jamais pendant que l'enfant
 * tape. C'est du CSS, sur la vue posée par le reducer : le bandeau n'a pas à
 * savoir quel écran est affiché.
 *
 * L'adresse vient du compte que l'appareil CONNAÎT, pas d'une requête : hors
 * ligne elle reste affichée, au lieu de disparaître au moment précis où le
 * parent se demande sur quel compte il est.
 */
export function BandeauCompte({ compte }: { compte: Compte | null }) {
  if (!compte) return null;
  return (
    <aside className={s.bandeauCompte} data-bandeau-compte aria-label="Compte connecté">
      <span className={s.bandeauEtiquette}>Compte&nbsp;:</span>{' '}
      <span className={s.bandeauAdresse}>{compte.email}</span>
    </aside>
  );
}
