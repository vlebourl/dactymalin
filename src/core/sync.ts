import { charger, estIntact, sauver, type Sauvegarde } from './storage';
import { chargerIndex, cleDe } from './profils';
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
/** Lien profil local → profil serveur. */
export const CLE_LIENS = 'tapeavecmoi.liens';

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

export const liens = {
  lire: () => lire<Record<string, string>>(CLE_LIENS, {}),
  poser(idLocal: string, idDistant: string) {
    ecrire(CLE_LIENS, { ...liens.lire(), [idLocal]: idDistant });
  },
  oublierTout: () => ecrire(CLE_LIENS, {}),
};

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!r.ok) throw Object.assign(new Error(`${init?.method ?? 'GET'} ${url} → ${r.status}`), {
    statut: r.status,
  });
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

export const deconnecter = async () => {
  await json('/api/auth/sign-out', { method: 'POST', body: '{}' });
  liens.oublierTout();
};

/* ----------------------------------------------------------------- profils */

export const profilsDistants = () =>
  json<{ profils: ProfilDistant[] }>('/api/profils').then((r) => r.profils);

export const creerProfilDistant = (prenom: string) =>
  json<{ id: string; prenom: string }>('/api/profils', {
    method: 'POST',
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
    const majLe = new Date().toISOString();
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
 */
export function pousser(idProfilLocal: string, etat: Sauvegarde): Promise<void> {
  const distant = liens.lire()[idProfilLocal];
  if (!distant || !estIntact(etat)) return Promise.resolve();
  /* Une seule entrée par profil : la plus récente remplace la précédente,
     inutile de rejouer dix états intermédiaires. */
  const file = lire<EnAttente[]>(CLE_FILE, []).filter((e) => e.profilDistant !== distant);
  file.push({ profilDistant: distant, etat, majLe: new Date().toISOString() });
  ecrire(CLE_FILE, file);
  return viderLaFile();
}

/** Nombre d'envois encore en attente : affiché au parent, jamais à l'enfant. */
export const enAttente = (): number => lire<EnAttente[]>(CLE_FILE, []).length;

/**
 * À la connexion : on apparie les profils locaux et distants (par prénom), on
 * crée côté serveur ceux qui manquent, puis on RÉCONCILIE chaque progression —
 « le plus avancé gagne » — avant de renvoyer le résultat au serveur.
 *
 * C'est le seul moment où l'app écrit dans le stockage d'un autre profil que
 * celui en cours de jeu ; il n'y a alors aucune leçon en train de tourner.
 */
let association: Promise<void> | null = null;

/**
 * UN SEUL appariement à la fois, et les appels concurrents rejoignent celui
 * qui court. Deux exécutions en parallèle lisent toutes deux une liste
 * distante vide et créent chacune le même profil : le montage double de
 * `StrictMode` suffisait à dédoubler « Joueur 1 » sur le serveur.
 */
export function associerEtFusionner(): Promise<void> {
  if (!association) {
    association = appariement().finally(() => {
      association = null;
    });
  }
  return association;
}

async function appariement(): Promise<void> {
  const locaux = chargerIndex().liste;
  const distants = await profilsDistants();

  for (const local of locaux) {
    const meme = distants.find((d) => d.prenom.toLowerCase() === local.nom.toLowerCase());
    const distant: ProfilDistant =
      meme ??
      (await creerProfilDistant(local.nom).then((c) => ({
        id: c.id,
        prenom: c.prenom,
        etat: null,
        majLe: null,
      })));
    liens.poser(local.id, distant.id);

    const cle = cleDe(local.id);
    const ici = charger(cle);
    const fusionne =
      distant.etat && distant.majLe
        ? fusionner(
            { etat: ici, majLe: Date.now() },
            { etat: distant.etat, majLe: Date.parse(distant.majLe) },
          )
        : ici;
    sauver(fusionne, cle);
    await pousser(local.id, fusionne);
  }
}
