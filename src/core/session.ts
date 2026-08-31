import { composerBloc, TAILLE_BLOC_MAX, type Item } from "./generator";
import type { IdDisposition } from "./layouts";
import type { IdParcours } from "./parcours";
import type { Maitrise } from "./progression";

/**
 * Le flux d'exercices d'une leçon qui dure un TEMPS et non un compte.
 *
 * Une leçon est une séance d'un jour, dix à quinze minutes. On ne peut donc pas
 * savoir d'avance combien d'exercices elle contiendra : à 7,8 mots nets par
 * minute — la norme mesurée à 8-9 ans — un exercice coûte dix à douze secondes,
 * contre six à seize mots par minute. Le même compte fixe donnerait six minutes
 * à l'un et vingt-deux à l'autre.
 *
 * Le flux sert donc des VAGUES, rechargées avant que la file ne se vide. La
 * vague est un détail interne : ni le reducer ni l'écran ne la présentent comme
 * une unité — elle n'a aucun sens pédagogique, et la montrer réintroduirait le
 * « bloc » que le cahier chasse de l'interface.
 *
 * `composerBloc` reste intact : c'est lui qui garantit la couverture des
 * touches nouvelles, et c'est encore lui qui sert le mode « liste de la
 * maison ».
 */

/** Le plafond que `composerBloc` sait servir. La vague est un tampon interne :
    inutile de lever ce plafond pour elle. */
export const TAILLE_VAGUE = TAILLE_BLOC_MAX;
/** On recharge AVANT la pénurie : une file vide finirait la leçon au milieu. */
export const RESTE_AVANT_RECHARGE = 3;

/**
 * Le délai au-delà duquel la leçon du retour commence par une révision (§7.4).
 *
 * Dans un programme pilote de 32 séances, les gains étaient là en fin de
 * session et la plupart avaient disparu six semaines plus tard : remettre
 * l'enfant à son étape courante sans rien réviser le met en échec au premier
 * exercice. Quatorze jours est un RÉGLAGE, pas une valeur démontrée — il se
 * change ici, ou au cas par cas, sans toucher à la logique.
 */
export const JOURS_AVANT_REVISION = 14;

const JOUR_MS = 86_400_000;

/**
 * Y a-t-il eu une interruption de plusieurs JOURS ?
 *
 * Trois choses à ne pas confondre. Une séance abandonnée en cours et un
 * rechargement de page se comptent en minutes : ils ne changent rien. Sans
 * date connue, il n'y a pas eu de pause — l'enfant n'a encore rien joué, et
 * réviser des étapes jamais faites n'aurait aucun sens.
 */
export function revisionNecessaire(
  derniereLecon: number | undefined,
  maintenant: number,
  joursAvantRevision: number = JOURS_AVANT_REVISION,
): boolean {
  if (derniereLecon === undefined) return false;
  return maintenant - derniereLecon > joursAvantRevision * JOUR_MS;
}

export type OptionsSession = {
  id: IdDisposition;
  parcours: IdParcours;
  etape: number;
  aReinjecter?: string[];
  /**
   * La maîtrise réelle de l'enfant (décision 8). Elle ne commande aucun
   * passage : elle PONDÈRE le tirage, pour que les touches mal acquises
   * reviennent plus souvent dans les leçons suivantes de la même étape.
   *
   * Le générateur savait déjà le faire ; ce compositeur ne la lui passait pas,
   * et le tirage restait uniforme en vrai — rater une touche n'avait aucune
   * conséquence sur ce qu'on redonnait à taper. Absente ⇒ tirage uniforme,
   * ce qui reste la bonne réponse pour un enfant qui commence.
   */
  maitrise?: Maitrise;
  graine?: number;
  /** Quand la dernière leçon a été close (`storage.derniereLecon`). */
  derniereLecon?: number;
  /** Injectable pour les tests ; l'horloge sinon. */
  maintenant?: number;
  joursAvantRevision?: number;
};

export type Session = {
  /** Toute la file servie depuis le début, dans l'ordre. */
  items: () => Item[];
  /** Ajoute une vague. Sans effet si l'étape n'a plus rien à offrir. */
  recharger: () => void;
  /** Vrai quand le corpus de l'étape est épuisé : la leçon s'arrête alors,
      elle ne recommence pas au début. */
  epuisee: () => boolean;
  /** Faut-il recharger maintenant, l'enfant étant à cet exercice-ci ? */
  aRecharger: (indexCourant: number) => boolean;
};

/**
 * L'état de l'app, vu par le compositeur de séance. Volontairement STRUCTUREL
 * et non `EtatApp` : ce module ne doit rien savoir de la vue, et un test doit
 * pouvoir en fabriquer un sans monter toute l'application.
 */
