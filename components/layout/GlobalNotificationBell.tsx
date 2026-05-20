"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Heart, MessageSquare, Repeat2, UserPlus, CheckCheck, X, Shield, ShieldAlert, AlertTriangle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import toast from "react-hot-toast";

export default function GlobalNotificationBell({ isMobile = false }: { isMobile?: boolean }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => {
      const u = res?.data?.user;
      if (u?.email) setEmail(u.email);
    });
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Carregar contagens e lista de notificações
  async function loadNotifications() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Buscar notificações
    const { data, error } = await supabase
      .from("social_notifications")
      .select("*, actor:profiles!social_notifications_actor_id_fkey(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(15);

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setNotifications(data);
      // Calcular não lidas
      const unreads = data.filter((n: any) => !n.is_read).length;
      setUnreadCount(unreads);
    }
  }

  useEffect(() => {
    loadNotifications();

    // Ouvir mudanças em tempo real na tabela de notificações
    const channelName = `global-bell-notifs-${isMobile ? "mobile" : "desktop"}`;
    const channel = supabase.channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "social_notifications" },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, isMobile]);

  // Marcar todas como lidas automaticamente ao abrir o painel
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length > 0) {
        // Feedback visual instantâneo local para máxima responsividade
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);

        // Atualizar no Supabase em background
        supabase
          .from("social_notifications")
          .update({ is_read: true })
          .in("id", unreadIds)
          .then(({ error }: any) => {
            if (error) {
              console.error("Erro ao marcar notificações como lidas automaticamente:", error);
            }
          });
      }
    }
  }, [isOpen, unreadCount, notifications, supabase]);

  // Marcar todas como lidas manualmente (Melhoria do sistema!)
  async function handleMarkAllAsRead() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length > 0) {
        const { error } = await supabase
          .from("social_notifications")
          .update({ is_read: true })
          .in("id", unreadIds);

        if (error) throw error;
        
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        toast.success("Todas as notificações marcadas como lidas!");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao limpar notificações.");
    } finally {
      setLoading(false);
    }
  }

  // Marcar uma notificação específica como lida ao clicar
  async function handleNotificationClick(n: any) {
    if (!n.is_read) {
      await supabase.from("social_notifications").update({ is_read: true }).eq("id", n.id);
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setIsOpen(false);
  }

  function getNotificationContent(n: any) {
    const actorName = n.actor?.nome || "Administrador";
    // admin_reply e admin_action usam n.content diretamente
    if (n.type === "admin_reply") {
      return {
        icon: <MessageSquare size={12} color="#4a9eff" />,
        text: <span><b>Suporte</b>: {n.content || "A tua mensagem foi respondida pelo administrador."}</span>
      };
    }
    if (n.type === "admin_action") {
      const isBan = n.content?.includes("banida") || n.content?.includes("suspensa");
      return {
        icon: <ShieldAlert size={12} color={isBan ? "#f87171" : "#34d399"} />,
        text: <span><b>Administrador</b>: {n.content || "A tua conta foi atualizada."}</span>
      };
    }
    switch (n.type) {
      case "like": 
        return { 
          icon: <Heart size={12} fill="var(--danger)" color="var(--danger)" />, 
          text: <span><b>{actorName}</b> gostou da tua publicação.</span> 
        };
      case "repost": 
        return { 
          icon: <Repeat2 size={12} color="var(--success)" />, 
          text: <span><b>{actorName}</b> republicou a tua publicação.</span> 
        };
      case "reply": 
        return { 
          icon: <MessageSquare size={12} color="var(--primary)" />, 
          text: <span><b>{actorName}</b> respondeu ao teu comentário.</span> 
        };
      case "follow": 
        return { 
          icon: <UserPlus size={12} color="#8b5cf6" />, 
          text: <span><b>{actorName}</b> começou a seguir-te.</span> 
        };
      case "trade": 
        return { 
          icon: <Repeat2 size={12} color="var(--warning)" />, 
          text: <span><b>{actorName}</b> enviou uma proposta de troca!</span> 
        };
      default: 
        return { 
          icon: <Bell size={12} />, 
          text: <span>{n.content || `Nova notificação de `}<b>{actorName}</b>.</span> 
        };
    }
  }

  // Estilo Desktop Flutuante vs Estilo Mobile Header
  const bellButtonStyles: React.CSSProperties = isMobile 
    ? {
        background: "transparent", border: "none", color: "var(--text-main)",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        padding: 8, position: "relative"
      }
    : {
        position: "fixed", top: 14, right: 16, zIndex: 100,
        width: 44, height: 44, borderRadius: 14,
        background: "rgba(10, 22, 40, 0.7)", backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-main)", cursor: "pointer",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      };

  const adminButtonStyles: React.CSSProperties = isMobile
    ? {
        background: "rgba(239, 68, 68, 0.12)",
        border: "1px solid rgba(239, 68, 68, 0.25)",
        color: "#f87171",
        width: 36, height: 36, borderRadius: 10,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", textDecoration: "none",
        transition: "all 0.2s ease"
      }
    : {
        position: "fixed", top: 14, right: 70, zIndex: 100,
        width: 44, height: 44, borderRadius: 14,
        background: "rgba(239, 68, 68, 0.12)", backdropFilter: "blur(12px)",
        border: "1px solid rgba(239, 68, 68, 0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#f87171", cursor: "pointer", textDecoration: "none",
        boxShadow: "0 8px 32px rgba(239, 68, 68, 0.1)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      };

  return (
    <>
      {email?.toLowerCase() === "bragawork01@gmail.com" && (
        <Link href="/admin" style={adminButtonStyles} title="Painel Admin">
          <Shield size={isMobile ? 16 : 20} />
        </Link>
      )}
      <div ref={dropdownRef} style={{ position: isMobile ? "relative" : "static" }}>
      {/* 🔔 BOTÃO DO SININHO */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={bellButtonStyles}
        className={!isMobile ? "desktop-global-bell" : ""}
      >
        <Bell size={20} className={unreadCount > 0 ? "bell-ringing" : ""} />
        
        {/* Badge Neon Pulsante de Não Lidas */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              style={{
                position: "absolute", top: isMobile ? 4 : 8, right: isMobile ? 4 : 8,
                background: "var(--danger)", color: "#fff",
                fontSize: 9, fontWeight: 900, minWidth: 16, height: 16,
                borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 4px", border: "2px solid var(--bg-main)",
                boxShadow: "0 0 10px rgba(255,77,106,0.6)"
              }}
            >
              {unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* 📂 DROPDOWN DE NOTIFICAÇÕES POPUP */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              position: "fixed", 
              top: isMobile ? 60 : 70, 
              right: isMobile ? 12 : 24, 
              width: 350, 
              maxHeight: 480, 
              overflow: "hidden",
              background: "rgba(10, 25, 47, 0.95)", 
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.08)", 
              borderRadius: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)", 
              zIndex: 99999, 
              display: "flex", 
              flexDirection: "column"
            }}
          >
            {/* Header Dropdown */}
            <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-main)" }}>Notificações</h3>
              
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  style={{
                    background: "transparent", border: "none", color: "var(--primary)",
                    fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex",
                    alignItems: "center", gap: 4, transition: "color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#00c3ff"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--primary)"}
                >
                  <CheckCheck size={13} /> Marcar todas lidas
                </button>
              )}
            </div>

            {/* Lista Scrollável */}
            <div style={{ flex: 1, overflowY: "auto", padding: 8, maxHeight: 380 }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                  <Bell size={32} style={{ opacity: 0.15, margin: "0 auto 12px" }} />
                  Nenhuma notificação por aqui.
                </div>
              ) : (
                notifications.map((n) => {
                  const { icon, text } = getNotificationContent(n);
                  // Routing: admin notifications → /support, follow → profile, posts → feed
                  const isAdminNotif = n.type === "admin_reply" || n.type === "admin_action";
                  const linkHref = isAdminNotif
                    ? "/support"
                    : n.type === "follow"
                    ? `/profile/${n.actor?.id}`
                    : n.post_id
                    ? `/feed#post-${n.post_id}`
                    : "#";

                  return (
                    <Link
                      key={n.id}
                      href={linkHref}
                      onClick={() => handleNotificationClick(n)}
                      style={{
                        display: "flex", gap: 12, padding: "12px 14px", textDecoration: "none", color: "inherit",
                        background: n.is_read ? "transparent" : "rgba(0, 174, 239, 0.05)",
                        borderRadius: 16, transition: "background 0.2s ease",
                        marginBottom: 4, position: "relative",
                        border: n.is_read ? "1px solid transparent" : "1px solid rgba(0, 174, 239, 0.1)"
                      }}
                      className="notification-item"
                    >
                      {/* Avatar do Autor */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--input-bg)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {n.actor?.avatar_url ? (
                            <Image src={n.actor.avatar_url} alt="" width={40} height={40} style={{ objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: 40, height: 40, background: "var(--gradient-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
                              {n.actor?.nome ? n.actor.nome[0].toUpperCase() : "?"}
                            </div>
                          )}
                        </div>
                        {/* Ícone de Ação Flutuante */}
                        <div style={{
                          position: "absolute", bottom: -4, right: -4, width: 18, height: 18,
                          borderRadius: "50%", background: "rgba(10,25,47,0.95)", display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.3)", border: "1.5px solid rgba(255,255,255,0.06)"
                        }}>
                          {icon}
                        </div>
                      </div>

                      {/* Conteúdo Textual */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, margin: "0 0 4px 0", lineHeight: 1.4, color: "var(--text-main)" }}>
                          {text}
                        </p>
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pt })}
                        </span>
                      </div>

                      {/* Bolinha Azul Indicadora de Não Lido */}
                      {!n.is_read && (
                        <div style={{
                          width: 6, height: 6, borderRadius: "50%", background: "var(--primary)",
                          position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                          boxShadow: "0 0 6px var(--primary)"
                        }} />
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ESTILOS INTERATIVOS DE ANIMAÇÃO DO SININHO */}
      <style jsx global>{`
        .desktop-global-bell:hover {
          background: rgba(10, 22, 40, 0.9) !important;
          border-color: rgba(0, 174, 239, 0.4) !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0, 174, 239, 0.25) !important;
        }
        .notification-item:hover {
          background: rgba(255, 255, 255, 0.02) !important;
        }
        .bell-ringing {
          animation: ring 2.5s infinite ease-in-out;
          transform-origin: top center;
        }
        @keyframes ring {
          0% { transform: rotate(0); }
          5% { transform: rotate(15deg); }
          10% { transform: rotate(-15deg); }
          15% { transform: rotate(10deg); }
          20% { transform: rotate(-10deg); }
          25% { transform: rotate(6deg); }
          30% { transform: rotate(-6deg); }
          35% { transform: rotate(3deg); }
          40% { transform: rotate(-3deg); }
          45% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
      `}</style>
    </div>
    </>
  );
}
