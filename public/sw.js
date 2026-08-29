/*
 * Service worker de « Tape avec moi » — il n'existe que pour UNE chose :
 * permettre à l'application de DÉMARRER sans réseau, une fois qu'elle a été
 * ouverte au moins une fois (#3). L'enfant doit pouvoir s'entraîner dans le
 * train ; sans lui, le document lui-même est introuvable et le navigateur
 * affiche sa page d'erreur.
 *
 * Stratégie : RÉSEAU D'ABORD, cache en repli. Pas l'inverse. Le cache d'abord
 * serait plus rapide, mais servirait du code périmé après un déploiement — et
 * en développement, du code périmé tout court. Ici, en ligne on a toujours la
 * dernière version ; hors ligne, on a la dernière connue.
 */
/*
 * Le NOM porte la version. Chaque déploiement ajoute ses fichiers au nom haché
 * sans retirer les précédents : le cache d'une famille enfle donc lentement, et
 * le seul ménage sûr est de tout jeter d'un coup. C'est ce que fait un
 * changement de ce nom — l'activation efface alors les caches d'avant.
 *
 * Écarté : ne garder que ce que la dernière page a chargé. Essayé, et repris :
 * une ressource chargée plus tard que l'événement `load` (un import différé)
 * n'était pas dans la liste, se faisait effacer, et l'application ne démarrait
 * plus hors ligne du tout. Un cache qui enfle est un défaut ; une application
 * qui ne démarre pas en est un autre, et ce n'est pas le même.
 */
const CACHE = 'tapeavecmoi-v1';

self.addEventListener('install', () => self.skipWaiting());

/*
 * La page dit ce qu'elle a chargé, et on le garde.
 *
 * Sans cela, il fallait DEUX passages en ligne : les requêtes de la toute
 * première visite partent avant que ce worker ne soit aux commandes, donc le
 * document et le script de l'application n'étaient jamais mis en cache. Un
 * parent qui ouvre l'application une fois puis part sans réseau se retrouvait
 * devant la page d'erreur du navigateur.
 *
 * C'est la page qui dresse la liste parce qu'elle SAIT ce qu'elle a chargé,
 * pendant que ce fichier reste seul à connaître le nom du cache.
 */
self.addEventListener('message', (evenement) => {
  const message = evenement.data;
  if (!message || message.type !== 'garder' || !Array.isArray(message.urls)) return;
  evenement.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      /* Un par un : `addAll` abandonne TOUT dès qu'une seule requête échoue,
         et une police manquante ne doit pas coûter la coquille entière. */
      for (const url of message.urls) {
        await cache.add(url).catch(() => {});
      }
    })(),
  );
});

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    (async () => {
      /* Les caches d'une version antérieure n'ont plus de lecteur : les
         garder ferait grossir le stockage de la famille pour rien. */
      for (const nom of await caches.keys()) {
        if (nom !== CACHE) await caches.delete(nom);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request;
  const url = new URL(requete.url);

  /* On ne s'occupe QUE de la coquille de l'application : ses propres fichiers,
     et seulement en lecture. */
  if (requete.method !== 'GET' || url.origin !== self.location.origin) return;

  /* JAMAIS l'API. Une session, une progression ou une liste servie depuis un
     cache serait une réponse périmée présentée comme fraîche — et c'est le
     stockage local, pas ce cache, qui garde ce qu'il faut hors ligne.
     La frontière est le PRÉFIXE : toute route de données doit vivre sous
     `/api/`, sinon elle deviendrait cachable sans que personne le remarque. */
  if (url.pathname.startsWith('/api/')) return;

  evenement.respondWith(reseauPuisCache(requete));
});

/*
 * Une réponse digne d'être gardée. `ok` ne suffit pas : le portail captif d'un
 * hôtel ou d'un train répond 200 à n'importe quoi, avec SA page. Gardée sous
 * « / », elle deviendrait l'application au prochain démarrage hors ligne — et
 * il faudrait vider le cache à la main pour s'en sortir. Ce qui les trahit est
 * le DÉTOURNEMENT : `redirected` est vrai, parce qu'ils commencent par ça.
 *
 * On n'exige PAS `type === 'basic'` : un module ES est demandé en mode `cors`
 * même sur sa propre origine, sa réponse est donc de type `cors`, et l'exiger
 * revenait à ne garder aucun script — l'application ne démarrait plus du tout
 * hors ligne. L'origine est déjà vérifiée plus haut ; il reste à écarter
 * l'opaque, qu'on ne saurait de toute façon pas relire.
 */
const aGarder = (reponse) =>
  reponse.ok && !reponse.redirected && reponse.type !== 'opaque' && reponse.type !== 'opaqueredirect';

async function reseauPuisCache(requete) {
  const cache = await caches.open(CACHE);
  try {
    const reponse = await fetch(requete);
    /* L'écriture est ATTENDUE — sinon la coquille reste à moitié gardée quand
       le réseau se coupe juste après le chargement — mais son échec est avalé.
       Un `cache.put` qui rate (quota plein, réponse partielle) ne doit jamais
       jeter une réponse réseau parfaitement bonne, ni blanchir la page EN
       LIGNE : le cache est un confort, il n'a pas droit de vie ou de mort sur
       l'écran. */
    if (aGarder(reponse)) await cache.put(requete, reponse.clone()).catch(() => {});
    return reponse;
  } catch (echec) {
    /* `ignoreSearch` : le serveur de DÉVELOPPEMENT ajoute aux modules une
       estampille qui change à chaque chargement (`?t=…`), si bien qu'une URL
       gardée hier ne correspond jamais à celle demandée aujourd'hui — trois
       scripts manquaient, et l'application ne démarrait pas. En production les
       fichiers portent leur empreinte dans le NOM, pas dans la requête : ce
       drapeau n'y change rien.

       `ignoreVary` : les réponses portent un en-tête `Vary`, et la
       correspondance échouait alors sur des en-têtes de requête qui ne nous
       apprennent rien — le fichier était bien là, et restait introuvable. */
    const enCache = await cache.match(requete, { ignoreSearch: true, ignoreVary: true });
    if (enCache) return enCache;
    /* Une navigation vers une route inconnue (l'app est une SPA) : c'est
       l'index qui l'amorce, et c'est lui qu'on a en cache. */
    if (requete.mode === 'navigate') {
      const index = await cache.match('/', { ignoreSearch: true, ignoreVary: true });
      if (index) return index;
    }
    throw echec;
  }
}
