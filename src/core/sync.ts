import { listesValides, type Liste } from './listes';
import { CLE, charger, estIntact, sauver, type Sauvegarde } from './storage';
import { cleDe, oublierProfils, remplacerIndex } from './profils';
import { fusionner } from './fusion';

/**
 * Synchronisation LOCAL D'ABORD.
 *
 * Règle non négociable : aucun appel réseau ne bloque jamais une leçon. Tout
 * part en arrière-plan, tout échec est silencieux côté enfant, et la file
 * d'attente survit à un rechargement.
 *
 * Depuis que la connexion est obligatoire, « sans compte connecté » n'est plus
 * un état de l'application : il n'y a qu'un seul compte, celui du portail.
 *
 * Depuis #4, les profils sont ceux du COMPTE : leur identifiant serveur est le
 * seul identifiant, le stockage local n'en est que le cache. Il n'y a donc
 * plus de table de liens, plus d'appariement par prénom, et plus d'horodatage
 * local pris à l'instant de la comparaison — c'est celui de la dernière
 * écriture réelle qui décide.
 */

export type ProfilDistant = {
  id: string;
  prenom: string;
  etat: Sauvegarde | null;
  majLe: string | null;
};

export type Compte = { id: string; email: string; name: string };

/** File des envois en attente, gardée entre deux sessions. */
export const CLE_FILE = 'tapeavecmoi.file';
/** Date de la dernière écriture LOCALE, par profil : l'arbitre de la fusion. */
export const CLE_MAJ = 'tapeavecmoi.maj';
/** Le compte de la dernière session CONNUE : ce qui permet de démarrer hors ligne. */
export const CLE_COMPTE = 'tapeavecmoi.compte';
/** La bibliothèque telle que le serveur l'a dite, pour la jouer sans réseau. */
export const CLE_LISTES = 'tapeavecmoi.listes';

type EnAttente = { profilDistant: string; etat: Sauvegarde; majLe: string };

function lire<T>(cle: string, defaut: T): T {
  try {
    const brut = localStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : defaut;
  } catch {
    return defaut;
  }
}

function ecrire(cle: string, valeur: unknown): void {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    /* navigation privée : la session continue sans file persistée */
  }
}

function effacer(cle: string): void {
  try {
    localStorage.removeItem(cle);
  } catch {
    /* rien à effacer */
  }
}

/** `true` si ce profil a une progression en cache sur cet appareil. */
function copieLocale(cle: string): boolean {
  try {
    return localStorage.getItem(cle) !== null || localStorage.getItem(`${cle}.backup`) !== null;
  } catch {
    return false;
  }
}

/** Horodatage de la dernière écriture locale d'un profil, ou `null`. */
function majLocale(id: string): number | null {
  const iso = lire<Record<string, string>>(CLE_MAJ, {})[id];
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : null;
}

/**
 * Le serveur n'a pas répondu du tout — par opposition à « il a répondu, et sa
 * réponse est une erreur ». Sans `statut`, personne n'a parlé : c'est la
 * définition de « hors ligne » dans ce module, et la seule situation où l'on
 * se rabat sur ce qui est gardé ici.
 */
const estHorsLigne = (erreur: unknown): boolean =>
  (erreur as { statut?: number } | null)?.statut === undefined;

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!r.ok) {
    /* Le serveur dit PRÉCISÉMENT ce qui ne va pas (`code`) : le jeter obligeait
       l'écran à inventer une explication, et il en inventait une fausse. */
    const corps = (await r.json().catch(() => null)) as { code?: string } | null;
    throw Object.assign(new Error(`${init?.method ?? 'GET'} ${url} → ${r.status}`), {
      statut: r.status,
      code: corps?.code,
    });
  }
  return (await r.json()) as T;
}

/* ------------------------------------------------------------------ compte */

/** Le compte de la dernière session connue sur cet appareil, ou `null`. */
export const compteEnCache = (): Compte | null => lire<Compte | null>(CLE_COMPTE, null);

/**
 * La session n'a plus cours : on oublie le compte ET sa bibliothèque. Un autre
 * parent peut se connecter sur cet appareil, et il n'a rien à savoir des mots
 * que la famille d'avant avait préparés.
 *
 * Les PROGRESSIONS et la file, elles, restent : elles peuvent contenir du
 * travail que le serveur n'a pas encore reçu, et une session expirée n'est pas
 * une raison de le détruire. Une liste, au contraire, ne se perd jamais — le
 * serveur en a la seule copie qui compte.
 */
function oublierLeCompte(): void {
  effacer(CLE_COMPTE);
  effacer(CLE_LISTES);
}

