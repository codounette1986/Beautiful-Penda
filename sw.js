const CACHE_NAME = 'beautiful-penda-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './beautiful-penda-logo.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(APP_SHELL);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.map(function(key){
          if(key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event){
  const request = event.request;
  if(request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isSupabaseApi = url.origin.indexOf('supabase.co') >= 0;

  if(isSupabaseApi){
    return;
  }

  if(request.mode === 'navigate'){
    event.respondWith(
      fetch(request).then(function(response){
        const copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache){
          cache.put('./index.html', copy);
        });
        return response;
      }).catch(function(){
        return caches.match('./index.html');
      })
    );
    return;
  }

  if(isSameOrigin){
    event.respondWith(
      caches.match(request).then(function(cached){
        if(cached) return cached;
        return fetch(request).then(function(response){
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(request, copy);
          });
          return response;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(function(){
      return caches.match(request);
    })
  );
});
