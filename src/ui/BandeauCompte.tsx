import type { Compte } from '../core/sync';
import s from './ui.module.css';

/**
 * Le compte connecté, dit une fois pour toute l'application (#19).
 *
 * Il est monté AU-DESSUS du commutateur de vues, donc il traverse les
 * changements d'écran sans se démonter ni se recharger : l'information ne
 * clignote pas entre deux vues, et aucune vue n'a à la redire.
 *
 * Il n'est PAS un bouton. Rendre focalisable un texte qui n'agit pas est un
 * défaut d'accessibilité, et tout ce qu'on ferait ici — changer de compte, se
 * déconnecter — vit déjà dans l'espace parent. Le lecteur d'écran l'annonce
 * grâce à son libellé ; le clavier n'a rien à y saisir.
 *
 * L'adresse vient du compte que l'appareil CONNAÎT, pas d'une requête : hors
 * ligne elle reste affichée, au lieu de disparaître au moment précis où le
 * parent se demande sur quel compte il est.
 */
export function BandeauCompte({ compte }: { compte: Compte | null }) {
  if (!compte) return null;
  return (
    <div className={s.bandeauCompte} data-bandeau-compte aria-label={`Compte connecté : ${compte.email}`}>
      <span className={s.bandeauEtiquette}>Compte&nbsp;:</span>{' '}
      <span className={s.bandeauAdresse} title={compte.email}>
        {compte.email}
      </span>
    </div>
  );
}
