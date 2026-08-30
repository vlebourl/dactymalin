import { useMemo } from 'react';
import { motsNouveaux } from '../core/corpus';
import { toucheDirecte, toucheMaj } from '../core/layouts';
import { ensembleTouches, ETAPE_MAX, nouvellesTouches } from '../core/parcours';
import { PROPOSITION_PAUSE } from '../core/encouragements';
import { Keyboard } from '../ui/Keyboard';
import { Stars } from '../ui/Stars';
import { useApp, useEnvoi } from '../state';
import v from './vues.module.css';
import u from '../ui/ui.module.css';

export function V5FinDeBloc() {
  const app = useApp();
  const envoi = useEnvoi();
  const id = app.disposition;

  /* Le gain lexical est tiré du bloc RÉELLEMENT joué : trois items au hasard
     parmi ceux que l'enfant vient de valider. Repli sur les mots que le palier
     vient d'ouvrir uniquement si le bloc n'a rien laissé (bloc abandonné). */
  const gains = useMemo(() => {
    const joues = [...new Set(app.itemsDuBloc)];
    const source = joues.length >= 3 ? joues : motsNouveaux(id, app.palierOuvert ?? app.palier);
    return [...source].sort(() => Math.random() - 0.5).slice(0, 3);
    // un tirage par arrivée sur la vue, pas à chaque rendu
  }, [app.itemsDuBloc, app.bloc]); // eslint-disable-line react-hooks/exhaustive-deps

  // Seules les touches NOUVELLEMENT maîtrisées s'allument.
  const illuminees = new Set(
    app.touchesNouvelles
      .map((c) => (toucheDirecte(id, c) ?? toucheMaj(id, c))?.code)
      .filter((c): c is string => !!c),
  );
  const proposePause = app.blocsConsecutifs >= 4;

  /* Franchir un palier était MUET : le même titre d'encouragement que pour un
     bloc ordinaire, le même bouton « Encore ». L'état portait pourtant déjà
     l'information — `palierOuvert` vaut le nouveau palier à cet instant précis
     et ne servait qu'à choisir les touches à illuminer. On la dit. */
  /* `palierOuvert` porte le numéro de la nouvelle ÉTAPE. L'appeler « leçon »
     ici contredisait la phrase juste en dessous, qui disait « étape ». */
  const nouvelleEtape = app.palierOuvert;
  /* Ce que la leçon APPORTE, pas tout ce qu'elle contient : `libellesEnsemble`
     rend le cumul depuis le palier 1 et aurait annoncé des touches déjà
     acquises comme des nouveautés. L'espace n'est pas une nouveauté à fêter. */
  const touchesDeLaLecon = nouvelleEtape
    ? nouvellesTouches(app.parcours, id, nouvelleEtape).filter((c) => c !== ' ')
    : [];

  return (
    <div className={v.ecran}>
      <div className={v.centre}>
        <h1 className={v.titre}>
          {nouvelleEtape ? `Étape ${nouvelleEtape} débloquée !` : app.titreEncouragement}
        </h1>

        <Stars nombre={app.etoilesDuBloc} />

        {nouvelleEtape && (
          <p className={v.gainLexical}>
            Tu passes à l'étape <b>{nouvelleEtape}</b> sur {ETAPE_MAX}. Elle t'apporte :{' '}
            <b>{touchesDeLaLecon.join(' ')}</b>
          </p>
        )}

        {gains.length > 0 && (
          <p className={v.gainLexical}>
            Tu écris maintenant : <b>{gains.join(', ')}</b>
          </p>
        )}

        <Keyboard
          id={id}
          ensemble={ensembleTouches(app.parcours, id, app.palier)}
          illuminees={illuminees}
          taille="clamp(13px, 3.4vw, 42px)"
        />

        {proposePause && <p className={v.pause}>{PROPOSITION_PAUSE}</p>}

        <div className={v.deuxBoutons}>
          <button
            className={[u.bouton, proposePause ? '' : u.primaire].join(' ')}
            onClick={() => envoi({ type: 'commencer' })}
          >
            {nouvelleEtape ? `Commencer l'étape ${nouvelleEtape}` : 'Encore'}
          </button>
          <button
            className={[u.bouton, proposePause ? u.primaire : ''].join(' ')}
            onClick={() => envoi({ type: 'vue', vue: 'V1' })}
          >
            Retour
          </button>
        </div>

        <button className={u.lien} onClick={() => envoi({ type: 'vue', vue: 'V6' })}>
          Ma carte du clavier
        </button>
      </div>
    </div>
  );
}
