import { TOUTES_DISPOSITIONS } from '../core/layouts';
import { CLE_CHOISIR } from '../core/profils';
import { motsPersoValides, type Reglages } from '../core/storage';
import { useApp, useEnvoi } from '../state';
import { MiniClavier } from '../ui/MiniClavier';
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
          {/* Réservé aux parents : c'est le seul chemin vers l'écran de compte. */}
          <div className={v.ligneReglage}>
            <span>
              <b>Notre compte</b>
              <br />
              <span className={v.promessePalier}>
                Pour retrouver la progression des enfants sur un autre ordinateur. Facultatif.
              </span>
            </span>
            <button className={v.petitBouton} onClick={() => envoi({ type: 'vue', vue: 'V9' })}>
              Ouvrir
            </button>
          </div>

          {/* Radios ILLUSTRÉS : on choisit un clavier en le reconnaissant. */}
          <div className={[v.ligneReglage, v.ligneClaviers].join(' ')}>
            <span>
              <b>Clavier</b>
              <br />
              <span className={v.promessePalier}>Celui que tu as sous les doigts.</span>
            </span>
            <div className={v.choixClaviers} role="radiogroup" aria-label="Clavier">
              {TOUTES_DISPOSITIONS.map((d) => (
                <button
                  key={d.id}
                  role="radio"
                  aria-checked={app.disposition === d.id}
                  className={[v.carteClavier, app.disposition === d.id ? v.carteClavierChoisie : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => envoi({ type: 'disposition', id: d.id, manuel: true })}
                >
                  <MiniClavier id={d.id} echelle={0.72} />
                  <span>{d.nom}</span>
                </button>
              ))}
            </div>
          </div>

          {/* « Notre leçon » : les mots de la famille, un par ligne (ou séparés
              par des virgules). Mode libre — même des lettres pas encore
              apprises. Le bouton apparaît sur la carte du clavier (V6). */}
          <div className={v.ligneReglage}>
            <span>
              <b>Nos mots à nous</b>
              <br />
              <span className={v.promessePalier}>
                Un mot par ligne. Ils deviennent « Notre leçon » sur la carte du clavier.
              </span>
            </span>
            <textarea
              className={v.champMots}
              aria-label="Nos mots à nous"
              rows={4}
              defaultValue={app.motsPerso.join('\n')}
              onBlur={(e) =>
                envoi({
                  type: 'motsPerso',
                  mots: motsPersoValides(e.target.value.split(/[\n,;]+/)),
                })
              }
            />
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
            <i
              className={v.puce}
              style={{ background: 'var(--teal-pale)', borderColor: 'var(--teal-moyen)' }}
            />
            main gauche
          </span>
          <span>
            <i
              className={v.puce}
              style={{ background: 'var(--orange-pale)', borderColor: 'var(--orange-moyen)' }}
            />
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
          <button
            className={u.lien}
            onClick={() => {
              try {
                sessionStorage.setItem(CLE_CHOISIR, '1');
              } catch {
                /* sans sessionStorage, le rechargement montrera le choix s'il y a plusieurs joueurs */
              }
              location.reload();
            }}
          >
            Changer de joueur
          </button>
        </div>
      </div>
    </div>
  );
}
