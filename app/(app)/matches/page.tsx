"use client";

import { useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import MatchCard from "@/components/matches/MatchCard";
import type { MatchResult } from "@/types";
import { Shuffle, Zap, MapPin, Target, Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [user, setUser] = useState<any>(null);
  const [coordsSource, setCoordsSource] = useState<"gps" | "perfil" | "buscando">("buscando");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      // Obter utilizador ativamente logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // Tentar obter geolocalização do navegador
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setCoordsSource("gps");
            await fetchMatches(user.id, latitude, longitude);
          },
          async (geoErr) => {
            console.warn("Permissão de GPS negada ou erro, usando localização do perfil:", geoErr);
            setCoordsSource("perfil");
            await fetchMatches(user.id, null, null);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        console.warn("Geolocalização não suportada neste navegador, usando perfil:");
        setCoordsSource("perfil");
        await fetchMatches(user.id, null, null);
      }
    }
    
    init();
  }, []);

  async function fetchMatches(userId: string, lat: number | null, lon: number | null) {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_nearby_matches", {
      p_user_id: userId,
      p_radius_km: 20,
      p_lat: lat,
      p_lon: lon
    });

    if (error) {
      console.error("Erro ao carregar matches:", error);
      setErrorMsg("Ocorreu um erro ao carregar seus matches geográficos.");
    } else {
      setMatches((data as MatchResult[]) ?? []);
    }
    setLoading(false);
  }

  // Visual de Radar em Cinematic Dark Mode durante o loading
  if (loading) {
    return (
      <div className="pattern-bg" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "75vh", gap: 24, textAlign: "center", padding: 24 }}>
        <div style={{ position: "relative", width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            position: "absolute", width: "100%", height: "100%", borderRadius: "50%",
            border: "2px solid var(--primary)", opacity: 0.4,
            animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite"
          }} />
          <div style={{
            position: "absolute", width: "70%", height: "70%", borderRadius: "50%",
            border: "2px solid var(--secondary)", opacity: 0.3,
            animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite", animationDelay: "0.5s"
          }} />
          <div style={{
            width: 60, height: 60, borderRadius: "50%", background: "var(--gradient-primary)",
            display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 30px var(--primary)"
          }}>
            <Loader2 size={28} className="animate-spin" style={{ color: "#fff" }} />
          </div>
        </div>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: "var(--text-main)", marginBottom: 8 }}>
            {coordsSource === "buscando" ? "Obtendo GPS do navegador..." : "Calculando conexões ideais..."}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 15, maxWidth: 360, margin: "0 auto", lineHeight: 1.6 }}>
            Buscando utilizadores próximos que têm as figurinhas que precisas e querem as tuas repetidas!
          </p>
        </div>

        <style>{`
          @keyframes ping {
            75%, 100% {
              transform: scale(2.2);
              opacity: 0;
            }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}</style>
      </div>
    );
  }

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
          { icon: Zap, label: "Matches Ativos", value: matches.length, color: "var(--warning)", bg: "var(--warning-light)" },
          { 
            icon: MapPin, 
            label: "Raio de Busca", 
            value: (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                20km
                <span style={{
                  fontSize: 8, fontWeight: 900,
                  background: coordsSource === "gps" ? "rgba(46,204,113,0.15)" : "rgba(241,196,15,0.15)",
                  color: coordsSource === "gps" ? "#2ecc71" : "#f1c40f",
                  padding: "2px 8px", borderRadius: 100, textTransform: "uppercase", letterSpacing: "0.05em"
                }}>
                  {coordsSource === "gps" ? "🟢 GPS Live" : "🟡 Fixo"}
                </span>
              </div>
            ) as ReactNode, 
            color: "var(--success)", 
            bg: "var(--success-light)" 
          },
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
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-main)", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>
                {value}
              </div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Match List */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {errorMsg ? (
          <div style={{
            textAlign: "center", padding: "48px 24px",
            background: "rgba(255,77,106,0.05)", borderRadius: 28,
            border: "1px solid rgba(255,77,106,0.15)", color: "var(--danger)"
          }}>
            {errorMsg}
          </div>
        ) : matches.length === 0 ? (
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
            {matches.map((match, i) => (
              <MatchCard key={match.user_id} match={match} myUserId={user.id} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
