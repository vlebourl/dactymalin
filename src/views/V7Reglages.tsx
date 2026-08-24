import { TOUTES_DISPOSITIONS } from '../core/layouts';
import type { Reglages } from '../core/storage';
import { useApp, useEnvoi } from '../state';
import v from './vues.module.css';
import u from '../ui/ui.module.css';

const INTERRUPTEURS: Array<{ cle: keyof Reglages; libelle: string; detail: string }> = [
  { cle: 'sons', libelle: 'Sons', detail: 'Un petit son quand la touche est la bonne.' },
  { cle: 'texteEspace', libelle: 'Texte plus espacé', detail: 'Plus d\'air entre les lettres.' },
  { cle: 'animationsDouces', libelle: 'Animations douces', detail: 'Les choses bougent tranquillement.' },
];

export function V7Reglages() {
  const app = useApp();
  const envoi = useEnvoi();

  return (
    <div className={v.ecran}>
      <header className={v.entete}>
        <button className={v.retour} onClick={() => envoi({ type: 'vue', vue: 'V1' })} aria-label="Revenir">
          ←
        </button>
        <span />
        <span />
      </header>

      <div className={v.centre}>
        <h1 className={v.titre} style={{ fontSize: 'clamp(28px, 3.4vw, 42px)' }}>
          Réglages
        </h1>

        <div className={v.reglages}>
          <div className={v.ligneReglage}>
            <span>
              <b>Clavier</b>
              <br />
              <span className={v.promessePalier}>Celui que tu as sous les doigts.</span>
            </span>
            <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TOUTES_DISPOSITIONS.map((d) => (
                <button
                  key={d.id}
                  className={[u.bouton, app.disposition === d.id ? u.primaire : ''].join(' ')}
                  style={{ padding: '9px 18px', fontSize: 14 }}
                  aria-pressed={app.disposition === d.id}
                  onClick={() => envoi({ type: 'disposition', id: d.id, manuel: true })}
                >
                  {d.nomCourt}
                </button>
              ))}
            </span>
          </div>

          {INTERRUPTEURS.map((r) => (
            <div key={r.cle} className={v.ligneReglage}>
              <span>
                <b>{r.libelle}</b>
                <br />
                <span className={v.promessePalier}>{r.detail}</span>
              </span>
              <button
                role="switch"
                aria-checked={app.reglages[r.cle]}
                aria-label={r.libelle}
                className={[v.interrupteur, app.reglages[r.cle] ? v.interrupteurActif : ''].join(' ')}
                onClick={() => envoi({ type: 'reglage', cle: r.cle, valeur: !app.reglages[r.cle] })}
              />
            </div>
          ))}
        </div>

        {/* Seul endroit hors onboarding où la légende des couleurs apparaît. */}
        <p className={v.legendeCouleurs}>
          <span>
            <i className={v.puce} style={{ background: 'var(--teal-vif)' }} />
            main gauche
          </span>
          <span>
            <i className={v.puce} style={{ background: 'var(--orange-vif)' }} />
            main droite
          </span>
        </p>

        <div className={v.liens}>
          <button className={u.lien} onClick={() => envoi({ type: 'vue', vue: 'V3' })}>
            Revoir : où mettre mes doigts
          </button>
          <button className={u.lien} onClick={() => envoi({ type: 'vue', vue: 'V4' })}>
            Refaire une leçon à quatre doigts
          </button>
        </div>
      </div>
    </div>
  );
}
