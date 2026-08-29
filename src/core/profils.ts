import { CLE, charger, type Sauvegarde } from './storage';

/**
 * Profils enfants, tels que le SERVEUR les connaît (#4). L'identifiant serveur
 * est leur SEUL identifiant ; ce module n'est plus qu'un cache local, indexé
 * par cet identifiant, pour que « Qui joue ? » s'affiche sans attendre le
 * réseau et que la leçon reprenne hors ligne.
 *
 * Il n'invente donc plus de profil : un compte sans enfant a zéro profil, et
 * c'est l'écran de choix qui demande le premier prénom. Il n'apparie plus rien
 * par prénom non plus — deux Timo sont deux enfants, pas un seul.
 */
export const CLE_PROFILS = 'tapeavecmoi.profils';
/** Drapeau de session : forcer l'écran « Qui joue ? » au prochain chargement. */
export const CLE_CHOISIR = 'tapeavecmoi.choisir';

export type Profil = { id: string; nom: string };
export type IndexProfils = { version: 2; actif: string | null; liste: Profil[] };

/**
 * Longueur maximale d'un prénom. Le serveur applique CETTE constante-ci : deux
 * bornes séparées finissent par diverger, et c'est l'écran qui accuse alors
 * l'enfant d'une faute que le serveur n'a pas commise.
 */
export const PRENOM_MAX = 30;

/**
 * Un compte de famille, pas une classe : la borne protège la base. Elle vit
 * ici pour la même raison que `PRENOM_MAX` — l'écran doit pouvoir expliquer un
 * plafond avec le nombre que le serveur applique vraiment.
 */
export const PROFILS_MAX = 12;

/** Comparaison de deux prénoms « dans le même foyer » : ni la casse ni les
 * espaces de bord ne distinguent deux enfants aux yeux d'un parent. */
export const memePrenom = (a: string, b: string): boolean =>
  a.trim().toLocaleLowerCase('fr') === b.trim().toLocaleLowerCase('fr');

/**
 * Un prénom acceptable : au moins une lettre une fois les espaces retirés, et
 * pas plus long que la borne. Écrire ce jugement ICI, et non dans l'écran,
 * évite qu'il ne dise « c'est bon » quand le serveur répondra « non ».
 */
export const prenomValide = (nom: string): boolean => {
  const propre = nom.trim();
  return propre.length >= 1 && propre.length <= PRENOM_MAX;
};

/** Progression d'un profil : une clé par identifiant SERVEUR. */
export const cleDe = (id: string): string => `${CLE}.${id}`;

const VIDE: IndexProfils = { version: 2, actif: null, liste: [] };

/**
 * `version: 2` : la version 1 indexait par identifiant LOCAL (`p1`, `p<hasard>`)
 * et ces identifiants-là ne veulent plus rien dire. Un cache d'avant est donc
 * ignoré, jamais relu comme s'il portait des identifiants serveur.
 */
function lire(): IndexProfils | null {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE_PROFILS) ?? 'null') as unknown;
    if (!brut || typeof brut !== 'object') return null;
    const o = brut as Record<string, unknown>;
    if (o.version !== 2 || !Array.isArray(o.liste)) return null;
    const liste = o.liste.filter(
      (p): p is Profil =>
        !!p && typeof p === 'object' &&
        typeof (p as Profil).id === 'string' && (p as Profil).id.length > 0 &&
        typeof (p as Profil).nom === 'string',
    );
    const actif = typeof o.actif === 'string' && liste.some((p) => p.id === o.actif) ? o.actif : null;
    return { version: 2, actif, liste };
  } catch {
    return null;
  }
}

export function sauverIndex(ix: IndexProfils): void {
  try {
    localStorage.setItem(CLE_PROFILS, JSON.stringify(ix));
  } catch {
    /* navigation privée : la session continue sans persistance */
  }
}

/** Le cache tel qu'il est, sans rien inventer ni écrire. */
export function chargerIndex(): IndexProfils {
  return lire() ?? { ...VIDE };
}

/**
 * Le compte fait foi : la liste du serveur REMPLACE le cache. Le joueur actif
 * ne survit que s'il est toujours au compte — un profil supprimé ailleurs ne
 * doit pas rester ouvert ici.
 */
export function remplacerIndex(profils: Profil[]): IndexProfils {
  const { actif } = chargerIndex();
  const ix: IndexProfils = {
    version: 2,
    actif: actif && profils.some((p) => p.id === actif) ? actif : null,
    liste: profils,
  };
  sauverIndex(ix);
  /* Un enfant supprimé — ici ou depuis un autre appareil — emporte sa
     progression en cache. La laisser en ferait un fantôme : de la place prise
     pour toujours, et le travail d'un enfant qui a quitté le compte gardé sur
     un appareil qui n'a plus rien à en faire. */
  for (const id of idsEnCache()) {
    if (!profils.some((p) => p.id === id)) oublierProgression(id);
  }
  return ix;
}

