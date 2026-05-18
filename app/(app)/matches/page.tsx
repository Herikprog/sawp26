import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MatchCard from "@/components/matches/MatchCard";
import type { MatchResult } from "@/types";
import { Shuffle, Zap, MapPin, Target, Sparkles } from "lucide-react";

export default async function MatchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Call the matching algorithm (stored procedure)
  const { data: matches, error } = await supabase.rpc("get_nearby_matches", {
    p_user_id: user.id,
    p_radius_km: 20, // default search radius
  });

  if (error) {
    console.error("Error fetching matches:", error);
  }

  const matchList = (matches as MatchResult[]) ?? [];

  return (
    <div className="pattern-bg" style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px", position: "relative" }}>
      {/* Ambient orbs */}
      <div className="orb" style={{ top: -100, left: -80, width: 350, height: 350, background: "var(--secondary)", opacity: 0.03 }} />

      {/* Header */}
      <header style={{ marginBottom: 40, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 100,
            background: "var(--secondary-light)", border: "1px solid rgba(139,123,247,0.15)",
          }}>
            <Sparkles size={12} style={{ color: "var(--secondary)" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--secondary)" }}>Alimentado por IA</span>
          </div>
        </div>
        
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(28px, 5vw, 42px)",
          fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.03em",
          marginBottom: 12, lineHeight: 1.1,
        }}>
          Matches{" "}
          <span style={{
            background: "var(--gradient-primary)", WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>Elite</span>
        </h1>
        <p style={{ color: "var(--text-sec)", fontSize: 16, maxWidth: 500, lineHeight: 1.6 }}>
          O nosso algoritmo encontrou os parceiros ideais para completares o teu álbum.
        </p>
      </header>

      {/* Stats Summary */}
      <div style={{
        display: "flex", gap: 16, marginBottom: 36, overflowX: "auto", paddingBottom: 8,
        position: "relative", zIndex: 1,
      }}>
        {[
          { icon: Zap, label: "Matches Ativos", value: matchList.length, color: "var(--warning)", bg: "var(--warning-light)" },
          { icon: MapPin, label: "Raio de Busca", value: "20km", color: "var(--success)", bg: "var(--success-light)" },
          { icon: Target, label: "Precisão", value: "95%", color: "var(--primary)", bg: "var(--primary-light)" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} style={{
            flexShrink: 0, padding: "18px 28px", borderRadius: 20,
            background: "var(--card-bg)", border: "1px solid var(--border-color)",
            display: "flex", alignItems: "center", gap: 14,
            boxShadow: "var(--shadow-sm)",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: bg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 800, color: "var(--text-main)", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>{value}</p>
              <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Match List */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {matchList.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "100px 24px",
            background: "var(--card-bg)", borderRadius: 28,
            border: "1px dashed var(--border-color)",
            boxShadow: "var(--shadow-sm)",
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "var(--bg-hover-strong)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px", fontSize: 36,
            }}>
              🔍
            </div>
            <h3 style={{
              fontSize: 22, fontWeight: 700, color: "var(--text-main)", marginBottom: 12,
              fontFamily: "'Space Grotesk', sans-serif",
            }}>Nenhum match encontrado</h3>
            <p style={{ color: "var(--text-sec)", fontSize: 14, maxWidth: 360, margin: "0 auto", lineHeight: 1.6 }}>
              Tenta atualizar o teu álbum ou aumenta o raio de busca com o Premium.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))" }}>
            {matchList.map((match, i) => (
              <MatchCard key={match.user_id} match={match} myUserId={user.id} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
