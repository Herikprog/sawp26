import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Shuffle, MessageCircle, Users, TrendingUp, ChevronRight, Trophy, Star } from "lucide-react";

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

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px" }}>
      {/* ─── Header ─── */}
      <header style={{ marginBottom: 64 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 48, fontWeight: 700, color: "var(--text-main)", marginBottom: 12, letterSpacing: "-0.03em" }}>
          Olá, <span style={{ color: "var(--primary)" }}>{nome}</span>
        </h1>
        <p style={{ color: "var(--text-sec)", fontSize: 18, maxWidth: 500, lineHeight: 1.6 }}>
          Acompanha o teu progresso e encontra parceiros de troca próximos.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
        
        {/* ─── Progress Card ─── */}
        <div style={{
          gridColumn: "span 2", background: "var(--card-bg)", borderRadius: 32, border: "1px solid rgba(255,255,255,0.08)",
          padding: "48px", position: "relative", overflow: "hidden", boxShadow: "0 25px 60px -12px rgba(0,0,0,0.5)"
        }}>
          <div style={{ position: "absolute", top: "-10%", right: "-5%", width: 400, height: 400, background: "var(--primary)", opacity: 0.05, filter: "blur(100px)", borderRadius: "50%" }} />
          
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 12 }}>Progresso do Álbum</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 64, fontWeight: 700, color: "var(--text-main)" }}>{pct}</span>
                  <span style={{ fontSize: 24, fontWeight: 700, color: "var(--text-muted)" }}>%</span>
                </div>
              </div>
              <Link href="/album" style={{
                background: "var(--primary)", color: "var(--text-main)", fontWeight: 700, padding: "16px 28px", borderRadius: 16,
                textDecoration: "none", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 20px -4px rgba(0,174,239,0.3)"
              }}>
                Abrir Álbum <ChevronRight size={18} />
              </Link>
            </div>

            <div style={{ height: 12, background: "var(--input-bg)", borderRadius: 100, overflow: "hidden", marginBottom: 48 }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg, var(--danger), var(--warning), var(--success), var(--primary))", width: `${pct}%`, transition: "width 1.5s ease" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
              <div style={{ textAlign: "center", background: "var(--input-bg)", padding: "24px", borderRadius: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Obtidas</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: "var(--success)" }}>{stats?.obtained ?? 0}</p>
              </div>
              <div style={{ textAlign: "center", background: "var(--input-bg)", padding: "24px", borderRadius: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Faltantes</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: "var(--danger)" }}>{stats?.missing ?? 0}</p>
              </div>
              <div style={{ textAlign: "center", background: "var(--input-bg)", padding: "24px", borderRadius: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Repetidas</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: "var(--warning)" }}>{stats?.duplicates ?? 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Sidebar Card ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div style={{ background: "var(--card-bg)", borderRadius: 32, border: "1px solid rgba(255,255,255,0.08)", padding: "32px" }}>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 32 }}>Perfil</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "var(--warning-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Star size={20} style={{ color: "var(--warning)" }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-sec)" }}>Reputação</span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>{profile?.reputacao?.toFixed(1) ?? "5.0"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <TrendingUp size={20} style={{ color: "var(--primary)" }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-sec)" }}>Total Trocas</span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>{profile?.total_trocas ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Premium CTA */}
          {profile?.plano !== "premium" && (
            <div style={{ 
              background: "linear-gradient(135deg, rgba(245,183,0,0.1), transparent)", 
              borderRadius: 32, border: "1px solid rgba(245,183,0,0.2)", padding: "32px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Trophy size={18} style={{ color: "var(--warning)" }} />
                <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text-main)" }}>Swap26 Pro</p>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 24, lineHeight: 1.5 }}>
                Matches prioritários, badge dourado e raio de pesquisa ilimitado.
              </p>
              <Link href="/premium" style={{
                background: "var(--warning)", color: "var(--bg-main)", fontWeight: 800, padding: "14px 20px", borderRadius: 14,
                textDecoration: "none", display: "block", textAlign: "center", fontSize: 14
              }}>
                Upgrade Agora
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ─── Actions ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, marginTop: 32 }}>
        <Link href="/matches" className="dashboard-action-card" style={{
          background: "var(--card-bg)", borderRadius: 28, border: "1px solid rgba(255,255,255,0.08)", padding: "32px",
          textDecoration: "none", transition: "transform 0.2s ease, box-shadow 0.2s ease", display: "block"
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Shuffle size={28} style={{ color: "var(--primary)" }} />
          </div>
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "var(--text-main)", marginBottom: 10 }}>Encontrar Matches</h3>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>Descobre quem tem as figurinhas que precisas perto de ti.</p>
        </Link>

        <Link href="/chat" className="dashboard-action-card" style={{
          background: "var(--card-bg)", borderRadius: 28, border: "1px solid rgba(255,255,255,0.08)", padding: "32px",
          textDecoration: "none", transition: "transform 0.2s ease, box-shadow 0.2s ease", display: "block"
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: "var(--success-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <MessageCircle size={28} style={{ color: "var(--success)" }} />
          </div>
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "var(--text-main)", marginBottom: 10 }}>Mensagens</h3>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>Combina os detalhes da troca com outros colecionadores.</p>
        </Link>

        <Link href="/feed" className="dashboard-action-card" style={{
          background: "var(--card-bg)", borderRadius: 28, border: "1px solid rgba(255,255,255,0.08)", padding: "32px",
          textDecoration: "none", transition: "transform 0.2s ease, box-shadow 0.2s ease", display: "block"
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Users size={28} style={{ color: "#8b5cf6" }} />
          </div>
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "var(--text-main)", marginBottom: 10 }}>Comunidade</h3>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>Partilha conquistas, dicas e conecta-te com outros colecionadores.</p>
        </Link>
      </div>
    </div>
  );
}
