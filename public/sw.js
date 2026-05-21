// ============================================================
// SERVICE WORKER — TROCA STICKERS NOTIFICAÇÕES PUSH EM SEGUNDO PLANO
// ============================================================

/**
 * Sanitizar URL para evitar open redirect / XSS
 * Apenas permitir URLs relativas ao domínio da aplicação
 */
function sanitizeRedirectUrl(url) {
  if (!url) return null;

  try {
    // Tentar parsear como URL
    const parsed = new URL(url, self.location.origin);

    // Validação:
    // 1. URL deve ser do mesmo domínio
    // 2. URL deve começar com /
    // 3. Não permitir javascript: ou data: URLs
    if (
      parsed.origin !== self.location.origin ||
      !parsed.pathname.startsWith("/") ||
      url.startsWith("javascript:") ||
      url.startsWith("data:")
    ) {
      console.warn(`[SW] Tentativa de redirect para URL suspeita bloqueada: ${url}`);
      return null;
    }

    return parsed.href;
  } catch (err) {
    // URL inválida
    return null;
  }
}

self.addEventListener("push", function (event) {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (err) {
    // Caso o payload venha em texto simples
    payload = {
      title: "Troca Stickers",
      body: event.data.text()
    };
  }

  const title = String(payload.title || "Nova Notificação").substring(0, 200);
  const body = String(payload.body || "Tem uma nova atualização na sua conta!").substring(0, 500);
  
  const options = {
    body: body,
    icon: "/favicon.ico", // Ícone que representa a app
    badge: "/favicon.ico", // Ícone pequeno na barra de estado (Android)
    vibrate: [100, 50, 100],
    data: {
      // URL SANITIZADA — evitar redirecionamento malicioso
      url: sanitizeRedirectUrl(payload.url) || "/feed"
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const safeUrl = event.notification.data.url;
  if (!safeUrl || typeof safeUrl !== "string") {
    console.error("[SW] URL de redirecionamento inválida");
    event.waitUntil(clients.openWindow(self.location.origin + "/feed"));
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // Se já houver uma aba aberta, foca-a e navega
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === safeUrl && "focus" in client) {
          return client.focus();
        }
      }
      // Se não houver abas abertas, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(safeUrl);
      }
    })
  );
});
