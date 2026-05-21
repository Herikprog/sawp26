"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import toast from "react-hot-toast";

export default function RealtimeManager() {
  const supabase = createClient();
  const router = useRouter();
  const { subscribeToPushNotifications } = usePushNotifications();

  // ─── Subscrição de Notificações Push ───
  useEffect(() => {
    async function initPush() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Apenas atualizar silenciosamente se a permissão já foi explicitamente concedida
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          await subscribeToPushNotifications(user.id);
        }
      } catch (err) {
        console.error("Erro ao inicializar notificações push:", err);
      }
    }
    
    // Aguardar 3 segundos para priorizar o carregamento inicial da página
    const timer = setTimeout(initPush, 3000);
    return () => clearTimeout(timer);
  }, [supabase, subscribeToPushNotifications]);

  // ─── Atualização de Localização em Segundo Plano ───
  useEffect(() => {
    async function updateLocation() {
      if (typeof window !== "undefined") {
        const consent = localStorage.getItem("trocastickers_location_consent");
        if (consent !== "true") {
          console.log("Geolocalização pendente de consentimento explícito do utilizador.");
          return;
        }
      }

      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const lon = pos.coords.longitude;
            const lat = pos.coords.latitude;
            
            // Validar coordenadas do GPS (evitar falsificação extrema)
            if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
              console.warn("Coordenadas GPS inválidas");
              return;
            }

            // Padrão PostGIS: POINT(longitude latitude)
            const point = `POINT(${lon} ${lat})`;
            
            const { error } = await supabase.from("profiles")
              .update({ location: point })
              .eq("id", user.id);
              
            if (error) {
              console.error("Erro ao registrar geolocalização no Supabase:", error);
            } else {
              // Atualiza a tela de forma reativa para disparar novos matches imediatamente
              router.refresh();
            }
          } catch (err) {
            console.error("Falha ao salvar localização:", err);
          }
        },
        (err) => console.warn("Permissão de geolocalização não concedida pelo utilizador:", err.message),
        { enableHighAccuracy: false, timeout: 8000 }
      );
    }

    updateLocation();
  }, [supabase, router]);

  // ─── Atualização de Status Online (Heartbeat) ───
  useEffect(() => {
    let activeUser: string | null = null;

    const setOnline = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        activeUser = user.id;

        await supabase
          .from("profiles")
          .update({ is_online: true, last_seen: new Date().toISOString() })
          .eq("id", user.id);
      } catch (_) {}
    };

    const setOffline = async () => {
      if (!activeUser) return;
      try {
        await supabase
          .from("profiles")
          .update({ is_online: false, last_seen: new Date().toISOString() })
          .eq("id", activeUser);
      } catch (_) {}
    };

    setOnline();
    const interval = setInterval(setOnline, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setOnline();
      } else {
        setOffline();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", setOffline);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", setOffline);
      setOffline();
    };
  }, [supabase]);

  // ─── Ouvintes em Tempo Real (Realtime Subscriptions) ───
  useEffect(() => {
    const channel = supabase.channel("global-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        router.refresh();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "social_notifications" }, async (payload: any) => {
        router.refresh();
        const newNotif = payload.new;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user || newNotif.user_id !== user.id || newNotif.actor_id === user.id) return;

          // Buscar dados do ator da ação
          const { data: actor } = await supabase.from("profiles")
            .select("nome")
            .eq("id", newNotif.actor_id)
            .single();

          if (!actor) return;

          let message = "";
          let icon = "🔔";

          switch (newNotif.type) {
            case "like":
              message = "gostou do teu post!";
              icon = "❤️";
              break;
            case "reply":
              message = "comentou no teu post!";
              icon = "💬";
              break;
            case "follow":
              message = "começou a seguir-te!";
              icon = "👤";
              break;
            case "trade":
              message = "propôs-te uma troca de figurinhas!";
              icon = "🔄";
              break;
            default:
              message = "enviou um alerta.";
          }

          toast.custom((t) => (
            <div
              style={{
                background: "rgba(10, 25, 47, 0.96)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 16,
                padding: "14px 18px",
                color: "#fff",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                alignItems: "center",
                gap: 12,
                display: "flex",
                minWidth: 280,
                animation: t.visible ? "enter 0.2s ease-out" : "leave 0.15s ease-in forwards",
                pointerEvents: "auto"
              }}
            >
              <div style={{ fontSize: 22, display: "flex", alignItems: "center" }}>{icon}</div>
              <div style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700, color: "var(--primary)" }}>{actor.nome}</span>{" "}
                <span style={{ color: "var(--text-sec)" }}>{message}</span>
              </div>
            </div>
          ), { duration: 4000 });
        } catch (err) {
          console.error("Erro ao mostrar toast em tempo real:", err);
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload: any) => {
        router.refresh();
        const newMsg = payload.new;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user || newMsg.sender_id === user.id) return;

          // Verificar se eu sou participante desta conversa
          const { data: conv } = await supabase.from("conversations")
            .select("user_a_id, user_b_id")
            .eq("id", newMsg.conversation_id)
            .single();

          if (!conv || (conv.user_a_id !== user.id && conv.user_b_id !== user.id)) return;

          // Ignorar se eu já estiver com a janela de chat dessa conversa aberta
          if (typeof window !== "undefined" && window.location.pathname.includes(`/chat/${newMsg.conversation_id}`)) {
            return;
          }

          // Buscar nome do remetente
          const { data: sender } = await supabase.from("profiles")
            .select("nome")
            .eq("id", newMsg.sender_id)
            .single();

          if (!sender) return;

          toast.custom((t) => (
            <div
              style={{
                background: "rgba(10, 25, 47, 0.96)",
                border: "1px solid rgba(0, 174, 239, 0.3)",
                borderRadius: 16,
                padding: "14px 18px",
                color: "#fff",
                boxShadow: "0 10px 30px rgba(0, 174, 239, 0.15)",
                alignItems: "center",
                gap: 12,
                display: "flex",
                minWidth: 280,
                animation: t.visible ? "enter 0.2s ease-out" : "leave 0.15s ease-in forwards",
                pointerEvents: "auto"
              }}
            >
              <div style={{ fontSize: 22, display: "flex", alignItems: "center" }}>💬</div>
              <div style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>
                <div style={{ fontWeight: 700, color: "var(--primary)" }}>{sender.nome}</div>
                <div style={{ color: "var(--text-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: 200 }}>
                  {newMsg.content || "Enviou uma figurinha ou proposta."}
                </div>
              </div>
            </div>
          ), { duration: 4500 });
        } catch (err) {
          console.error("Erro ao mostrar toast de mensagem em tempo real:", err);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "follows" }, () => {
        router.refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_stickers" }, () => {
        router.refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        router.refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "post_likes" }, () => {
        router.refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "trades" }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, supabase]);

  return null;
}
