"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Shuffle,
  Map,
  MessageCircle,
  Users,
} from "lucide-react";

import { useUnreadCounts } from "@/hooks/useUnreadCounts";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
  { href: "/album",     icon: BookOpen,         label: "Álbum" },
  { href: "/matches",   icon: Shuffle,          label: "Matches" },
  { href: "/map",       icon: Map,              label: "GPS" },
  { href: "/feed",      icon: Users,            label: "Social" },
  { href: "/chat",      icon: MessageCircle,    label: "Chat" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { unreadChat, unreadNotif } = useUnreadCounts();

  return (
    <nav
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "var(--bg-main-transparent)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderTop: "1px solid var(--border-color)",
        paddingBottom: "max(10px, env(safe-area-inset-bottom))",
        paddingTop: 8,
        display: "flex", justifyContent: "space-around", alignItems: "center",
        zIndex: 50,
      }}
      className="md:hidden"
    >
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 2, textDecoration: "none", flex: 1, position: "relative",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{
              padding: "6px 18px", borderRadius: 12,
              background: active ? "var(--primary-light-strong)" : "transparent",
              color: active ? "var(--primary)" : "var(--text-muted)",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: active ? "scale(1.05)" : "scale(1)",
              boxShadow: active ? "0 4px 12px rgba(0,153,255,0.1)" : "none",
              position: "relative"
            }}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              
              {/* Chat Unread Badge */}
              {href === "/chat" && unreadChat > 0 && (
                <div style={{
                  position: "absolute", top: -2, right: 2, background: "var(--danger)",
                  color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 5px",
                  borderRadius: 10, boxShadow: "0 2px 4px rgba(255,77,106,0.5)",
                  border: "2px solid var(--bg-main)"
                }}>
                  {unreadChat}
                </div>
              )}

              {/* Notification Badge */}
              {href === "/feed" && unreadNotif > 0 && (
                <div style={{
                  position: "absolute", top: 2, right: 6, background: "var(--danger)",
                  width: 8, height: 8, borderRadius: "50%",
                  boxShadow: "0 2px 4px rgba(255,77,106,0.5)",
                  border: "2px solid var(--bg-main)"
                }} />
              )}
            </div>
            <span style={{
              fontSize: 9, fontWeight: active ? 800 : 500,
              color: active ? "var(--primary)" : "var(--text-muted)",
              textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1
            }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
