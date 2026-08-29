import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import type { IdDisposition } from './core/layouts';
import type { Liste } from './core/listes';
import { BLOC_MAX, charger, demanderPersistance, sauver, type Reglages, type Sauvegarde } from './core/storage';
import { listesDistantes, pousser, viderLaFile } from './core/sync';
import { cleDe } from './core/profils';
import { estMaitrisee, noterOccurrence, palierFranchi } from './core/progression';
import { PALIER_MAX } from './core/paliers';
import { encouragementSuivant } from './core/encouragements';

export type Vue = 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6' | 'V7' | 'V9';

/** Pourquoi l'app a changé de vue d'elle-même (V2 après incohérence, F7). */
export type RaisonVue = 'incoherence';

export type BilanBloc = {
  etoiles: number;
  /** CHAQUE occurrence tapée sans erreur ni aide (répétitions comprises) */
  propres: string[];
  /** items ayant atteint le barreau 2 ou 3, à réinjecter espacés */
  aRevoir: string[];
  /** items réellement validés pendant ce bloc, dans l'ordre */
  items: string[];
};

export type EtatApp = Sauvegarde & {
  vue: Vue;
  raisonVue?: RaisonVue;
  /** blocs enchaînés sans repasser par l'accueil */
  blocsConsecutifs: number;
  etoilesDuBloc: number;
  titreEncouragement: string;
  /** palier que ce bloc vient d'ouvrir, pour l'illumination de V5 */
  palierOuvert: number | null;
  aReinjecter: string[];
  /** items validés dans le bloc qui vient de se terminer (gain lexical de V5) */
  itemsDuBloc: string[];
  /** touches devenues maîtrisées PENDANT ce bloc (illumination de V5) */
  touchesNouvelles: string[];
  verrMaj: boolean;
  premierLancement: boolean;
  /** Le bloc courant joue « Notre leçon » (mots de la famille, mode libre). */
  blocPerso: boolean;
  /**
   * La bibliothèque du COMPTE, telle que le serveur la donne. Elle ne descend
   * pas dans la sauvegarde du profil : les deux enfants du foyer voient les
   * mêmes listes, et c'est le compte qui les possède (#9).
   */
  listes: Liste[];
  /** La liste que ce bloc fait taper, si l'enfant a appuyé sur une carte. */
  listeJouee: Liste | null;
};

export type Action =
  | { type: 'vue'; vue: Vue; raison?: RaisonVue }
  | { type: 'commencer'; perso?: boolean; liste?: Liste }
  | { type: 'listes'; listes: Liste[] }
  | { type: 'motsPerso'; mots: string[] }
  | { type: 'disposition'; id: IdDisposition; manuel: boolean }
  | { type: 'reglage'; cle: keyof Reglages; valeur: boolean }
  | { type: 'guideDoigtVu' }
  | { type: 'blocTermine'; bilan: BilanBloc }
  | { type: 'verrMaj'; actif: boolean };

