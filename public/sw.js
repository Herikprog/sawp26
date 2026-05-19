// ============================================================
// SERVICE WORKER — SWAP26 NOTIFICAÇÕES PUSH EM SEGUNDO PLANO
// ============================================================

self.addEventListener("push", function (event) {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (err) {
    // Caso o payload venha em texto simples
    payload = {
      title: "Swap26",
      body: event.data.text()
    };
  }

  const title = payload.title || "Nova Notificação";
  const options = {
    body: payload.body || "Tem uma nova atualização na sua conta!",
    icon: payload.icon || "/file.svg", // Ícone que representa a app
    badge: payload.badge || "/file.svg", // Ícone pequeno na barra de estado (Android)
    vibrate: [100, 50, 100],
    data: {
      url: payload.url || "/feed" // URL para onde redirecionar no clique
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const redirectUrl = event.notification.data.url 
    ? new URL(event.notification.data.url, self.location.origin).href
    : self.location.origin + "/feed";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // Se já houver uma aba aberta, foca-a e navega
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === redirectUrl && "focus" in client) {
          return client.focus();
        }
      }
      // Se não houver abas abertas, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(redirectUrl);
      }
    })
  );
});
