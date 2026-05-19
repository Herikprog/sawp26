"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUnreadCounts() {
  const [unreadChat, setUnreadChat] = useState(0);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function loadCounts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Unread notifications
      const { count: notifCount } = await supabase
        .from("social_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      
      setUnreadNotif(notifCount || 0);

      // Unread chats
      const { count: chatCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("read", false)
        .not("sender_id", "eq", user.id) // Only messages sent by others
        // Requires a join or we can just fetch all unread messages for conversations where user is participant.
        // But since we can't join in count easily with RLS, we rely on the RLS policy!
        // RLS msg_select_participant allows us to select messages if we are in the conversation.
        // So fetching all unread messages where sender != me is exactly the unread chat count!
      
      setUnreadChat(chatCount || 0);
    }

    loadCounts();

    const channelId = `global-counts-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase.channel(channelId)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        loadCounts();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "social_notifications" }, () => {
        loadCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return { unreadChat, unreadNotif };
}
