import { disposition, estProposable, type IdDisposition, type Main, type Touche } from '../core/layouts';
import { toutesLesTouches } from '../core/parcours';
import { Key, type EtatTouche } from './Key';
import s from './ui.module.css';

export type OptionsClavier = {
  id: IdDisposition;
  /** caractères ouverts au palier courant : hors de cet ensemble, la touche est éteinte */
  ensemble: Set<string>;
  /** code de la touche cible — une seule à la fois (F5) */
  cible?: string;
  /**
   * SECONDE touche allumée, et le seul cas du MVP : la Maj contralatérale
   * quand le caractère visé ne s'obtient qu'en la tenant (palier 7).
   */
  cibleMaj?: string;
  /** dessiner les deux touches Maj (palier 7 seulement) */
  avecMaj?: boolean;
  /** code de la touche pressée à tort, assombrie 150-200 ms */
  fausse?: string;
  /** codes illuminés (nouvelles touches d'un palier, sur V5/V6) */
  illuminees?: Set<string>;
  /** codes déjà acquis (V6) */
  acquises?: Set<string>;
  /** bloc qui pulse au barreau 2 */
  blocPulse?: Main;
  /** afficher la barre d'espace détachée */
  espace?: { etat: 'eteint' | 'ouvert' | 'cible' | 'fausse'; pouce: Main };
  /** taille d'une touche : nombre de px, ou toute longueur CSS (clamp…) */
  taille?: number | string;
};

function etatDe(t: Touche, o: OptionsClavier): EtatTouche {
  if (o.fausse === t.code) return 'fausse';
  if (o.cible === t.code || o.cibleMaj === t.code) return 'cible';
  if (o.illuminees?.has(t.code)) return 'illuminee';
  if (o.acquises?.has(t.code)) return 'acquise';
  if (t.modificateur) return 'ouverte';
  // Une touche est de la leçon si ce qu'elle produit y est — directement OU
  // sous Maj : au palier 7, la rangée des chiffres AZERTY porte « 1 » en `maj`,
  // pas en `base`, et restait éteinte alors que la leçon la réclamait.
  // Dessinable ≠ proposable : morte, inerte (Retour arrière, ²) ⇒ toujours éteinte.
  if (!estProposable(t) || !t.base) return 'eteinte';
  if (o.ensemble.has(t.base) || (t.maj && o.ensemble.has(t.maj))) return 'ouverte';
  return 'eteinte';
}

/**
 * Cadenas = « cette touche arrive PLUS TARD ». Il ne se pose donc que sur une
 * touche dont un caractère appartient réellement au curriculum : `)`, `=` ou
 * `²` n'arrivent jamais, ils restent simplement éteints.
 */
function verrouilleeDe(t: Touche, ensemble: Set<string>, final: Set<string>): boolean {
  if (!estProposable(t)) return false;
  // rien de verrouillé sur une touche dont un caractère est DÉJÀ disponible
  if (ensemble.has(t.base ?? '') || ensemble.has(t.maj ?? '')) return false;
  const aVenir = (c?: string) => !!c && final.has(c);
  return aVenir(t.base) || aVenir(t.maj);
}

export function Keyboard(o: OptionsClavier) {
  const d = disposition(o.id);
  const taille = typeof o.taille === 'number' ? `${o.taille}px` : (o.taille ?? '46px');
  const final = toutesLesTouches(o.id);

  /**
   * UNE rangée = UNE ligne continue, comme sur le vrai clavier. Les touches de
   * chaque main y forment un SEGMENT (`data-bloc`) : les deux colonnes d'avant
   * ne pouvaient pas s'aligner — chaque colonne prenait la largeur de sa
   * rangée la plus large, et le trou à la jointure changeait d'une rangée à
   * l'autre (T|Y béant, B|N collé).
   */
  const segment = (main: Main, i: number) => {
    const touches = d.rangees[i].filter((t) => t.main === main && (o.avecMaj || !t.modificateur));
    return (
      <span
        className={[s.segment, o.blocPulse === main ? s.pulse : ''].filter(Boolean).join(' ')}
        data-bloc={main}
        data-pulse={o.blocPulse === main ? 'oui' : undefined}
      >
        {touches.map((t) => (
          <Key
            key={t.code}
            touche={t}
            etat={etatDe(t, o)}
            verrouillee={i === 0 && verrouilleeDe(t, o.ensemble, final)}
          />
        ))}
      </span>
    );
  };

  const rangee = (i: number) => (
    <div key={i} className={[s.rangee, s[`decalage${i}`] ?? ''].filter(Boolean).join(' ')}>
      {segment('gauche', i)}
      {segment('droite', i)}
    </div>
  );

  return (
    <div style={{ ['--taille' as string]: taille, ['--jeu' as string]: `calc(${taille} * 0.13)` }}>
      {/* Clavier d'un SEUL tenant : la séparation gauche/droite se lit dans la
          COULEUR des touches (teal / orange), plus dans un écart physique —
          l'enfant doit reconnaître son vrai clavier. */}
      <div className={s.clavier}>{d.rangees.map((_, i) => rangee(i))}</div>
      {o.espace && (
        <div className={s.zoneEspace}>
          <div
            data-code="Space"
            data-etat={o.espace.etat}
            className={[
              s.espace,
              o.espace.pouce === 'droite' ? s.espaceDroite : '',
              o.espace.etat === 'eteint' ? s.espaceEteint : '',
              o.espace.etat === 'cible' ? s.espaceCible : '',
              o.espace.etat === 'fausse' ? s.espaceFausse : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            espace
          </div>
        </div>
      )}
    </div>
  );
}
