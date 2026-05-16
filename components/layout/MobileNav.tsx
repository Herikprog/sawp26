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

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
  { href: "/album",     icon: BookOpen,         label: "Álbum" },
  { href: "/matches",   icon: Shuffle,          label: "Matches" },
  { href: "/map",       icon: Map,              label: "GPS" },
  { href: "/feed",      icon: Users,            label: "Comunidade" },
  { href: "/chat",      icon: MessageCircle,    label: "Chat" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "var(--bg-main-transparent)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border-color)",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        paddingTop: 10,
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
              gap: 3, textDecoration: "none", flex: 1,
            }}
          >
            <div style={{
              padding: "6px 16px", borderRadius: 14,
              background: active ? "var(--primary-light-strong)" : "transparent",
              color: active ? "var(--primary)" : "var(--text-muted)",
              transition: "all 0.2s ease", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Icon size={21} strokeWidth={active ? 2.5 : 2} />
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
