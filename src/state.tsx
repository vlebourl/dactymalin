import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import type { IdDisposition } from './core/layouts';
import type { Liste } from './core/listes';
import {
  BLOC_MAX,
  charger,
  cleProgression,
  demanderPersistance,
  miroirLegacy,
  MODELE,
  progressionDe,
  sauver,
  type Progressions,
  type Reglages,
  type Sauvegarde,
} from './core/storage';
import { listesDistantes, MARQUEUR_RATTACHEMENT, pousser, viderLaFile } from './core/sync';
import { cleDe } from './core/profils';
import { estMaitrisee, noterOccurrence } from './core/progression';
import { etapeFinie, ETAPE_MAX, LECONS_PAR_ETAPE, parcoursFini, type IdParcours } from './core/parcours';
import { encouragementSuivant } from './core/encouragements';
import { LECONS_SANS_REPETITION } from './core/generator';
import { enregistrer, type RapportLecon } from './core/mesures';

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
  /**
   * Ce que la leçon a OBSERVÉ (§4.7), ou rien si la vue ne compte pas encore.
   * Optionnel à dessein : l'observation ne doit jamais être une condition pour
   * que la leçon se termine et que la progression s'enregistre.
   */
  mesures?: RapportLecon;
  /**
   * Instant EPOCH où la leçon s'est close. C'est lui, et rien d'autre, qui
   * date la dernière leçon dans la sauvegarde : sans lui, la révision du
   * retour (§7.4) ne se déclenchait jamais ailleurs que dans ses tests.
   */
  fin: number;
};

/**
 * L'état de SESSION parle le vocabulaire de la v2 — étape, leçon — là où la
 * `Sauvegarde` garde le sien : ses noms sont le format de fil que des clients
 * plus anciens savent lire, et les renommer casserait leur lecture. Les trois
 * champs concernés sont donc retirés puis redéclarés ici, et `aSauvegarder`
 * fait la traduction dans un seul endroit.
 */
export type EtatApp = Omit<Sauvegarde, 'palier' | 'blocsSurPalier' | 'bloc'> & {
  /** Étape courante du parcours joué. */
  etape: number;
  /** Leçons déjà faites dans cette étape. */
  leconsSurEtape: number;
  /** Numéro de la prochaine leçon, monotone : sert à répartir les occurrences. */
  lecon: number;
  /**
   * Le parcours JOUÉ, choisi par le parent en V7 (#42). Il n'est plus
   * optionnel ici : dans l'état de session, il y a toujours un parcours en
   * cours, et `etape` / `leconsSurEtape` sont l'étape et les leçons DE
   * CELUI-LÀ — plus forcément celles de Découverte.
   */
  parcours: IdParcours;
  vue: Vue;
  raisonVue?: RaisonVue;
  etoilesDuBloc: number;
  titreEncouragement: string;
  /** palier que ce bloc vient d'ouvrir, pour l'illumination de V5 */
  etapeOuverte: number | null;
  /** Le parcours vient d'être terminé À L'INSTANT : V5 le fête une fois.
      Transitoire — un rechargement ne doit pas rejouer la célébration. */
  parcoursTermineMaintenant: boolean;
  /** Étape que l'enfant a choisi de rejouer, ou `null` pour son étape courante.
      Jamais persistée : c'est un choix du moment, pas un acquis. */
  etapeRejouee: number | null;
  aReinjecter: string[];
  /** items validés dans le bloc qui vient de se terminer (gain lexical de V5) */
  itemsDuBloc: string[];
  /** touches devenues maîtrisées PENDANT ce bloc (illumination de V5) */
  touchesNouvelles: string[];
  verrMaj: boolean;
  premierLancement: boolean;
  /**
   * La bibliothèque du COMPTE, telle que le serveur la donne. Elle ne descend
   * pas dans la sauvegarde du profil : les deux enfants du foyer voient les
   * mêmes listes, et c'est le compte qui les possède (#9).
   */
  listes: Liste[];
  /**
   * La liste que ce bloc fait taper, ou `null` pour le parcours. Depuis que
   * l'ancienne liste unique a disparu (#12), c'est le SEUL état du mode : un
   * drapeau « bloc perso » à côté pouvait se désynchroniser d'elle, et l'a
   * fait — « Notre leçon » rejouait alors la carte d'avant.
   */
  listeJouee: Liste | null;
};

