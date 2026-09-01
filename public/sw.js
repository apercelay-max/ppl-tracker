// Service worker : c'est lui qui permet d'ouvrir l'app sans réseau.
//
// L'ancienne version ne mettait en cache que '/' et allait au réseau en
// premier : en salle, avec du réseau qui traîne ou pas de réseau du tout,
// l'app pouvait mettre longtemps à s'ouvrir, voire ne pas s'ouvrir.
//
// Vite génère des fichiers au nom haché (index-a1b2c3.js) : un fichier
// statique comme celui-ci ne peut pas connaître leurs noms à l'avance. On ne
// pré-cache donc rien — on met en cache ce qui est demandé, au fur et à
// mesure, avec deux stratégies selon la nature de la requête.
const CACHE = 'ppl-v2';
const SHELL = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  // addAll échoue en bloc si un seul fichier manque : on les ajoute un par un
  // pour qu'une icône absente n'empêche pas le reste d'être mis en cache.
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) =>
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Supabase et compagnie : jamais de cache, ce sont des données vivantes.
  if (url.origin !== self.location.origin) return;

  // Les fichiers de /assets/ portent un hash dans leur nom : leur contenu ne
  // change jamais. Cache d'abord, réseau seulement si absent — c'est ce qui
  // rend l'ouverture instantanée et possible hors ligne.
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }))
    );
    return;
  }

  // Le reste (la page elle-même, le manifeste, les icônes) : réseau d'abord
  // pour ne pas servir une version périmée après un déploiement, cache en
  // secours quand il n'y a pas de réseau.
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('/index.html')))
  );
});

self.addEventListener('push', (event) => {
    let data = {};
    try {
      data = event.data ? event.data.json() : {};
    } catch (err) {
      data = { title: 'PPL Tracker', body: event.data ? event.data.text() : '' };
    }
    const title = data.title || 'PPL Tracker';
    const options = {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/' },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  });

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
    );
});