/**
 * Qui est connecté ? Le serveur fait foi DÈS QU'IL RÉPOND — c'est lui qui sait
 * si la session a expiré, et sa réponse efface alors le souvenir.
 *
 * Mais « le serveur n'a pas répondu » et « il n'y a pas de session » sont deux
 * faits différents, et les confondre renvoyait au formulaire de connexion un
 * parent parfaitement connecté dès que le train entrait dans un tunnel (#3).
 * Sans réseau, on repart donc du dernier compte CONNU. Un appareil qui n'en a
 * jamais vu n'en invente pas : le portail reprend la main et dit qu'il ne
 * joint pas le serveur.
 */
export async function compteCourant(): Promise<Compte | null> {
  try {
    const s = await json<{ user?: Compte } | null>('/api/auth/get-session');
    const brut = s?.user ?? null;
    if (!brut) {
      oublierLeCompte();
      return null;
    }
    /* On garde les TROIS champs dont l'écran a besoin, choisis un par un. Le
       serveur en renvoie davantage (adresse vérifiée, image, dates) : les
       recopier tels quels laisserait au repos, sur la machine familiale, tout
       ce que Better Auth décidera d'ajouter un jour. */
    const compte: Compte = { id: brut.id, email: brut.email, name: brut.name };
    ecrire(CLE_COMPTE, compte);
    return compte;
  } catch (erreur) {
    /* Une réponse d'ERREUR du serveur est une réponse : lui aussi sait. Seule
       l'absence de réponse (pas de `statut`) vaut « hors ligne ». */
    if (!estHorsLigne(erreur)) {
      oublierLeCompte();
      return null;
    }
    return compteEnCache();
  }
}

/* Une session qui vient d'être ouverte est CONNUE : on la retient tout de
   suite, pour que le prochain démarrage sans réseau la retrouve. */
const retenir = async (p: Promise<{ user: Compte }>) => {
  const r = await p;
  ecrire(CLE_COMPTE, r.user);
  return r;
};

export const creerCompte = (email: string, motDePasse: string, nom: string) =>
  retenir(
    json<{ user: Compte }>('/api/auth/sign-up/email', {
      method: 'POST',
      body: JSON.stringify({ email, password: motDePasse, name: nom }),
    }),
  );

export const connecter = (email: string, motDePasse: string) =>
  retenir(
    json<{ user: Compte }>('/api/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email, password: motDePasse }),
    }),
  );

/**
 * Déconnexion. Le cache appartient au compte qui part : profils ET
 * progressions s'en vont avec lui, ainsi que ce qui restait à envoyer — le
 * pousser sous la prochaine session le donnerait au mauvais compte.
 */
export const deconnecter = async () => {
  await json('/api/auth/sign-out', { method: 'POST', body: '{}' });
  oublierLeCompte();
  effacer(CLE_FILE);
  effacer(CLE_MAJ);
  oublierProfils();
};

/* ----------------------------------------------------------------- profils */

export const profilsDistants = () =>
  json<{ profils: ProfilDistant[] }>('/api/profils').then((r) => r.profils);

export const creerProfilDistant = (prenom: string) =>
  json<{ id: string; prenom: string }>('/api/profils', {
    method: 'POST',
    body: JSON.stringify({ prenom }),
  });

