"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { Heart, MessageSquare, Repeat2, UserPlus, Bell } from "lucide-react";

export default function NotificationsPopup({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    async function loadNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("social_notifications")
        .select("*, actor:profiles!social_notifications_actor_id_fkey(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data);
        
        // Mark as read
        const unread = data.filter((n: any) => !n.is_read).map((n: any) => n.id);
        if (unread.length > 0) {
          await supabase.from("social_notifications").update({ is_read: true }).in("id", unread);
        }
      }
      setLoading(false);
    }
    loadNotifications();
  }, [supabase]);

  function getNotificationContent(n: any) {
    const actorName = n.actor?.nome || "Alguém";
    switch (n.type) {
      case "like": return { icon: <Heart size={12} fill="var(--danger)" color="var(--danger)" />, text: <span><b>{actorName}</b> gostou da tua publicação.</span> };
      case "repost": return { icon: <Repeat2 size={12} color="var(--success)" />, text: <span><b>{actorName}</b> republicou.</span> };
      case "reply": return { icon: <MessageSquare size={12} color="var(--primary)" />, text: <span><b>{actorName}</b> respondeu-te.</span> };
      case "follow": return { icon: <UserPlus size={12} color="#8b5cf6" />, text: <span><b>{actorName}</b> seguiu-te.</span> };
      default: return { icon: <Bell size={12} />, text: <span>Nova notificação de <b>{actorName}</b>.</span> };
    }
  }

  return (
    <div 
      ref={popupRef}
      style={{
        position: "absolute", top: 48, right: 0, width: 340, maxHeight: 400, overflowY: "auto",
        background: "var(--card-bg)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20,
        boxShadow: "0 15px 50px -10px rgba(0,0,0,0.6)", zIndex: 100, display: "flex", flexDirection: "column"
      }}
    >
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", position: "sticky", top: 0, background: "var(--card-bg)", zIndex: 2 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Notificações</h3>
      </div>

      <div style={{ padding: 8 }}>
        {loading ? (
          <div style={{ padding: 30, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>A carregar...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            <Bell size={28} style={{ opacity: 0.2, margin: "0 auto 12px" }} />
            Não tens notificações.
          </div>
        ) : (
          notifications.map(n => {
            const { icon, text } = getNotificationContent(n);
            const linkHref = n.type === "follow" ? `/u/${n.actor?.username}` : (n.post_id ? `/feed#post-${n.post_id}` : "#");
            return (
              <Link key={n.id} href={linkHref} onClick={onClose} style={{
                display: "flex", gap: 12, padding: "12px", textDecoration: "none", color: "inherit",
                background: n.is_read ? "transparent" : "var(--primary-light)",
                borderRadius: 14, transition: "background 0.2s ease"
              }} className="hover-row">
                <div style={{ position: "relative" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--input-bg)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {n.actor?.avatar_url ? (
                      <Image src={n.actor.avatar_url} alt="" width={40} height={40} style={{ objectFit: "cover" }} />
                    ) : (
                      <UserPlus size={18} style={{ color: "var(--text-muted)" }} />
                    )}
                  </div>
                  <div style={{
                    position: "absolute", bottom: -2, right: -2, width: 20, height: 20,
                    borderRadius: "50%", background: "var(--card-bg)", display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                  }}>
                    {icon}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, margin: "0 0 4px 0", lineHeight: 1.4 }}>{text}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pt })}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
