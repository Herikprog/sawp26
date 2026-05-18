"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Shuffle,
  Map,
  MessageCircle,
  User,
  Users,
  Search,
  Star,
  LogOut,
  Settings,
  Sun,
  Moon,
  Trophy,
  Sparkles,
  Menu,
  X
} from "lucide-react";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Início",          accent: "var(--primary)" },
  { href: "/search",    icon: Search,           label: "Pesquisa",       accent: "#FFB000" },
  { href: "/album",     icon: BookOpen,         label: "O Teu Álbum",    accent: "var(--success)" },
  { href: "/matches",   icon: Shuffle,          label: "Matches Elite",  accent: "#8B7BF7" },
  { href: "/map",       icon: Map,              label: "Radar GPS",      accent: "var(--warning)" },
  { href: "/chat",      icon: MessageCircle,    label: "Conversas",      accent: "#FF6B9D" },
  { href: "/feed",      icon: Users,            label: "Comunidade",     accent: "#00D68F" },
  { href: "/profile",   icon: User,             label: "O Meu Perfil",   accent: "var(--primary)" },
  { href: "/settings",  icon: Settings,         label: "Definições",     accent: "var(--text-muted)" },
];

import { useUnreadCounts } from "@/hooks/useUnreadCounts";

export default function Sidebar({ profile, email }: { profile: Profile | null, email?: string }) {
  const pathname = usePathname();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { unreadChat, unreadNotif } = useUnreadCounts();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const displayName = profile?.nome || email?.split("@")[0] || "Utilizador";

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const sidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      {/* Ambient decoration */}
      <div style={{
        position: "absolute", top: -80, left: -40, width: 200, height: 200,
        background: "var(--primary)", opacity: 0.04, borderRadius: "50%",
        filter: "blur(80px)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -60, right: -30, width: 160, height: 160,
        background: "var(--secondary)", opacity: 0.03, borderRadius: "50%",
        filter: "blur(60px)", pointerEvents: "none",
      }} />

      {/* Branding */}
      <div style={{ padding: "36px 28px 28px", position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: "var(--gradient-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
            boxShadow: "0 8px 24px -4px rgba(0,153,255,0.25)",
          }}>
            ⚽
          </div>
          <div>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 800,
              color: "var(--text-main)", letterSpacing: "-0.04em", lineHeight: 1,
            }}>
              Swap<span style={{ color: "var(--primary)" }}>26</span>
            </span>
            <p style={{
              fontSize: 9, fontWeight: 700, color: "var(--text-muted)",
              textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 2,
            }}>
              Copa do Mundo 2026
            </p>
          </div>
        </Link>
        {/* Mobile close button inside drawer */}
        <button className="md:hidden" onClick={() => setMobileMenuOpen(false)} style={{
          background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer",
          padding: 8
        }}>
          <X size={24} />
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: 2, position: "relative", zIndex: 1, overflowY: "auto" }}>
        {NAV.map(({ href, icon: Icon, label, accent }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: 14,
                textDecoration: "none",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                background: active ? "var(--primary-light)" : "transparent",
                color: active ? "var(--primary)" : "var(--text-muted)",
                border: active ? "1px solid var(--primary-light-strong)" : "1px solid transparent",
                position: "relative",
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
              {/* Active indicator bar */}
              {active && (
                <div style={{
                  position: "absolute", left: -12, top: "50%", transform: "translateY(-50%)",
                  width: 3, height: 24, borderRadius: "0 4px 4px 0",
                  background: "var(--gradient-primary)",
                }} />
              )}
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: active ? `${accent}18` : "transparent",
                transition: "all 0.25s ease",
              }}>
                <Icon size={19} strokeWidth={active ? 2.5 : 1.8}
                  style={{ color: active ? accent : undefined }}
                />
              </div>
              <span style={{ fontSize: 13.5, fontWeight: active ? 700 : 500 }}>{label}</span>

              {/* Chat badge */}
              {href === "/chat" && unreadChat > 0 && (
                <div style={{
                  marginLeft: "auto", padding: "2px 6px", borderRadius: 10, fontSize: 10, fontWeight: 800,
                  background: "var(--danger)", color: "#fff", boxShadow: "0 0 8px rgba(255,77,106,0.5)",
                }}>
                  {unreadChat}
                </div>
              )}

              {/* Notifications badge */}
              {href === "/feed" && unreadNotif > 0 && (
                <div style={{
                  marginLeft: "auto", width: 8, height: 8, borderRadius: "50%",
                  background: "var(--danger)", boxShadow: "0 0 8px rgba(255,77,106,0.5)",
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Premium CTA */}
      {profile && profile.plano !== "premium" && (
        <div style={{ padding: "0 16px 12px", position: "relative", zIndex: 1 }}>
          <Link href="/premium" style={{ textDecoration: "none" }}>
            <div style={{
              background: "linear-gradient(135deg, rgba(212,160,23,0.08), rgba(255,215,0,0.04))",
              border: "1px solid rgba(212,160,23,0.15)",
              borderRadius: 16, padding: "16px 18px",
              display: "flex", alignItems: "center", gap: 12,
              transition: "all 0.3s ease",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "var(--gradient-gold)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(212,160,23,0.25)",
              }}>
                <Trophy size={16} style={{ color: "#1A1100" }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)", margin: 0 }}>Swap26 PRO</p>
                <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>Desbloqueia tudo</p>
              </div>
              <Sparkles size={14} style={{ color: "var(--warning)" }} />
            </div>
          </Link>
        </div>
      )}

      {/* User Card */}
      {profile && (
        <div style={{ padding: "12px 16px 20px", borderTop: "1px solid var(--border-light)", position: "relative", zIndex: 1 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
            background: "var(--bg-hover-strong)", borderRadius: 16,
            border: "1px solid var(--border-light)",
          }}>
            <div style={{ position: "relative" }}>
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile.nome} width={40} height={40} style={{ borderRadius: 12, objectFit: "cover", height: "auto" }} />
              ) : (
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: "var(--gradient-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 800, color: "#fff",
                }}>
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
              {profile.is_online && (
                <div style={{
                  position: "absolute", bottom: -2, right: -2, width: 12, height: 12,
                  borderRadius: "50%", background: "var(--success)",
                  border: "2.5px solid var(--card-bg)",
                  boxShadow: "0 0 8px rgba(0,214,143,0.4)",
                }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {displayName}
              </p>
              {profile.plano === "premium" && (
                <div className="badge-pro" style={{ marginTop: 2 }}>
                  <Star size={8} style={{ fill: "var(--warning)" }} />
                  PRO
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  style={{
                    background: "var(--bg-hover-strong)", border: "1px solid var(--border-light)",
                    color: "var(--text-muted)", cursor: "pointer", padding: 6, borderRadius: 8,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                  title="Alternar Tema"
                >
                  {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                </button>
              )}
              <button
                onClick={handleLogout}
                style={{
                  background: "var(--bg-hover-strong)", border: "1px solid var(--border-light)",
                  color: "var(--text-muted)", cursor: "pointer", padding: 6, borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                title="Sair"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* MOBILE TOP NAVBAR */}
      <div className="md:hidden glass flex items-center justify-between" style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 64,
        padding: "0 20px", zIndex: 30, borderBottom: "1px solid var(--border-color)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "var(--gradient-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>
            ⚽
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.04em" }}>
            Swap<span style={{ color: "var(--primary)" }}>26</span>
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          style={{
            background: "transparent", border: "none", color: "var(--text-main)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            padding: 8,
          }}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden"
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)", zIndex: 40,
              }}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden"
              style={{
                position: "fixed", top: 0, left: 0, bottom: 0,
                width: 280, background: "var(--sidebar-bg)",
                backdropFilter: "blur(24px) saturate(180%)",
                borderRight: "1px solid var(--sidebar-border)",
                zIndex: 50,
              }}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <aside
        style={{
          flexDirection: "column",
          width: 280,
          background: "var(--sidebar-bg)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderRight: "1px solid var(--sidebar-border)",
          height: "100vh",
          position: "sticky",
          top: 0,
          zIndex: 40,
          overflow: "hidden",
        }}
        className="hidden md:flex"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