export type Action =
  | { type: 'vue'; vue: Vue; raison?: RaisonVue }
  /**
   * `liste` absent = on continue ce qu'on jouait (« On continue ! » de V5) ;
   * une liste = on joue celle-là ; `null` = on revient au parcours.
   */
  | { type: 'commencer'; liste?: Liste | null }
  | { type: 'listes'; listes: Liste[] }
  | { type: 'disposition'; id: IdDisposition; manuel: boolean }
  | { type: 'reglage'; cle: keyof Reglages; valeur: boolean }
  | { type: 'parcours'; parcours: IdParcours }
  /* Rejouer une étape DÉJÀ FINIE, à l'initiative de l'enfant. C'est un choix,
     jamais un verdict : rien n'est retiré, rien n'est compté, et l'app ne le
     propose pas d'elle-même. */
  | { type: 'rejouerEtape'; etape: number }
  | { type: 'guideDoigtVu' }
  | { type: 'leconTerminee'; bilan: BilanBloc }
  | { type: 'verrMaj'; actif: boolean };

export function reducer(etat: EtatApp, action: Action): EtatApp {
  switch (action.type) {
    case 'vue':
      return {
        ...etat,
        vue: action.vue,
        raisonVue: action.raison,
      };

    case 'commencer':
      return {
        ...etat,
        vue: 'V4',
        premierLancement: false,
        etapeOuverte: null,
    parcoursTermineMaintenant: false,
        /* Appuyer sur une carte impose SA liste ; « On commence ! » passe
           `null` et revient au parcours ; « On continue ! » n'envoie rien et
           rejoue ce qui était en cours. */
        listeJouee: action.liste !== undefined ? action.liste : etat.listeJouee,
        /* « On commence ! » revient au parcours, donc à l'étape courante : une
           étape rejouée ne survit pas au retour à l'accueil. */
        etapeRejouee: action.liste !== undefined ? null : etat.etapeRejouee,
      };

    /* Une étape rejouée ne touche NI la progression, NI les leçons faites : on
       la joue « à côté », et la séance suivante repart d'où l'enfant en était.
       Sans cela, rejouer serait une régression déguisée. */
    case 'rejouerEtape':
      return {
        ...etat,
        vue: 'V4',
        etapeRejouee: action.etape,
        listeJouee: null,
        etapeOuverte: null,
    parcoursTermineMaintenant: false,
      };

    case 'listes':
      return { ...etat, listes: action.listes };

    case 'disposition': {
      const change = action.id !== etat.disposition;
      return {
        ...etat,
        disposition: action.id,
        dispositionChoisieALaMain: action.manuel || etat.dispositionChoisieALaMain,
        // la maîtrise est indexée par caractère : changer de clavier repart proprement
        maitrise: change ? {} : etat.maitrise,
        /* Le parcours v2 compte DIX étapes ; borner ici sur l'ancien maximum
           de sept rétrogradait un enfant arrivé aux chiffres dès qu'il changeait
           de clavier. `PALIER_MAX` ne vaut plus que pour le miroir destiné aux
           clients d'avant, jamais pour la progression vécue. */
        etape: change ? Math.min(etat.etape, ETAPE_MAX) : etat.etape,
        /* Les blocs déjà joués l'ont été sur l'AUTRE clavier : les garder au
           compteur ouvrait le palier suivant par le plafond anti-mur alors que
           rien n'avait été prouvé sur la nouvelle disposition. */
        leconsSurEtape: change ? 0 : etat.leconsSurEtape,
      };
    }

    case 'reglage':
      return { ...etat, reglages: { ...etat.reglages, [action.cle]: action.valeur } };

    /* Les deux parcours sont indépendants et parallèles (cahier §4.2). Basculer
       n'est donc ni une reprise ni une remise à zéro : on RANGE la progression
       du parcours qu'on quitte dans son couple, et on SORT celle du parcours
       qu'on prend. Rien ne s'écrase, dans aucun des deux sens. */
    case 'parcours': {
      if (action.parcours === etat.parcours) return etat;
      const progressions = rangerProgression(etat);
      const p = progressionDe({ progressions }, action.parcours, etat.disposition);
      return {
        ...etat,
        parcours: action.parcours,
        progressions,
        etape: p.etape,
        leconsSurEtape: p.leconsSurEtape,
        /* Les items à revoir viennent de la leçon de l'AUTRE parcours : les
           réinjecter ici ferait taper des touches que celui-ci n'a pas encore
           ouvertes. Le souvenir des exercices récents part pour la même
           raison : les deux parcours puisent dans le même lexique, et garder
           celui d'à côté interdirait ici des mots que cet enfant n'a jamais vus
           dans ce parcours-là. */
        aReinjecter: [],
        exercicesRecents: undefined,
        etapeOuverte: null,
    parcoursTermineMaintenant: false,
      };
    }

    case 'guideDoigtVu':
      return { ...etat, guideDoigtVu: true };

    case 'verrMaj':
      return etat.verrMaj === action.actif ? etat : { ...etat, verrMaj: action.actif };

    case 'leconTerminee': {
      /* Une LISTE est hors parcours : on tape les mots de la maison pour le
         plaisir, sans avancer ni compter dans le palier. Elle peut contenir
         des lettres que l'enfant n'a pas apprises — rien de ce qu'il tape là
         ne prouve la maîtrise de son palier. */
      if (etat.listeJouee) {
        return {
          ...etat,
          vue: 'V5',
          /* Une liste ne compte pas dans le parcours, mais l'enfant a bien tapé
             aujourd'hui : le faire réviser demain comme après quinze jours
             d'absence serait faux. */
          derniereLecon: action.bilan.fin,
          lecon: Math.min(etat.lecon + 1, BLOC_MAX),
          etoilesDuBloc: action.bilan.etoiles,
          titreEncouragement: encouragementSuivant(etat.titreEncouragement),
          aReinjecter: [],
          itemsDuBloc: action.bilan.items,
          touchesNouvelles: [],
          etapeOuverte: null,
    parcoursTermineMaintenant: false,
        };
      }
      let maitrise = etat.maitrise;
      const dejaMaitrisees = new Set(Object.keys(maitrise).filter((c) => estMaitrisee(maitrise, c)));
      for (const c of action.bilan.propres) maitrise = noterOccurrence(maitrise, c, etat.lecon);
      // Ce que ce bloc-ci a fait basculer, et rien d'autre.
      const franchies = Object.keys(maitrise).filter(
        (c) => !dejaMaitrisees.has(c) && estMaitrisee(maitrise, c),
      );
      /* #38 : l'étape est finie après sept leçons, et par rien d'autre.
         Le critère de maîtrise ne commande plus le passage — il compose le
         contenu (#39). Le plafond anti-mur disparaît avec lui : sans porte, il
         n'y a plus de mur à forcer. */
      const leconsSurEtape = etat.leconsSurEtape + 1;
      /* REJOUER n'est pas rattraper. L'étape rejouée se joue « à côté » : elle
         ne compte pas dans le quota de l'étape courante, sans quoi un enfant à
         6 leçons sur 7 de l'étape 5 débloquerait l'étape 6 en refaisant
         l'étape 2 — la progression avancerait sur un contenu déjà acquis.
         Ce qu'il a tapé reste vrai pour autant : la maîtrise et les mesures
         enregistrent ce qui s'est passé, sous le numéro de l'étape JOUÉE. */
      const rejoue = etat.etapeRejouee !== null;
      /* L'étiquette de parcours et l'étape sont posées ICI, pas par la vue :
         c'est l'état qui sait dans quelle série la leçon doit tomber, et une
         vue qui se tromperait d'étiquette mélangerait les deux courbes — le
         seul accident que §4.7 interdit absolument. */
      const mesures = action.bilan.mesures
        ? enregistrer(etat.mesures ?? {}, etat.parcours, {
            ...action.bilan.mesures,
            etape: etat.etapeRejouee ?? etat.etape,
            /* L'instant de clôture, posé ICI comme l'étiquette de parcours :
               c'est ce qui distingue cette leçon de celle d'un autre appareil,
               et donc ce qui permet de réunir les deux séries sans en jeter
               une (#64). Le reducer de la leçon est pur et ne connaît pas
               l'heure ; le bilan, lui, la porte déjà. */
            le: action.bilan.fin,
          })
        : etat.mesures;
      /* §7.2 : les exercices de cette leçon attendent leur tour pendant les
         deux suivantes. On ne garde que `LECONS_SANS_REPETITION - 1` lots :
         un historique sans fin ferait enfler la sauvegarde et finirait par
         interdire tout le corpus de l'étape. */
      const exercicesRecents = (
        action.bilan.items.length
          ? [...(etat.exercicesRecents ?? []), action.bilan.items]
          : /* Une leçon où l'enfant n'a rien validé — il est parti, le chrono a
               fini seul — n'a rien servi. Y pousser un lot VIDE chasserait une
               vraie leçon du souvenir, et deux départs d'affilée effaçaient la
               règle d'écart sans que rien ne le dise. */
            (etat.exercicesRecents ?? [])
      ).slice(-(LECONS_SANS_REPETITION - 1));
      const franchi = !rejoue && etapeFinie(leconsSurEtape) && etat.etape < ETAPE_MAX;
      /* À la DIXIÈME étape il n'y a pas d'étape suivante à ouvrir, et le
         compteur montait donc à 8, 9, 10 sans fin : le parcours ne se
         terminait jamais, et la carte, qui ne dit « finie » que d'une étape
         dépassée, laissait l'étape 10 éternellement courante et jamais
         rejouable. On plafonne, et le plafond EST la fin. */
      const leconsRetenues = rejoue
        ? etat.leconsSurEtape
        : franchi
          ? 0
          : etat.etape >= ETAPE_MAX
            ? Math.min(leconsSurEtape, LECONS_PAR_ETAPE)
            : leconsSurEtape;
      const termineMaintenant =
        parcoursFini(etat.etape, leconsRetenues) &&
        !parcoursFini(etat.etape, etat.leconsSurEtape);
      return {
        ...etat,
        vue: 'V5',
        maitrise,
        mesures,
        exercicesRecents,
        derniereLecon: action.bilan.fin,
        lecon: Math.min(etat.lecon + 1, BLOC_MAX),
        leconsSurEtape: leconsRetenues,
        etape: franchi ? etat.etape + 1 : etat.etape,
        etapeOuverte: franchi ? etat.etape + 1 : null,
        parcoursTermineMaintenant: termineMaintenant,
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

/** La progression en cours, rangée dans le couple (parcours, disposition). */
function rangerProgression(etat: EtatApp): Progressions {
  return {
    ...etat.progressions,
    [cleProgression(etat.parcours, etat.disposition)]: {
      etape: etat.etape,
      leconsSurEtape: etat.leconsSurEtape,
    },
  };
}

/** Ce qui est réellement écrit sur disque, extrait de l'état de session. */
export function aSauvegarder(etat: EtatApp): Sauvegarde {
  const progressions = rangerProgression(etat);
  /* Le miroir legacy reste celui de DÉCOUVERTE, et il est recalculé depuis les
     progressions plutôt que recopié de `etat.etape`. Y verser l'étape de
     Dactylo ne serait pas qu'un affichage faux chez les anciens clients :
     `progressionsNormalisees` refusionne le miroir dans le couple Découverte
     à chaque relecture, et l'avance changerait de parcours pour de bon. */
  const miroir = miroirLegacy(progressionDe({ progressions }, 'decouverte', etat.disposition));
  return {
    version: 1,
    modele: MODELE,
    parcours: etat.parcours,
    disposition: etat.disposition,
    dispositionChoisieALaMain: etat.dispositionChoisieALaMain,
    palier: miroir.palier,
    blocsSurPalier: miroir.blocsSurPalier,
    /* Le compteur de blocs est PERSISTÉ tel quel : le reconstruire depuis la
       seule maîtrise resservait le numéro d'un bloc joué sans aucune frappe
       propre, et deux blocs distincts comptaient alors pour un seul. */
    bloc: etat.lecon,
    maitrise: etat.maitrise,
    mesures: etat.mesures,
    exercicesRecents: etat.exercicesRecents,
    derniereLecon: etat.derniereLecon,
    guideDoigtVu: etat.guideDoigtVu,
    reglages: etat.reglages,
    progressions,
  };
}

/**
 * Revient-on d'un rattachement de méthode de connexion (#32) ? Google ramène le
 * parent à la racine ; sans cette lecture il atterrirait sur l'accueil de
 * l'enfant, sans savoir si son geste a abouti.
 */
function retourDeRattachement(): boolean {
  if (typeof location === 'undefined') return false;
  return new URLSearchParams(location.search).has(MARQUEUR_RATTACHEMENT);
}

export function etatDeDepart(cle?: string): EtatApp {
  const sauve = charger(cle);
  /* `palier` relu est le MIROIR de Découverte : il ne dit rien du parcours
     choisi. La progression jouée se lit dans son couple à elle. */
  const parcours = sauve.parcours ?? 'decouverte';
  const progression = progressionDe(sauve, parcours, sauve.disposition);
  return {
    ...sauve,
    parcours,
    etape: progression.etape,
    leconsSurEtape: progression.leconsSurEtape,
    lecon: sauve.bloc,
    etapeRejouee: null,
    /* Au tout premier lancement, on passe par le choix du clavier (cahier 4.1)
       — sauf si l'on revient de chez Google : le parent a demandé quelque
       chose, il doit en voir le résultat là où il l'a demandé. */
    vue: retourDeRattachement() ? 'V9' : sauve.dispositionChoisieALaMain ? 'V1' : 'V2',
    etoilesDuBloc: 0,
    titreEncouragement: encouragementSuivant(undefined),
    etapeOuverte: null,
    parcoursTermineMaintenant: false,
    aReinjecter: [],
    itemsDuBloc: [],
    touchesNouvelles: [],
    verrMaj: false,
    premierLancement: !sauve.dispositionChoisieALaMain,
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
