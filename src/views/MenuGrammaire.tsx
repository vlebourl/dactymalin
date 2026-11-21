import { EXERCICES_GRAMMAIRE, type IdExercice } from '../core/grammaire';
import v from './vues.module.css';
import u from '../ui/ui.module.css';

/* Le repère data-vue vient de `repereVue` (FournisseurApp) : ne pas le poser ici.
   Un bouton par exercice de EXERCICES_GRAMMAIRE : seuls les exercices jouables
   figurent ici. */
export function MenuGrammaire({
  onChoix,
  changerDeMode,
}: {
  onChoix: (id: IdExercice) => void;
  changerDeMode: () => void;
}) {
  return (
    <div className={v.ecran}>
      <div className={v.centre}>
        <h1 className={v.titre}>Quel exercice ?</h1>
        {EXERCICES_GRAMMAIRE.map((e) => (
          <button
            key={e.id}
            className={[u.bouton, u.primaire, u.geant].join(' ')}
            onClick={() => onChoix(e.id)}
          >
            <strong>{e.titre}</strong>
            <br />
            <span>{e.consigne}</span>
          </button>
        ))}
        <button className={u.bouton} onClick={changerDeMode}>
          Changer de mode
        </button>
      </div>
    </div>
  );
}
