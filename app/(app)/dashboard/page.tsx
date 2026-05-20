import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Shuffle, MessageCircle, Users, TrendingUp, ChevronRight, Trophy, Star, Zap, MapPin, Target, Flame } from "lucide-react";
import GlobalAnnouncements from "@/components/GlobalAnnouncements";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");


  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();

  const { data: rawStats } = await supabase
    .rpc("get_album_stats", { p_user_id: user.id })
    .single();
  const stats = rawStats as any;

  const pct = stats?.completion_pct ?? 0;
  const rawName = profile?.nome || user.email?.split("@")[0] || "Colecionador";
  const nome = rawName.split(" ")[0];

  // Determine greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  // Progress milestones
  const nextMilestone = pct < 25 ? 25 : pct < 50 ? 50 : pct < 75 ? 75 : 100;
  const stickersToMilestone = Math.ceil(((nextMilestone - pct) / 100) * (stats?.total_stickers ?? 680));

  return (
    <div className="pattern-bg" style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px", position: "relative" }}>

      {/* Global Announcements Banner */}
      <GlobalAnnouncements />

      {/* Ambient orbs */}
      <div className="orb" style={{ top: -120, right: -80, width: 400, height: 400, background: "var(--primary)", opacity: 0.04 }} />
      <div className="orb" style={{ bottom: -100, left: -60, width: 300, height: 300, background: "var(--secondary)", opacity: 0.03 }} />

      {/* ─── Header ─── */}
      <header style={{ marginBottom: 48, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 100,
            background: "var(--primary-light)", border: "1px solid var(--primary-light-strong)",
          }}>
            <Flame size={13} style={{ color: "var(--primary)" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>Copa do Mundo 2026</span>
          </div>
        </div>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(32px, 5vw, 52px)",
          fontWeight: 700, color: "var(--text-main)", marginBottom: 12, letterSpacing: "-0.03em", lineHeight: 1.1,
        }}>
          {greeting}, <span style={{
            background: "var(--gradient-primary)", WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>{nome}</span>
        </h1>
        <p style={{ color: "var(--text-sec)", fontSize: 17, maxWidth: 520, lineHeight: 1.6 }}>
          Acompanha o teu progresso e encontra parceiros de troca próximos.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28, position: "relative", zIndex: 1 }}
        className="dashboard-grid"
      >
        {/* ─── Progress Hero Card ─── */}
        <div style={{
          background: "var(--glass-bg)", borderRadius: 32,
          border: "1px solid var(--glass-border)",
          padding: "48px", position: "relative", overflow: "hidden",
          boxShadow: "var(--shadow-lg), inset 0 1px 0 rgba(255,255,255,0.1)",
          backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
        }}>
          {/* Holographic light sweep */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 6s infinite linear",
            pointerEvents: "none", zIndex: 0
          }} />

          {/* Deep Ambient glow */}
          <div className="pulse-glow" style={{
            position: "absolute", top: "-20%", right: "-10%", width: 400, height: 400,
            background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)", 
            opacity: 0.15, borderRadius: "50%",
            filter: "blur(60px)", pointerEvents: "none", zIndex: 0
          }} />
          <div className="pulse-glow" style={{
            position: "absolute", bottom: "-30%", left: "0%", width: 300, height: 300,
            background: "radial-gradient(circle, var(--secondary) 0%, transparent 70%)", 
            opacity: 0.1, borderRadius: "50%",
            filter: "blur(50px)", pointerEvents: "none", zIndex: 0, animationDelay: "2s"
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ padding: 6, background: "rgba(0,174,239,0.1)", borderRadius: 8, border: "1px solid rgba(0,174,239,0.2)" }}>
                    <Target size={14} style={{ color: "var(--primary)" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-sec)" }}>
                    Progresso Geral
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span className="stat-number" style={{
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 64, fontWeight: 800,
                    background: "var(--gradient-primary)", WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent", backgroundClip: "text",
                    filter: "drop-shadow(0 4px 12px rgba(0,174,239,0.3))"
                  }}>{pct}</span>
                  <span style={{ fontSize: 24, fontWeight: 700, color: "var(--text-muted)" }}>%</span>
                </div>
                {stickersToMilestone > 0 && pct < 100 && (
                  <div style={{ 
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
                    padding: "6px 12px", borderRadius: 100, marginTop: 12
                  }}>
                    <Star size={12} style={{ color: "var(--warning)" }} />
                    <p style={{ fontSize: 12, color: "var(--text-sec)", margin: 0, fontWeight: 500 }}>
                      Faltam <strong style={{ color: "#fff" }}>{stickersToMilestone}</strong> figurinhas para o marco {nextMilestone}%
                    </p>
                  </div>
                )}
              </div>
              <Link href="/album" style={{
                background: "var(--gradient-primary)", color: "#fff", fontWeight: 700,
                padding: "16px 28px", borderRadius: 16, textDecoration: "none",
                display: "flex", alignItems: "center", gap: 10, fontSize: 15,
                boxShadow: "0 12px 32px -8px rgba(0,153,255,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                position: "relative", overflow: "hidden"
              }}>
                <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                  Abrir Álbum <ChevronRight size={18} />
                </span>
                <div style={{
                  position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                  transform: "translateX(-100%)", animation: "shimmer 3s infinite"
                }} />
              </Link>
            </div>

            {/* Progress bar */}
            <div style={{
              height: 18, background: "rgba(0,0,0,0.4)", borderRadius: 100,
              border: "1px solid rgba(255,255,255,0.05)",
              overflow: "hidden", marginBottom: 40, position: "relative",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)"
            }}>
              <div style={{
                height: "100%",
                background: "var(--gradient-primary)",
                width: `${pct}%`, transition: "width 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
                borderRadius: 100, position: "relative",
                boxShadow: "0 0 24px rgba(0,153,255,0.4)",
              }}>
                {/* Shimmer effect */}
                <div style={{
                  position: "absolute", inset: 0, borderRadius: 100,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s ease-in-out infinite",
                }} />
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
              {[
                { label: "Obtidas", value: stats?.obtained ?? 0, color: "var(--success)", bg: "var(--success-light)", icon: "✅" },
                { label: "Faltantes", value: stats?.missing ?? 0, color: "var(--danger)", bg: "var(--danger-light)", icon: "❌" },
                { label: "Repetidas", value: stats?.duplicates ?? 0, color: "var(--warning)", bg: "var(--warning-light)", icon: "🔄" },
              ].map(({ label, value, color, bg, icon }) => (
                <div key={label} style={{
                  textAlign: "center", background: "rgba(255,255,255,0.02)", 
                  padding: "24px 16px", borderRadius: 20,
                  border: `1px solid rgba(255,255,255,0.04)`,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 16px rgba(0,0,0,0.2)",
                  transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease",
                  cursor: "default"
                }} className="hover:scale-105 hover:bg-white/5">
                  <div style={{ 
                    width: 40, height: 40, margin: "0 auto 12px", borderRadius: 12,
                    background: bg, display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${color}30`
                  }}>
                    <span style={{ fontSize: 18 }}>{icon}</span>
                  </div>
                  <p className="stat-number" style={{ 
                    fontSize: 32, fontWeight: 800, color, marginBottom: 4, 
                    fontFamily: "'Space Grotesk', sans-serif",
                    textShadow: `0 2px 12px ${color}40`
                  }}>
                    {value}
                  </p>
                  <p style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Right Column ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Profile Stats Card */}
          <div style={{
            background: "var(--card-bg)", borderRadius: 24,
            border: "1px solid var(--border-color)", padding: "28px",
            boxShadow: "var(--shadow-sm)",
          }}>
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 24 }}>
              Perfil
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: "var(--warning-light)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Star size={18} style={{ color: "var(--warning)" }} />
                  </div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-sec)", display: "block" }}>Reputação</span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>baseada em trocas</span>
                  </div>
                </div>
                <span style={{ fontSize: 20, fontWeight: 800, color: "var(--warning)", fontFamily: "'Space Grotesk', sans-serif" }}>
                  {profile?.reputacao?.toFixed(1) ?? "5.0"}
                </span>
              </div>

              <div style={{ height: 1, background: "var(--border-light)" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: "var(--primary-light)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <TrendingUp size={18} style={{ color: "var(--primary)" }} />
                  </div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-sec)", display: "block" }}>Total Trocas</span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>realizadas com sucesso</span>
                  </div>
                </div>
                <span style={{ fontSize: 20, fontWeight: 800, color: "var(--primary)", fontFamily: "'Space Grotesk', sans-serif" }}>
                  {profile?.total_trocas ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Premium CTA */}
          {profile?.plano !== "premium" && (
            <div style={{
              background: "linear-gradient(135deg, rgba(212,160,23,0.06), rgba(255,215,0,0.02))",
              borderRadius: 24, border: "1px solid rgba(212,160,23,0.12)", padding: "28px",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: -20, right: -20, width: 100, height: 100,
                background: "var(--warning)", opacity: 0.05, borderRadius: "50%",
                filter: "blur(40px)", pointerEvents: "none",
              }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Trophy size={18} style={{ color: "var(--warning)" }} />
                  <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text-main)" }}>Troca Stickers Pro</p>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 20, lineHeight: 1.5 }}>
                  Matches prioritários, badge dourado e raio ilimitado.
                </p>
                <Link href="/premium" style={{
                  background: "var(--gradient-gold)", color: "#1A1100", fontWeight: 800,
                  padding: "13px 20px", borderRadius: 12, textDecoration: "none",
                  display: "block", textAlign: "center", fontSize: 13,
                  boxShadow: "0 6px 16px -4px rgba(212,160,23,0.3)",
                  transition: "all 0.3s ease",
                }}>
                  ✨ Upgrade Agora
                </Link>
              </div>
            </div>
          )}

          {/* Quick Match Preview */}
          <div style={{
            background: "var(--card-bg)", borderRadius: 24,
            border: "1px solid var(--border-color)", padding: "28px",
            boxShadow: "var(--shadow-sm)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)" }}>
                Atalhos
              </p>
              <Zap size={14} style={{ color: "var(--warning)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/matches" style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                borderRadius: 14, background: "var(--bg-hover)", textDecoration: "none",
                transition: "all 0.2s ease", border: "1px solid transparent",
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--secondary-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shuffle size={16} style={{ color: "var(--secondary)" }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>Ver Matches</span>
                <ChevronRight size={14} style={{ marginLeft: "auto", color: "var(--text-muted)" }} />
              </Link>
              <Link href="/map" style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                borderRadius: 14, background: "var(--bg-hover)", textDecoration: "none",
                transition: "all 0.2s ease", border: "1px solid transparent",
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--warning-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MapPin size={16} style={{ color: "var(--warning)" }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>Radar GPS</span>
                <ChevronRight size={14} style={{ marginLeft: "auto", color: "var(--text-muted)" }} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Action Cards ─── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 20, marginTop: 28, position: "relative", zIndex: 1,
      }}>
        {[
          {
            href: "/matches", icon: Shuffle, title: "Encontrar Matches",
            desc: "Descobre quem tem as figurinhas que precisas perto de ti.",
            color: "var(--secondary)", bg: "var(--secondary-light)",
            gradient: "linear-gradient(135deg, rgba(108,92,231,0.06), transparent)",
          },
          {
            href: "/chat", icon: MessageCircle, title: "Mensagens",
            desc: "Combina os detalhes da troca com outros colecionadores.",
            color: "var(--success)", bg: "var(--success-light)",
            gradient: "linear-gradient(135deg, rgba(0,214,143,0.06), transparent)",
          },
          {
            href: "/feed", icon: Users, title: "Comunidade",
            desc: "Partilha conquistas e conecta-te com colecionadores.",
            color: "#FF6B9D", bg: "rgba(255,107,157,0.08)",
            gradient: "linear-gradient(135deg, rgba(255,107,157,0.06), transparent)",
          },
        ].map(({ href, icon: Icon, title, desc, color, bg, gradient }) => (
          <Link key={href} href={href} className="dashboard-action-card" style={{
            background: gradient, borderRadius: 24,
            border: "1px solid var(--border-color)", padding: "28px",
            textDecoration: "none", display: "block", position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              width: 50, height: 50, borderRadius: 16, background: bg,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
            }}>
              <Icon size={24} style={{ color }} />
            </div>
            <h3 style={{
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700,
              color: "var(--text-main)", marginBottom: 8,
            }}>{title}</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{desc}</p>
            <ChevronRight size={18} style={{
              position: "absolute", top: 28, right: 24, color: "var(--text-muted)", opacity: 0.5,
            }} />
          </Link>
        ))}
      </div>

      {/* Responsive grid override */}
      <style>{`
        @media (max-width: 900px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
