// Service worker mínimo: permite instalar o app na tela inicial.
// Não guarda nada em cache para nunca mostrar dados desatualizados.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});

// Alertas (push): mostra a notificação e abre o app no lugar certo ao tocar.
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { titulo: 'Deixa Comigo', corpo: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Deixa Comigo', {
    body: d.corpo || '', icon: '/app/icone-192.png', badge: '/app/icone-192.png', data: { url: d.url || '/app/' }, tag: d.url || 'dxcmg'
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/app/', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
    const aberta = lista.find((c) => c.url.includes('/app/'));
    if (aberta) { aberta.focus(); return aberta.navigate(url); }
    return self.clients.openWindow(url);
  }));
});