export function reducer(etat: EtatApp, action: Action): EtatApp {
  switch (action.type) {
    case 'vue':
      return {
        ...etat,
        vue: action.vue,
        raisonVue: action.raison,
        blocsConsecutifs: action.vue === 'V1' ? 0 : etat.blocsConsecutifs,
      };

    case 'commencer': {
      /* `perso` absent = on garde le mode courant : depuis V5, « On continue ! »
         reste dans la leçon (perso ou non) que l'enfant était en train de jouer. */
      return {
        ...etat,
        vue: 'V4',
        premierLancement: false,
        palierOuvert: null,
        blocPerso: action.liste ? true : (action.perso ?? etat.blocPerso),
        /* Appuyer sur une carte impose SA liste. Un `perso` EXPLICITE annonce
           un nouveau départ — le parcours, ou « Notre leçon » et ses mots à
           elle — donc la carte d'avant est oubliée. Seule son ABSENCE veut
           dire « on continue » : c'est « On continue ! » de V5, qui rejoue la
           même liste. */
        listeJouee: action.liste ?? (action.perso === undefined ? etat.listeJouee : null),
      };
    }

    case 'listes':
      return { ...etat, listes: action.listes };

    case 'motsPerso':
      return { ...etat, motsPerso: action.mots };

    case 'disposition': {
      const change = action.id !== etat.disposition;
      return {
        ...etat,
        disposition: action.id,
        dispositionChoisieALaMain: action.manuel || etat.dispositionChoisieALaMain,
        // la maîtrise est indexée par caractère : changer de clavier repart proprement
        maitrise: change ? {} : etat.maitrise,
        palier: change ? Math.min(etat.palier, PALIER_MAX) : etat.palier,
        /* Les blocs déjà joués l'ont été sur l'AUTRE clavier : les garder au
           compteur ouvrait le palier suivant par le plafond anti-mur alors que
           rien n'avait été prouvé sur la nouvelle disposition. */
        blocsSurPalier: change ? 0 : etat.blocsSurPalier,
      };
    }

    case 'reglage':
      return { ...etat, reglages: { ...etat.reglages, [action.cle]: action.valeur } };

    case 'guideDoigtVu':
      return { ...etat, guideDoigtVu: true };

    case 'verrMaj':
      return etat.verrMaj === action.actif ? etat : { ...etat, verrMaj: action.actif };

    case 'blocTermine': {
      /* « Notre leçon » est HORS parcours : on tape nos mots pour le plaisir,
         sans avancer ni compter dans le palier (mode libre, lettres non
         enseignées comprises — rien n'y prouve la maîtrise du palier). */
      if (etat.blocPerso) {
        return {
          ...etat,
          vue: 'V5',
          bloc: Math.min(etat.bloc + 1, BLOC_MAX),
          blocsConsecutifs: etat.blocsConsecutifs + 1,
          etoilesDuBloc: action.bilan.etoiles,
          titreEncouragement: encouragementSuivant(etat.titreEncouragement),
          aReinjecter: [],
          itemsDuBloc: action.bilan.items,
          touchesNouvelles: [],
          palierOuvert: null,
        };
      }
      let maitrise = etat.maitrise;
      const dejaMaitrisees = new Set(Object.keys(maitrise).filter((c) => estMaitrisee(maitrise, c)));
      for (const c of action.bilan.propres) maitrise = noterOccurrence(maitrise, c, etat.bloc);
      // Ce que ce bloc-ci a fait basculer, et rien d'autre.
      const franchies = Object.keys(maitrise).filter(
        (c) => !dejaMaitrisees.has(c) && estMaitrisee(maitrise, c),
      );
      const blocsSurPalier = etat.blocsSurPalier + 1;
      const franchi = palierFranchi(etat.disposition, etat.palier, maitrise, blocsSurPalier);
      return {
        ...etat,
        vue: 'V5',
        maitrise,
        bloc: Math.min(etat.bloc + 1, BLOC_MAX),
        blocsSurPalier: franchi ? 0 : blocsSurPalier,
        palier: franchi ? etat.palier + 1 : etat.palier,
        palierOuvert: franchi ? etat.palier + 1 : null,
        blocsConsecutifs: etat.blocsConsecutifs + 1,
        etoilesDuBloc: action.bilan.etoiles,
        titreEncouragement: encouragementSuivant(etat.titreEncouragement),
        aReinjecter: action.bilan.aRevoir,
        itemsDuBloc: action.bilan.items,
        /* SEULES les touches nouvellement maîtrisées s'allument. Le repli sur
           « toutes les frappes propres du bloc » illuminait un clavier entier
           à chaque bloc et vidait le signal de son sens. */
        touchesNouvelles: franchies,
      };
    }
  }
}

/** Ce qui est réellement écrit sur disque, extrait de l'état de session. */
export function aSauvegarder(etat: EtatApp): Sauvegarde {
  return {
    version: 1,
    disposition: etat.disposition,
    dispositionChoisieALaMain: etat.dispositionChoisieALaMain,
    palier: etat.palier,
    blocsSurPalier: etat.blocsSurPalier,
    /* Le compteur de blocs est PERSISTÉ tel quel : le reconstruire depuis la
       seule maîtrise resservait le numéro d'un bloc joué sans aucune frappe
       propre, et deux blocs distincts comptaient alors pour un seul. */
    bloc: etat.bloc,
    maitrise: etat.maitrise,
    guideDoigtVu: etat.guideDoigtVu,
    reglages: etat.reglages,
    motsPerso: etat.motsPerso,
  };
}

