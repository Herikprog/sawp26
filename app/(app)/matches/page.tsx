import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MatchCard from "@/components/matches/MatchCard";
import type { MatchResult } from "@/types";
import { Shuffle, Zap, MapPin } from "lucide-react";

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
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>
      {/* Header with cinematic vibe */}
      <header style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, background: "var(--primary-light)",
            display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)"
          }}>
            <Shuffle size={18} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-muted)" }}>
            Radar de Trocas
          </span>
        </div>
        
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 40,
          fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.03em",
          marginBottom: 16,
        }}>
          Matches <span style={{ color: "var(--primary)" }}>Elite</span>
        </h1>
        <p style={{ color: "var(--text-sec)", fontSize: 17, maxWidth: 500, lineHeight: 1.6 }}>
          O nosso algoritmo de IA encontrou os parceiros ideais para completares o teu álbum hoje.
        </p>
      </header>

      {/* Stats Summary */}
      <div style={{
        display: "flex", gap: 24, marginBottom: 48, overflowX: "auto", paddingBottom: 16
      }}>
        <div style={{
          flexShrink: 0, padding: "20px 32px", borderRadius: 24, background: "var(--card-bg)",
          border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 16
        }}>
          <Zap size={24} style={{ color: "var(--warning)" }} />
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>{matchList.length}</p>
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Matches Ativos</p>
          </div>
        </div>
        
        <div style={{
          flexShrink: 0, padding: "20px 32px", borderRadius: 24, background: "var(--card-bg)",
          border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 16
        }}>
          <MapPin size={24} style={{ color: "var(--success)" }} />
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>20km</p>
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Raio de Busca</p>
          </div>
        </div>
      </div>

      {/* Match List */}
      {matchList.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "120px 24px",
          background: "var(--card-bg)", borderRadius: 32,
          border: "1px solid rgba(255,255,255,0.06)",
          borderStyle: "dashed",
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%", background: "var(--bg-hover-strong)",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px"
          }}>
            <Shuffle size={32} style={{ color: "var(--text-muted)" }} />
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-main)", marginBottom: 12 }}>Nenhum match encontrado</h3>
          <p style={{ color: "var(--text-sec)", fontSize: 15, maxWidth: 320, margin: "0 auto" }}>
            Tenta atualizar o teu álbum ou aumenta o teu raio de busca assinando o Premium.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))" }}>
          {matchList.map((match, i) => (
            <MatchCard key={match.user_id} match={match} myUserId={user.id} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