/**
 * Identifiants dont une progression traîne en cache. La clé nue `tapeavecmoi.v1`
 * (et sa sauvegarde de secours) est celle d'AVANT les identifiants serveur :
 * elle n'appartient à aucun profil, et la reprise en a encore besoin.
 */
function idsEnCache(): string[] {
  const prefixe = `${CLE}.`;
  const ids: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const cle = localStorage.key(i);
      if (!cle?.startsWith(prefixe) || cle.endsWith('.backup')) continue;
      ids.push(cle.slice(prefixe.length));
    }
  } catch {
    /* stockage refusé : rien à énumérer */
  }
  return ids;
}

function oublierProgression(id: string): void {
  try {
    localStorage.removeItem(cleDe(id));
    localStorage.removeItem(`${cleDe(id)}.backup`);
  } catch {
    /* rien à effacer */
  }
}

/** Un profil qui vient d'être créé sur le serveur : il devient l'actif. */
export function ajouterProfil(p: Profil): IndexProfils {
  const ix = chargerIndex();
  const liste = [...ix.liste.filter((q) => q.id !== p.id), p];
  const suivant: IndexProfils = { version: 2, actif: p.id, liste };
  sauverIndex(suivant);
  return suivant;
}

/**
 * Progression d'un profil telle qu'elle est en cache ICI, ou `null` si cet
 * appareil n'en a pas. Le `null` compte : `charger` rendrait les valeurs par
 * défaut, et les réglages annonceraient « leçon 1 » à un enfant qui a
 * peut-être une leçon 6 sur la tablette.
 */
export function progressionEnCache(id: string): Sauvegarde | null {
  try {
    if (localStorage.getItem(cleDe(id)) === null && localStorage.getItem(`${cleDe(id)}.backup`) === null) {
      return null;
    }
  } catch {
    return null;
  }
  return charger(cleDe(id));
}

/**
 * Le foyer tel que CET appareil le connaît, avec la progression en cache de
 * chacun. C'est ce qu'on montre quand le serveur ne répond pas : afficher une
 * liste vide ferait croire au parent qu'il a perdu ses enfants (#3).
 */
export function profilsEnCache(): { id: string; prenom: string; etat: Sauvegarde | null }[] {
  return chargerIndex().liste.map((p) => ({
    id: p.id,
    prenom: p.nom,
    etat: progressionEnCache(p.id),
  }));
}

/**
 * Profil à ouvrir au chargement, ou `null` si l'écran « Qui joue ? » doit
 * décider : zéro profil (il demandera le premier prénom), plusieurs joueurs,
 * ou changement demandé depuis les réglages.
 * SANS effet de bord (appelée depuis un initialisateur React, StrictMode la
 * rejoue) : c'est l'écran « Qui joue ? » qui efface le drapeau, à son montage.
 */
export function profilInitial(): string | null {
  const ix = chargerIndex();
  let choisir = false;
  try {
    choisir = sessionStorage.getItem(CLE_CHOISIR) === '1';
  } catch {
    /* pas de sessionStorage : on n'affiche le choix que s'il y a à choisir */
  }
  if (choisir || ix.liste.length !== 1) return null;
  return ix.liste[0].id;
}

/** À appeler quand l'écran de choix est affiché : le drapeau a servi. */
export function effacerDemandeDeChoix(): void {
  try {
    sessionStorage.removeItem(CLE_CHOISIR);
  } catch {
    /* rien à effacer */
  }
}

export function activerProfil(id: string): void {
  const ix = chargerIndex();
  if (ix.liste.some((p) => p.id === id)) sauverIndex({ ...ix, actif: id });
}

/**
 * Prénom du profil actif, pour l'afficher pendant la leçon.
 * Lu à la demande et non porté par l'état : il ne change jamais en cours de
 * leçon, le faire transiter par le reducer n'ajouterait qu'un champ à tenir
 * à jour. `null` quand aucun profil n'est actif — l'en-tête n'affiche alors
 * rien plutôt qu'un nom inventé.
 */
export function nomProfilActif(): string | null {
  const ix = chargerIndex();
  return ix.liste.find((p) => p.id === ix.actif)?.nom ?? null;
}

/**
 * Déconnexion : le cache appartient au compte qui part. On efface l'index ET
 * les progressions qu'il indexait — céder l'appareil ne doit pas céder ce que
 * les enfants du compte précédent ont fait.
 */
export function oublierProfils(): void {
  try {
    const prefixe = `${CLE}.`;
    /* `CLE` nue est la clé d'AVANT les identifiants serveur : plus personne ne
       l'écrit, mais une installation d'avant #4 en garde une, et la laisser
       serait laisser la progression d'un enfant au compte suivant. */
    const aEffacer: string[] = [CLE_PROFILS, CLE];
    for (let i = 0; i < localStorage.length; i++) {
      const cle = localStorage.key(i);
      if (cle?.startsWith(prefixe)) aEffacer.push(cle);
    }
    for (const cle of aEffacer) localStorage.removeItem(cle);
  } catch {
    /* stockage refusé : il n'y avait rien à effacer */
  }
}
