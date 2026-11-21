import { useEffect, useRef, useState } from 'react';
import {
  PHRASES_PAR_SERIE,
  phraseSuivante,
  repondre,
  serieFinie,
  type Categorie,
  type PhraseGrammaire,
  type Serie,
} from '../core/grammaire';
import { useApp } from '../state';
import { sonItem } from '../ui/son';
import u from '../ui/ui.module.css';
import v from './vues.module.css';

const CHOIX: { categorie: Categorie; libelle: string }[] = [
  { categorie: 'passe', libelle: 'Passé' },
  { categorie: 'present', libelle: 'Présent' },
  { categorie: 'futur', libelle: 'Futur' },
];
const libelle = (c: Categorie) => CHOIX.find((x) => x.categorie === c)!.libelle;

/* Bonne réponse : la phrase suivante arrive seule après ce délai. Mauvaise :
   l'enfant a besoin de regarder la bonne réponse, il appuie sur « Suivant ». */
const DELAI_SUIVANTE_MS = 1200;

const SERIE_VIDE: Serie = { faites: 0, justes: 0, courante: null, reponse: null };

export function VGrammaire({
  changerDeMode,
  autreExercice,
}: {
  changerDeMode: () => void;
  autreExercice: () => void;
}) {
  const app = useApp();
  const [serie, setSerie] = useState<Serie>(SERIE_VIDE);
  const [indisponible, setIndisponible] = useState(false);
  const vues = useRef(new Set<string>());
  /* Phrase d'après, demandée dès qu'une phrase s'affiche. */
  const suivante = useRef<Promise<PhraseGrammaire | null> | null>(null);
  const minuteur = useRef<number | undefined>(undefined);

  const demander = () => (suivante.current ??= phraseSuivante(vues.current));

  /* Prend la phrase préchargée (ou la demande) et l'affiche. Le `.then` ne
     vide la réserve que si elle contient encore CETTE promesse : le double
     montage de StrictMode ne consomme ainsi qu'une phrase. */
  const afficherSuivante = (repart: Serie) => {
    const p = demander();
    void p.then((phrase) => {
      if (suivante.current === p) suivante.current = null;
      if (!phrase) return setIndisponible(true);
      setSerie({ ...repart, courante: phrase, reponse: null });
    });
  };

  useEffect(() => {
    afficherSuivante(SERIE_VIDE);
    return () => window.clearTimeout(minuteur.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const courante = serie.courante;
  useEffect(() => {
    if (courante && serie.faites < PHRASES_PAR_SERIE - 1) void demander();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courante]);

  const avancer = (s: Serie) => {
    if (serieFinie(s)) setSerie({ ...s, courante: null, reponse: null });
    else afficherSuivante(s);
  };

  const choisir = (choix: Categorie) => {
    const apres = repondre(serie, choix);
    if (apres === serie) return;
    setSerie(apres);
    if (choix === serie.courante!.categorie) {
      sonItem(app.reglages.sons);
      minuteur.current = window.setTimeout(() => avancer(apres), DELAI_SUIVANTE_MS);
    }
  };

  const encore = () => {
    setSerie(SERIE_VIDE);
    afficherSuivante(SERIE_VIDE);
  };

  if (indisponible) {
    return (
      <div className={v.ecran}>
        <div className={v.centre}>
          <p className={v.sousTitre}>Les phrases ne sont pas disponibles pour le moment.</p>
          <button className={[u.bouton, u.primaire, u.geant].join(' ')} onClick={changerDeMode}>
            Changer de mode
          </button>
        </div>
      </div>
    );
  }

  if (!courante) {
    if (!serieFinie(serie)) return <div aria-busy="true" />;
    return (
      <div className={v.ecran}>
        <div className={v.centre}>
          <p className={v.phraseGrammaire}>
            {serie.justes} / {PHRASES_PAR_SERIE}
          </p>
          <button className={[u.bouton, u.primaire, u.geant].join(' ')} onClick={encore}>
            Encore
          </button>
          <button className={u.bouton} onClick={autreExercice}>
            Autre exercice
          </button>
          <button className={u.bouton} onClick={changerDeMode}>
            Changer de mode
          </button>
        </div>
      </div>
    );
  }

  const juste = serie.reponse === courante.categorie;
  return (
    <div className={v.ecran}>
      <div className={v.centre}>
        <p className={v.sousTitre}>
          Phrase {serie.faites + (serie.reponse ? 0 : 1)} sur {PHRASES_PAR_SERIE}
        </p>
        <p className={v.phraseGrammaire}>{courante.phrase}</p>
        <div className={v.choixGrammaire}>
          {CHOIX.map(({ categorie, libelle: l }) => {
            const marque = serie.reponse && categorie === courante.categorie;
            const rate = serie.reponse === categorie && !juste;
            return (
              <button
                key={categorie}
                className={[
                  u.bouton,
                  u.geant,
                  marque ? v.choixJuste : '',
                  rate ? v.choixRate : '',
                ].join(' ')}
                aria-pressed={serie.reponse === categorie}
                data-juste={marque ? 'oui' : undefined}
                onClick={() => choisir(categorie)}
              >
                {marque ? '✓ ' : rate ? '✗ ' : ''}
                {l}
              </button>
            );
          })}
        </div>
        <p className={v.retourGrammaire} role="status">
          {serie.reponse
            ? juste
              ? 'Bravo !'
              : `C'était : ${libelle(courante.categorie)}`
            : ''}
        </p>
        {serie.reponse && !juste && (
          <button
            className={[u.bouton, u.primaire, u.geant].join(' ')}
            onClick={() => avancer(serie)}
          >
            Suivant
          </button>
        )}
      </div>
    </div>
  );
}
