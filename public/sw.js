const CACHE_NAME = 'anesthos-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/data/sepsis_rules.json',
  '/data/sepsis_rules_vi.json',
  '/data/sugammadex_rules_vi.json',
  '/data/nora_locations.json',
  '/data/asra_guidelines.json',
  '/data/chronic_meds.json',
  '/data/chronic_meds_guidelines_vi.json',
  '/data/comorbidities.json',
  '/data/crisis_protocols.json',
  '/data/drugs.json',
  '/data/flag_mapping.json',
  '/data/lab_tests.json',
  '/data/lab_tests_info_vi.json',
  '/data/local_anesthetics.json',
  '/data/local_anesthetics_info_vi.json',
  '/data/nerve_blocks.json',
  '/data/nerve_blocks_info_vi.json',
  '/data/rules_adaptations.json',
  '/data/rules_adaptations_vi.json',
  '/data/rules_category_mapping.json',
  '/data/rules_trigger_labels.json',
  '/data/surgeries.json',
  '/data/provenance_manifest.json'
];

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event: any) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
