"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import type { MatchResult } from "@/types";
import { Map, MapPin, Compass } from "lucide-react";

const TradeMap = dynamic(() => import("@/components/map/TradeMap"), {
  ssr: false,
  loading: () => (
    <div style={{
      width: "100%", height: "100%", borderRadius: 32, background: "var(--card-bg)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
      border: "1px solid rgba(255,255,255,0.08)"
    }}>
      <div className="w-12 h-12 rounded-full border-4 border-t-transparent border-[#00AEEF] animate-spin" />
      <p style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 500 }}>A inicializar Radar GPS...</p>
    </div>
  ),
});

export default function MapPage() {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadMatches(lat?: number, lon?: number) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.rpc("get_nearby_matches", {
        p_user_id: user.id,
        p_radius_km: 50,
        p_lat: lat,
        p_lon: lon,
      });
      if (data) setMatches(data);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          loadMatches(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          console.warn("GPS bloqueado no Mapa, usando fallback do perfil cadastrado.");
          loadMatches();
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      loadMatches();
    }
  }, [supabase]);

  return (
    <div style={{ padding: "48px 24px", height: "calc(100vh - 64px)", display: "flex", flexDirection: "column", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
            <Compass size={16} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-muted)" }}>Exploração em Tempo Real</span>
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.03em", marginBottom: 8 }}>
          Radar <span style={{ color: "var(--primary)" }}>GPS</span>
        </h1>
        <p style={{ color: "var(--text-sec)", fontSize: 16, maxWidth: 500 }}>
          Descobre utilizadores próximos para trocar figurinhas. Localizações são aproximadas para garantir a privacidade.
        </p>
      </div>

      {/* Map Container */}
      <div style={{ flex: 1, minHeight: 400, position: "relative" }}>
        <TradeMap matches={matches} />
        
        {/* Floating Info */}
        <div style={{
          position: "absolute", bottom: 24, left: 24, zIndex: 40,
          background: "var(--bg-main-transparent)", backdropFilter: "blur(12px)",
          padding: "12px 20px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", gap: 12
        }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--success)", boxShadow: "0 0 10px #00C96D" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>{matches.length} Colecionadores Próximos</span>
        </div>
      </div>
    </div>
  );
}
