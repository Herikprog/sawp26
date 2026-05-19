"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

// Função utilitária para converter a chave pública Base64 VAPID para Uint8Array (exigência do pushManager)
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  // 1. Registar o Service Worker em plano de fundo ao carregar
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("Service Worker registado com sucesso para push:", reg.scope);
      })
      .catch((err) => {
        console.error("Falha ao registar Service Worker:", err);
      });
  }, []);

  // 2. Função para subscrever o utilizador no browser e registar no Supabase
  const subscribeToPushNotifications = useCallback(async (userId: string) => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      console.warn("Push Notifications não são suportadas neste browser.");
      return false;
    }

    try {
      // Solicitar permissão nativa do sistema
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("Permissão de notificações recusada pelo utilizador.");
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();

      // Se não existir subscrição ativa neste browser, criamos uma nova
      if (!subscription) {
        const vapidPublicKey =
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
          "BGFxJ-VgRWYKUnG1i4n1lFK22yjVRwhl_MLBvcC4w098xt9IJlqgMq2HY3ENXzTzAi4k97O7KSHD0HlEv0g_ddU";
        
        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        });
      }

      // Extrair chaves criptográficas necessárias
      const p256dh = btoa(
        String.fromCharCode.apply(
          null,
          Array.from(new Uint8Array(subscription.getKey("p256dh")!))
        )
      );

      const auth = btoa(
        String.fromCharCode.apply(
          null,
          Array.from(new Uint8Array(subscription.getKey("auth")!))
        )
      );

      // Guardar na base de dados Supabase via upsert
      const supabase = createClient();
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh,
          auth,
          created_at: new Date().toISOString()
        },
        { onConflict: "user_id,endpoint" }
      );

      if (error) throw error;
      console.log("Subscrição Push registada com sucesso na conta do utilizador.");
      return true;
    } catch (err) {
      console.error("Erro ao subscrever às notificações push:", err);
      return false;
    }
  }, []);

  return { subscribeToPushNotifications };
}
