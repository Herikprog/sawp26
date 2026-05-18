"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function RealtimeManager() {
  const supabase = createClient();
  const router = useRouter();

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