export const renommerProfilDistant = (id: string, prenom: string) =>
  json<{ id: string; prenom: string }>(`/api/profils/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ prenom }),
  });

export const supprimerProfilDistant = (id: string) =>
  json(`/api/profils/${id}`, { method: 'DELETE' });

/* ------------------------------------------------------------- bibliothèque */

/**
 * Les listes du COMPTE, avec un cache en LECTURE SEULE (#11).
 *
 * Le serveur fait foi dès qu'il répond : sa réponse remplace le cache, donc une
 * liste supprimée sur la tablette disparaît aussi d'ici. Quand il ne répond
 * pas, on rend la dernière bibliothèque connue — l'enfant retrouve ses cartes
 * dans le train.
 *
 * Le cache ne se remplit QUE de ce que le serveur a dit. Aucune intention
 * locale n'y entre, et aucune modification n'est mise en file : ce serait la
 * porte ouverte aux conflits d'édition (deux appareils qui renomment la même
 * liste) pour un cas qui n'arrivera pas — préparer une liste est un geste
 * posé, à la maison.
 */
export async function listesDistantes(): Promise<Liste[]> {
  try {
    const { listes } = await json<{ listes: unknown }>('/api/listes');
    /* On garde ce qu'on a VÉRIFIÉ, jamais le corps brut : une réponse tronquée
       écrirait « undefined » et détruirait en silence la bibliothèque gardée. */
    const saines = listesValides(listes);
    ecrire(CLE_LISTES, saines);
    return saines;
  } catch (erreur) {
    /* Une réponse d'ERREUR est une réponse, et on la laisse remonter à
       l'écran : servir le cache sur un 500 ferait passer une panne pour un
       fonctionnement normal. Seule l'absence de réponse vaut « hors ligne ». */
    if (!estHorsLigne(erreur)) throw erreur;
    return listesEnCache();
  }
}

/** La dernière bibliothèque connue de cet appareil, relue avec méfiance. */
const listesEnCache = (): Liste[] => listesValides(lire<unknown>(CLE_LISTES, []));

export const creerListeDistante = (nom: string, mots: string[]) =>
  json<Liste>('/api/listes', { method: 'POST', body: JSON.stringify({ nom, mots }) });

export const modifierListeDistante = (id: string, nom: string, mots: string[]) =>
  json<Liste>(`/api/listes/${id}`, { method: 'PUT', body: JSON.stringify({ nom, mots }) });

export const supprimerListeDistante = (id: string) =>
  json(`/api/listes/${id}`, { method: 'DELETE' });

/* ------------------------------------------------------------------- envoi */

async function envoyer(e: EnAttente): Promise<void> {
  try {
    await json(`/api/profils/${e.profilDistant}/progression`, {
      method: 'PUT',
      body: JSON.stringify({ etat: e.etat, majLe: e.majLe }),
    });
  } catch (erreur) {
    /* 409 : le serveur a plus récent. On refait la fusion et on rejoue UNE
       fois — jamais de boucle, l'enfant est en train de taper. */
    if ((erreur as { statut?: number }).statut !== 409) throw erreur;
    const distant = (await profilsDistants()).find((p) => p.id === e.profilDistant);
    if (!distant?.etat || !distant.majLe) throw erreur;
    const fusionne = fusionner(
      { etat: e.etat, majLe: Date.parse(e.majLe) },
      { etat: distant.etat, majLe: Date.parse(distant.majLe) },
    );
    /* STRICTEMENT plus récent que ce qu'on vient de fusionner : daté à
       `Date.now()`, le rejeu se faisait refuser à son tour dès que l'horloge
       du serveur avançait sur celle de l'appareil — la fusion était faite,
       puis jetée. */
    const majLe = new Date(Math.max(Date.now(), Date.parse(distant.majLe) + 1)).toISOString();
    await json(`/api/profils/${e.profilDistant}/progression`, {
      method: 'PUT',
      body: JSON.stringify({ etat: fusionne, majLe }),
    });
  }
}

/* Une seule vidange à la fois : deux appels concurrents envoyaient deux fois
   le même état, et la lecture qui suivait pouvait tomber entre les deux. */
let enCours: Promise<void> = Promise.resolve();

/** Vide la file. Silencieux : ce qui ne part pas reste en attente. */
export function viderLaFile(): Promise<void> {
  enCours = enCours.then(vidange, vidange);
  return enCours;
}

async function vidange(): Promise<void> {
  let file = lire<EnAttente[]>(CLE_FILE, []);
  while (file.length > 0) {
    const [premier, ...reste] = file;
    try {
      await envoyer(premier);
    } catch (erreur) {
      const statut = (erreur as { statut?: number }).statut;
      /* 400 et 404 : le serveur n'en voudra JAMAIS (profil supprimé sur un
         autre appareil, état illisible). Le garder en tête de file bloquerait
         toutes les progressions suivantes, pour toujours — un seul envoi
         mort-né condamnait la synchronisation de la famille entière. */
      if (statut !== 400 && statut !== 404) return; // hors ligne : on réessaiera
    }
    file = reste;
    ecrire(CLE_FILE, file);
  }
}

/**
 * Met une progression en file et tente de l'envoyer. Ne lève JAMAIS : appelée
 * depuis la boucle de jeu, elle doit être invisible quand le réseau manque.
 *
 * `idProfil` est l'identifiant SERVEUR du profil : c'est le seul qu'il y ait.
 */
export function pousser(idProfil: string, etat: Sauvegarde): Promise<void> {
  if (!estIntact(etat)) return Promise.resolve();
  const majLe = new Date().toISOString();
  /* L'écriture locale est datée ICI, à l'instant où elle a lieu. La fusion la
     comparera à celle du serveur — et non plus à `Date.now()`, qui faisait
     gagner cet appareil à tous les coups, y compris sur des préférences
     changées ailleurs il y a une minute. */
  ecrire(CLE_MAJ, { ...lire<Record<string, string>>(CLE_MAJ, {}), [idProfil]: majLe });
  /* Une seule entrée par profil : la plus récente remplace la précédente,
     inutile de rejouer dix états intermédiaires. */
  const file = lire<EnAttente[]>(CLE_FILE, []).filter((e) => e.profilDistant !== idProfil);
  file.push({ profilDistant: idProfil, etat, majLe });
  ecrire(CLE_FILE, file);
  return viderLaFile();
}

/** Nombre d'envois encore en attente : affiché au parent, jamais à l'enfant. */
export const enAttente = (): number => lire<EnAttente[]>(CLE_FILE, []).length;

/**
 * REPRISE, une seule fois, de la progression d'AVANT les identifiants serveur.
 *
 * Un appareil qui a joué avant que la connexion ne devienne obligatoire garde
 * sa progression sous la clé historique `tapeavecmoi.v1`, et personne ne l'a
 * jamais envoyée au compte : sans reprise, l'enfant recommencerait à zéro et
 * la déconnexion finirait par effacer son travail.
 *
 * Elle rejoint le PREMIER enfant créé après la mise à jour, puis la clé
 * historique disparaît — une fois, sans appariement par prénom et sans table
 * de liens. Un appareil qui avait PLUSIEURS enfants locaux ne peut pas être
 * démêlé sans réinventer cet appariement : seul le premier est repris.
 */
export function adopterProgressionHistorique(idProfil: string): Promise<void> {
  /* On juge la valeur BRUTE, pas ce que `charger` en fait : celui-ci rend les
     défauts quand la clé est illisible, et adopter des défauts effacerait la
     clé historique en faisant croire à une reprise. */
  const brut = lire<unknown>(CLE, null) ?? lire<unknown>(`${CLE}.backup`, null);
  if (!estIntact(brut)) return Promise.resolve();
  const historique = charger(CLE);
  sauver(historique, cleDe(idProfil));
  effacer(CLE);
  effacer(`${CLE}.backup`);
  return pousser(idProfil, historique);
}

/**
 * Au démarrage : on prend la liste des profils DU COMPTE, on l'écrit dans le
 * cache, et on réconcilie chaque progression — « le plus avancé gagne » pour
 * les acquis, « le plus récent gagne » pour les préférences.
 *
 * C'est le seul moment où l'app écrit dans le stockage d'un autre profil que
 * celui en cours de jeu ; il n'y a alors aucune leçon en train de tourner.
 *
 * UNE SEULE exécution à la fois, et les appels concurrents rejoignent celle
 * qui court : le montage double de `StrictMode` en lançait deux en parallèle.
 */
let synchro: Promise<void> | null = null;

export function synchroniserProfils(): Promise<void> {
  if (!synchro) {
    synchro = reconcilier().finally(() => {
      synchro = null;
    });
  }
  return synchro;
}

/**
 * Empreinte stable d'un état : deux objets aux mêmes champs se comparent
 * égaux quel que soit l'ordre dans lequel ils ont été construits (`fusionner`
 * et `valider` ne les écrivent pas dans le même ordre).
 */
function empreinte(v: unknown): string {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return JSON.stringify(v) ?? 'null';
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .sort()
    .map((c) => `${JSON.stringify(c)}:${empreinte(o[c])}`)
    .join(',')}}`;
}

