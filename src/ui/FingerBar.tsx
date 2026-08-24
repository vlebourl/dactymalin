import type { Main } from '../core/layouts';
import s from './ui.module.css';

/** Quatre états de guide-doigt, et quatre seulement (addendum). */
export type Doigt = 'index_gauche' | 'pouce_gauche' | 'pouce_droit' | 'index_droit';

type Pastille = {
  doigt: Doigt;
  etiquette: string;
  main: Main;
  /** recadrage commun : les 4 photos n'ont pas le même cadrage d'origine */
  zoom: number;
  decale: string;
};

const PASTILLES: Pastille[] = [
  { doigt: 'index_gauche', etiquette: 'index gauche', main: 'gauche', zoom: 1, decale: '0' },
  { doigt: 'pouce_gauche', etiquette: 'pouce gauche', main: 'gauche', zoom: 1.18, decale: '6%' },
  { doigt: 'pouce_droit', etiquette: 'pouce droit', main: 'droite', zoom: 1.14, decale: '5%' },
  { doigt: 'index_droit', etiquette: 'index droit', main: 'droite', zoom: 1, decale: '0' },
];

export const CONSIGNES: Record<Doigt, [string, string]> = {
  index_gauche: ['Main gauche', 'ton index'],
  pouce_gauche: ['Main gauche', 'ton pouce'],
  pouce_droit: ['Main droite', 'ton pouce'],
  index_droit: ['Main droite', 'ton index'],
};

/**
 * Zone 3 : bande basse permanente, pleine largeur, séparée du clavier par un
 * liseré. Photographies détourées, pas des pictogrammes.
 */
export function FingerBar({ actif }: { actif: Doigt | null }) {
  const [main, doigt] = actif ? CONSIGNES[actif] : ['Pose tes mains', 'de chaque côté'];
  return (
    <div className={s.bande} data-doigt={actif ?? 'aucun'}>
      <p className={s.consigneMain}>
        <b>{main}</b>
        <br />· {doigt}
      </p>
      <div className={s.pastilles}>
        {PASTILLES.map((p) => {
          const estActive = p.doigt === actif;
          return (
            <div
              key={p.doigt}
              className={[s.pastille, estActive ? s.pastilleActive : s.pastilleInactive].join(' ')}
              data-pastille={p.doigt}
              data-active={estActive ? 'oui' : 'non'}
            >
              <div className={[s.rond, p.main === 'droite' ? s.rondDroite : ''].join(' ')}>
                <img
                  src={`/doigts/${p.doigt}.png`}
                  srcSet={`/doigts/${p.doigt}.png 1x, /doigts/${p.doigt}@2x.png 2x`}
                  alt=""
                  style={{ ['--zoom' as string]: p.zoom, ['--decale' as string]: p.decale }}
                />
              </div>
              <span className={s.etiquettePastille}>{p.etiquette}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