export function etatDeDepart(cle?: string): EtatApp {
  const sauve = charger(cle);
  return {
    ...sauve,
    // Au tout premier lancement, on passe par le choix du clavier (cahier 4.1).
    vue: sauve.dispositionChoisieALaMain ? 'V1' : 'V2',
    blocsConsecutifs: 0,
    etoilesDuBloc: 0,
    titreEncouragement: encouragementSuivant(undefined),
    palierOuvert: null,
    aReinjecter: [],
    itemsDuBloc: [],
    touchesNouvelles: [],
    verrMaj: false,
    premierLancement: !sauve.dispositionChoisieALaMain,
    blocPerso: false,
    listes: [],
    listeJouee: null,
  };
}

const CtxEtat = createContext<EtatApp | null>(null);
const CtxDispatch = createContext<((a: Action) => void) | null>(null);

export function FournisseurApp({
  children,
  idProfil,
}: {
  children: ReactNode;
  /** Profil dont on charge et sauve la progression : son identifiant SERVEUR. */
  idProfil: string;
}) {
  const cle = cleDe(idProfil);
  const [etat, dispatch] = useReducer(reducer, cle, etatDeDepart);
  /* L'état tel qu'il sortait du stockage au montage : tant que le reducer
     renvoie le même objet, rien n'a changé et il n'y a rien à envoyer. */
  const auMontage = useRef(etat);

  /* Checkpoint : fin d'item ou de bloc, jamais à chaque frappe. La dépendance
     porte sur l'état ENTIER — le reducer renvoie l'objet inchangé quand rien ne
     bouge (verrMaj), et une liste de champs à tenir à jour finissait toujours
     par oublier le dernier ajouté. */
  useEffect(() => {
    const sauvegarde = aSauvegarder(etat);
    sauver(sauvegarde, cle);
    /* Rien joué encore : l'état vient d'être LU, le renvoyer avec un
       horodatage neuf ferait gagner cet appareil sur des préférences changées
       ailleurs il y a une minute. Ce qui restait à envoyer est dans la file,
       et l'effet ci-dessous la vide. */
    if (etat === auMontage.current) return;
    /* Envoi en ARRIÈRE-PLAN. `pousser` ne lève jamais : une leçon ne doit
       pas dépendre du réseau. */
    pousser(idProfil, sauvegarde);
  }, [etat, cle, idProfil]);

  /* Retour du réseau : on rejoue ce qui attendait. */
  useEffect(() => {
    const reprendre = () => void viderLaFile();
    window.addEventListener('online', reprendre);
    void viderLaFile();
    return () => window.removeEventListener('online', reprendre);
  }, []);

  /* La bibliothèque appartient au COMPTE : on va la chercher une fois le
     joueur monté, et l'espace parent la rafraîchit quand il s'ouvre. Un échec
     est silencieux — l'accueil ne montre alors que le parcours, et la leçon ne
     dépend jamais du réseau. */
  useEffect(() => {
    void listesDistantes()
      .then((listes) => dispatch({ type: 'listes', listes }))
      .catch(() => {});
  }, []);

  useEffect(() => demanderPersistance(), []);

  // Repère stable pour les tests e2e (et pour du CSS par vue si besoin).
  useEffect(() => {
    document.body.dataset.vue = etat.vue;
  }, [etat.vue]);

  useEffect(() => {
    const racine = document.documentElement;
    racine.dataset.espace = etat.reglages.texteEspace ? 'oui' : 'non';
    racine.dataset.animations = etat.reglages.animationsDouces ? 'oui' : 'non';
  }, [etat.reglages.texteEspace, etat.reglages.animationsDouces]);

  const envoi = useMemo(() => dispatch, [dispatch]);
  return (
    <CtxEtat.Provider value={etat}>
      <CtxDispatch.Provider value={envoi}>{children}</CtxDispatch.Provider>
    </CtxEtat.Provider>
  );
}

export function useApp(): EtatApp {
  const v = useContext(CtxEtat);
  if (!v) throw new Error('useApp hors FournisseurApp');
  return v;
}

export function useEnvoi(): (a: Action) => void {
  const v = useContext(CtxDispatch);
  if (!v) throw new Error('useEnvoi hors FournisseurApp');
  return v;
}