async function reconcilier(): Promise<void> {
  const distants = await profilsDistants();
  remplacerIndex(distants.map((d) => ({ id: d.id, nom: d.prenom })));

  for (const d of distants) {
    const cle = cleDe(d.id);
    const majIci = majLocale(d.id);

    /* Aucune copie ici : le serveur fait foi, sans fusion — fusionner avec des
       valeurs par défaut effacerait ses préférences. */
    if (!copieLocale(cle)) {
      if (d.etat) sauver(d.etat, cle);
      continue;
    }

    const ici = charger(cle);
    if (!d.etat || !d.majLe) {
      await pousser(d.id, ici);
      continue;
    }

    /* Une copie locale SANS horodatage (clé perdue, stockage plein au mauvais
       moment) est datée « très vieille » plutôt qu'écrasée : ses acquis sont
       gardés, et ce sont les préférences du serveur qui gagnent. */
    const fusionne = fusionner(
      { etat: ici, majLe: majIci ?? 0 },
      { etat: d.etat, majLe: Date.parse(d.majLe) },
    );
    sauver(fusionne, cle);
    /* On ne renvoie que ce que le serveur ne sait pas déjà : au démarrage,
       trois appareils identiques n'ont rien à se dire. */
    if (empreinte(fusionne) !== empreinte(d.etat)) await pousser(d.id, fusionne);
  }
}
