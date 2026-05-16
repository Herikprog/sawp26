"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import Image from "next/image";
import {
  LayoutDashboard,
  BookOpen,
  Shuffle,
  Map,
  MessageCircle,
  User,
  Users,
  Star,
  LogOut,
  Settings,
  Sun,
  Moon
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
  { href: "/album",     icon: BookOpen,         label: "O Teu Álbum" },
  { href: "/matches",   icon: Shuffle,          label: "Matches Elite" },
  { href: "/map",       icon: Map,              label: "Radar GPS" },
  { href: "/chat",      icon: MessageCircle,    label: "Conversas" },
  { href: "/feed",      icon: Users,            label: "Comunidade" },
  { href: "/profile",   icon: User,             label: "O Meu Perfil" },
  { href: "/settings",  icon: Settings,         label: "Definições" },
];

export default function Sidebar({ profile, email }: { profile: Profile | null, email?: string }) {
  const pathname = usePathname();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName = profile?.nome || email?.split("@")[0] || "Utilizador";

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside
      style={{
        flexDirection: "column", width: 280,
        background: "var(--bg-main)", borderRight: "1px solid rgba(255,255,255,0.06)",
        height: "100vh", position: "sticky", top: 0,
        zIndex: 40,
      }}
      className="hidden md:flex"
    >
      {/* Branding */}
      <div style={{ padding: "40px 32px 32px" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, background: "var(--text-main)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            boxShadow: "0 0 30px rgba(255,255,255,0.05)",
          }}>
            ⚽
          </div>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 800,
            color: "var(--text-main)", letterSpacing: "-0.04em",
          }}>
            Swap<span style={{ color: "var(--primary)" }}>26</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "0 16px", display: "flex", flexDirection: "column", gap: 6 }}>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", borderRadius: 14,
                textDecoration: "none", transition: "all 0.2s ease",
                background: active ? "var(--primary-light)" : "transparent",
                color: active ? "var(--primary)" : "var(--text-muted)",
                border: active ? "1px solid rgba(0,174,239,0.15)" : "1px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "var(--bg-hover-strong)";
                  e.currentTarget.style.color = "var(--text-main)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-muted)";
                }
              }}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span style={{ fontSize: 14, fontWeight: active ? 700 : 500 }}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Card */}
      {profile && (
        <div style={{ padding: 24, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: 12,
            background: "var(--card-bg)", borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ position: "relative" }}>
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile.nome} width={40} height={40} style={{ borderRadius: 12, objectFit: "cover" }} />
              ) : (
                <div style={{
                  width: 40, height: 40, borderRadius: 12, background: "var(--input-bg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, color: "var(--primary)",
                }}>
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
              {profile.is_online && (
                <div style={{
                  position: "absolute", bottom: -2, right: -2, width: 12, height: 12,
                  borderRadius: "50%", background: "var(--success)", border: "3px solid var(--card-bg)",
                }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {displayName}
              </p>
              {profile.plano === "premium" && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <Star size={10} style={{ color: "var(--warning)", fill: "var(--warning)" }} />
                  <span style={{ fontSize: 9, fontWeight: 900, color: "var(--warning)", textTransform: "uppercase", letterSpacing: "0.1em" }}>PRO</span>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {mounted && (
                <button 
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")} 
                  style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
                  title="Alternar Tema"
                >
                  {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              )}
              <button onClick={handleLogout} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }} title="Sair">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