export type EtatPourSession = {
  parcours: IdParcours;
  etape: number;
  /** L'étape que l'enfant a choisi de rejouer, sinon `null`. */
  etapeRejouee: number | null;
  aReinjecter?: string[];
  maitrise: Maitrise;
  derniereLecon?: number;
};

/**
 * Ce que l'état de l'app donne au compositeur de séance.
 *
 * Cette fonction existe parce que le site d'appel a déjà perdu deux champs sans
 * que rien ne s'en aperçoive : `derniereLecon` (#47), sans quoi la révision du
 * retour ne se déclenchait jamais en vrai, puis `maitrise` (#71), sans quoi le
 * tirage restait uniforme et rater une touche n'avait aucune conséquence. Les
 * deux fois, la logique était écrite et testée, et c'est le passage de témoin
 * qui manquait — invisible pour toute la suite de tests, puisqu'il vivait dans
 * une vue.
 *
 * Ici il est pur, et il a son test. Un champ qu'on oublie de transmettre fait
 * désormais tomber la CI.
 */
export function optionsDeSession(
  etat: EtatPourSession,
  id: IdDisposition,
  maintenant: number,
): OptionsSession {
  return {
    id,
    parcours: etat.parcours,
    /* L'étape RÉELLEMENT jouée : celle qu'on rejoue, sinon la sienne. */
    etape: etat.etapeRejouee ?? etat.etape,
    aReinjecter: etat.aReinjecter,
    maitrise: etat.maitrise,
    derniereLecon: etat.derniereLecon,
    maintenant,
  };
}

export function creerSession(o: OptionsSession): Session {
  const graine = o.graine ?? Math.floor(Math.random() * 2 ** 31);
  /* La RÉVISION du retour (#47) : une première vague composée sur l'étape
     PRÉCÉDENTE, dont le vivier est exactement l'ensemble des touches des
     étapes déjà faites. L'étape courante n'est pas touchée — rien n'est
     retiré, on ajoute une vague devant. À la première étape il n'y a rien
     derrière : la leçon du retour y est une leçon ordinaire.
     Cette vague ne s'annonce nulle part : l'enfant ne doit jamais lire qu'il
     a baissé, ni qu'on lui reproche une absence. */
  const revise =
    o.etape > 1 &&
    revisionNecessaire(
      o.derniereLecon,
      o.maintenant ?? Date.now(),
      o.joursAvantRevision,
    );
  const premiereVagueDeLEtape = revise ? 1 : 0;
  const file: Item[] = [];
  const servis = new Set<string>();
  let vague = 0;
  let epuisee = false;

  const ajouter = (lot: Item[]) => {
    let neufs = 0;
    for (const it of lot) {
      if (servis.has(it.texte)) continue;
      servis.add(it.texte);
      file.push(it);
      neufs++;
    }
    return neufs;
  };

  const composer = () => {
    /* La graine dérive du numéro de vague : même graine de départ, même suite
       complète — c'est ce qui rend une leçon rejouable dans un test. */
    const lot = composerBloc({
      id: o.id,
      parcours: o.parcours,
      etape: revise && vague === 0 ? o.etape - 1 : o.etape,
      /* Les items à revoir n'ont de sens qu'au début de l'étape COURANTE : les
         resservir à chaque vague les ferait revenir toutes les deux minutes,
         et les servir pendant la révision y ferait entrer des touches que
         cette vague-là écarte exprès. */
      aReinjecter: vague === premiereVagueDeLEtape ? o.aReinjecter : undefined,
      /* La pondération s'applique à TOUTES les vagues, révision comprise : une
         touche faible est faible où qu'elle apparaisse. Elle ne fait entrer
         aucune touche nouvelle — le vivier reste celui de l'étape composée. */
      maitrise: o.maitrise,
      taille: TAILLE_VAGUE,
      graine: graine + vague * 7919,
    });
    vague++;
    return lot;
  };

  /* Une vague peut ne rien apporter de neuf alors que l'étape a encore du
     stock : le tirage retombe sur des mots déjà servis. On insiste donc
     quelques fois avant de déclarer l'étape épuisée. */
  const recharger = () => {
    if (epuisee) return;
    for (let essai = 0; essai < 8; essai++) {
      if (ajouter(composer()) > 0) return;
    }
    epuisee = true;
  };

  ajouter(composer());

  return {
    items: () => file,
    recharger,
    epuisee: () => epuisee,
    aRecharger: (i) => !epuisee && file.length - i <= RESTE_AVANT_RECHARGE,
  };
}
