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
const CACHE = 'tapeavecmoi-v1';

self.addEventListener('install', () => self.skipWaiting());

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
     stockage local, pas ce cache, qui garde ce qu'il faut hors ligne. */
  if (url.pathname.startsWith('/api/')) return;

  evenement.respondWith(reseauPuisCache(requete));
});

async function reseauPuisCache(requete) {
  const cache = await caches.open(CACHE);
  try {
    const reponse = await fetch(requete);
    if (reponse.ok) await cache.put(requete, reponse.clone());
    return reponse;
  } catch (echec) {
    const enCache = await cache.match(requete);
    if (enCache) return enCache;
    /* Une navigation vers une route inconnue (l'app est une SPA) : c'est
       l'index qui l'amorce, et c'est lui qu'on a en cache. */
    if (requete.mode === 'navigate') {
      const index = await cache.match('/');
      if (index) return index;
    }
    throw echec;
  }
}
