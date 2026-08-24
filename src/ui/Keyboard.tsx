import { disposition, type IdDisposition, type Main, type Touche } from '../core/layouts';
import { Key, type EtatTouche } from './Key';
import s from './ui.module.css';

export type OptionsClavier = {
  id: IdDisposition;
  /** caractères ouverts au palier courant : hors de cet ensemble, la touche est éteinte */
  ensemble: Set<string>;
  /** code de la touche cible — une seule à la fois (F5) */
  cible?: string;
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
  /** étiquette de la frontière (V3 et V4) */
  etiquetteFrontiere?: string;
};

function etatDe(t: Touche, o: OptionsClavier): EtatTouche {
  if (o.fausse === t.code) return 'fausse';
  if (o.cible === t.code) return 'cible';
  if (o.illuminees?.has(t.code)) return 'illuminee';
  if (o.acquises?.has(t.code)) return 'acquise';
  if (t.base && !t.morte && o.ensemble.has(t.base)) return 'ouverte';
  return 'eteinte';
}

export function Keyboard(o: OptionsClavier) {
  const d = disposition(o.id);
  const taille = typeof o.taille === 'number' ? `${o.taille}px` : (o.taille ?? '46px');

  const rangeeDe = (main: Main, i: number) => {
    const touches = d.rangees[i].filter((t) => t.main === main);
    return (
      <div key={i} className={[s.rangee, s[`decalage${i}`] ?? ''].filter(Boolean).join(' ')}>
        {touches.map((t) => (
          <Key
            key={t.code}
            touche={t}
            etat={etatDe(t, o)}
            verrouillee={i === 0 && !!t.base && !o.ensemble.has(t.base) && !o.ensemble.has(t.maj ?? '')}
          />
        ))}
      </div>
    );
  };

  const bloc = (main: Main) => (
    <div
      className={[
        s.bloc,
        main === 'gauche' ? s.blocGauche : s.blocDroite,
        o.blocPulse === main ? s.pulse : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-bloc={main}
      data-pulse={o.blocPulse === main ? 'oui' : undefined}
    >
      {d.rangees.map((_, i) => rangeeDe(main, i))}
    </div>
  );

  return (
    <div style={{ ['--taille' as string]: taille, ['--jeu' as string]: `calc(${taille} * 0.13)` }}>
      <div className={s.clavier}>
        {bloc('gauche')}
        <div className={s.frontiere} aria-hidden="true">
          <span className={s.frontiereTrait} />
          {o.etiquetteFrontiere && <span className={s.frontiereEtiquette}>{o.etiquetteFrontiere}</span>}
        </div>
        {bloc('droite')}
      </div>
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
