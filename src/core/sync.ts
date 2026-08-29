import { charger, estIntact, sauver, type Sauvegarde } from './storage';
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

/** Horodatage de la dernière écriture locale d'un profil, ou `null`. */
function majLocale(id: string): number | null {
  const iso = lire<Record<string, string>>(CLE_MAJ, {})[id];
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : null;
}

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

export async function compteCourant(): Promise<Compte | null> {
  try {
    const s = await json<{ user?: Compte } | null>('/api/auth/get-session');
    return s?.user ?? null;
  } catch {
    /* Hors ligne ou serveur absent : pas de session CONNUE, donc le portail
       reprend la main. Le démarrage hors ligne sur session en cache est un
       ticket à part (#3) ; ici, pas de session = pas d'entrée. */
    return null;
  }
}

export const creerCompte = (email: string, motDePasse: string, nom: string) =>
  json<{ user: Compte }>('/api/auth/sign-up/email', {
    method: 'POST',
    body: JSON.stringify({ email, password: motDePasse, name: nom }),
  });

export const connecter = (email: string, motDePasse: string) =>
  json<{ user: Compte }>('/api/auth/sign-in/email', {
    method: 'POST',
    body: JSON.stringify({ email, password: motDePasse }),
  });

/**
 * Déconnexion. Le cache appartient au compte qui part : profils ET
 * progressions s'en vont avec lui, ainsi que ce qui restait à envoyer — le
 * pousser sous la prochaine session le donnerait au mauvais compte.
 */
export const deconnecter = async () => {
  await json('/api/auth/sign-out', { method: 'POST', body: '{}' });
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
    } catch {
      return; // hors ligne ou serveur fâché : on réessaiera
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

    /* Jamais écrit ici : le serveur fait foi, sans fusion — fusionner avec des
       valeurs par défaut effacerait ses préférences. */
    if (majIci === null) {
      if (d.etat) sauver(d.etat, cle);
      continue;
    }

    const ici = charger(cle);
    if (!d.etat || !d.majLe) {
      await pousser(d.id, ici);
      continue;
    }

    const fusionne = fusionner(
      { etat: ici, majLe: majIci },
      { etat: d.etat, majLe: Date.parse(d.majLe) },
    );
    sauver(fusionne, cle);
    /* On ne renvoie que ce que le serveur ne sait pas déjà : au démarrage,
       trois appareils identiques n'ont rien à se dire. */
    if (empreinte(fusionne) !== empreinte(d.etat)) await pousser(d.id, fusionne);
  }
}
