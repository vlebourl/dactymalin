import { useEffect, useState } from 'react';
import { verdictCarteClavier, verdictFrappe } from '../core/detect';
import { disposition, TOUTES_DISPOSITIONS, type IdDisposition } from '../core/layouts';
import { useKeyInput } from '../hooks/useKeyInput';
import { useApp, useEnvoi } from '../state';
import { MiniClavier } from '../ui/MiniClavier';
import { SpeakerButton } from '../ui/SpeakerButton';
import v from './vues.module.css';
import u from '../ui/ui.module.css';

const CONSIGNE = 'Appuie sur la touche A';

export function V2Clavier({ raison }: { raison?: 'incoherence' }) {
  const app = useApp();
  const envoi = useEnvoi();
  const [detectee, setDetectee] = useState<IdDisposition | null>(
    app.dispositionChoisieALaMain ? app.disposition : null,
  );
  /* Une carte cochée doit toujours DIRE d'où vient le verdict : au premier
     lancement, rien n'est coché tant qu'une frappe ou la carte du navigateur
     n'a pas tranché. */
  const [source, setSource] = useState<'carte' | 'frappe' | null>(
    app.dispositionChoisieALaMain ? 'frappe' : null,
  );

  // 1. carte du clavier du navigateur → verdict silencieux
  useEffect(() => {
    if (app.dispositionChoisieALaMain) return;
    let vivant = true;
    void verdictCarteClavier().then((verdict) => {
      if (vivant && verdict?.sur) {
        setDetectee(verdict.id);
        setSource((s) => s ?? 'carte');
      }
    });
    return () => {
      vivant = false;
    };
  }, [app.dispositionChoisieALaMain]);

  // 2. sinon (ou en plus), le test déguisé : une frappe suffit
  useKeyInput(true, (f) => {
    const verdict = verdictFrappe(f.code, f.key);
    if (verdict) {
      setDetectee(verdict.id);
      setSource('frappe');
    }
  });

  const consigne =
    raison === 'incoherence'
      ? 'Tes touches ne sont pas là où je croyais. Appuie sur la touche A.'
      : source === 'carte'
        ? 'Je crois avoir reconnu ton clavier. Appuie sur la touche A pour vérifier.'
        : CONSIGNE;

  const choisir = (id: IdDisposition) => {
    envoi({ type: 'disposition', id, manuel: true });
    envoi({ type: 'vue', vue: app.guideDoigtVu ? 'V1' : 'V3' });
  };

  return (
    <div className={v.ecran}>
      <header className={v.entete}>
        {app.dispositionChoisieALaMain ? (
          <button className={v.retour} onClick={() => envoi({ type: 'vue', vue: 'V1' })} aria-label="Revenir">
            ←
          </button>
        ) : (
          <span />
        )}
        <span />
        <span />
      </header>

      <div className={v.centre}>
        <h1 className={v.titre}>Regarde ton vrai clavier</h1>
        <p className={v.consigneGeante}>
          {consigne}
          <SpeakerButton texte={consigne} libelle="Écouter la consigne" />
        </p>

        <div className={v.cartes}>
          {TOUTES_DISPOSITIONS.map((d) => (
            <div
              key={d.id}
              className={[v.carte, detectee === d.id ? v.carteDetectee : ''].join(' ')}
              data-disposition={d.id}
              data-detectee={detectee === d.id ? 'oui' : 'non'}
            >
              <strong>{d.nom}</strong>
              <MiniClavier id={d.id} />
              <span className={v.coche}>
                {detectee !== d.id
                  ? ' '
                  : source === 'carte'
                    ? 'je crois que c\'est celui-là'
                    : "c'est celui-là"}
              </span>
              <button className={[u.bouton, detectee === d.id ? u.primaire : ''].join(' ')} onClick={() => choisir(d.id)}>
                C'est celui-là
              </button>
            </div>
          ))}
        </div>

        <p className={v.explication}>
          {detectee ? disposition(detectee).explication : 'Appuie sur une touche : je reconnais ton clavier tout seul.'}
        </p>
      </div>
    </div>
  );
}

