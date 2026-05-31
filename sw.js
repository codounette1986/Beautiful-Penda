const CACHE_NAME = 'beautiful-penda-v10';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './beautiful-penda-logo.png'
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
  var request = event.request;
  if(request.method !== 'GET') return;

  var requestUrl = request.url || '';
  var isSameOrigin = requestUrl.indexOf(self.location.origin) === 0;
  var isSupabaseApi = requestUrl.indexOf('supabase.co') >= 0;

  if(isSupabaseApi){
    return;
  }

  if(request.mode === 'navigate'){
    event.respondWith(
      caches.match('./index.html').then(function(cached){
        var networkFetch = fetch(request).then(function(response){
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put('./index.html', copy);
          });
          return response;
        }).catch(function(){
          return cached || Response.error();
        });

        if(cached){
          event.waitUntil(networkFetch.then(function(){ return true; }, function(){ return false; }));
          return cached;
        }

        return networkFetch;
      })
    );
    return;
  }

  if(isSameOrigin){
    event.respondWith(
      caches.match(request).then(function(cached){
        if(cached) return cached;
        return fetch(request).then(function(response){
          var copy = response.clone();
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
