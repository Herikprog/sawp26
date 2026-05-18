"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function RealtimeManager() {
  const supabase = createClient();
  const router = useRouter();

  // ─── Atualização de Localização em Segundo Plano ───
  useEffect(() => {
    async function updateLocation() {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Padrão PostGIS: POINT(longitude latitude)
            const point = `POINT(${pos.coords.longitude} ${pos.coords.latitude})`;
            
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

  // ─── Ouvintes em Tempo Real (Realtime Subscriptions) ───
  useEffect(() => {
    const channel = supabase.channel("global-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        router.refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "social_notifications" }, () => {
        router.refresh();
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
