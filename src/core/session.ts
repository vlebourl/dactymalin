import { composerBloc, TAILLE_BLOC_MAX, type Item } from './generator';
import type { IdDisposition } from './layouts';
import type { IdParcours } from './parcours';

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

export type OptionsSession = {
  id: IdDisposition;
  parcours: IdParcours;
  etape: number;
  aReinjecter?: string[];
  graine?: number;
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

export function creerSession(o: OptionsSession): Session {
  const graine = o.graine ?? Math.floor(Math.random() * 2 ** 31);
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
      etape: o.etape,
      /* Les items à revoir n'ont de sens qu'au début : les resservir à chaque
         vague les ferait revenir toutes les deux minutes. */
      aReinjecter: vague === 0 ? o.aReinjecter : undefined,
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
