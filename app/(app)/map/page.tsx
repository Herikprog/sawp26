"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import type { MatchResult } from "@/types";
import { Compass, Loader2 } from "lucide-react";

// Supabase instanciado uma vez fora do componente — sem leaks por re-render
const supabase = createClient();

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

import PremiumPaywallOverlay from "@/components/PremiumPaywallOverlay";

export default function MapPage() {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [radius, setRadius] = useState<number>(20);
  // Valor do slider em tempo real — o fetch só dispara após debounce
  const [sliderRadius, setSliderRadius] = useState<number>(20);
  const [stickersCatalog, setStickersCatalog] = useState<Record<number, string>>({});
  // coords: null enquanto GPS ainda não respondeu
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  // gpsReady: true quando GPS respondeu (sucesso ou erro) — evita fetch prematuro
  const [gpsReady, setGpsReady] = useState(false);
  const [loading, setLoading] = useState(false);

  // Ref para debounce do slider
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar catálogo de figurinhas (uma vez)
  useEffect(() => {
    async function loadCatalog() {
      const { data } = await supabase.from("stickers").select("id, codigo");
      if (data) {
        const catalog: Record<number, string> = {};
        data.forEach((s: { id: number; codigo: string }) => {
          catalog[s.id] = s.codigo;
        });
        setStickersCatalog(catalog);
      }
    }
    loadCatalog();
  }, []);

  // GPS — pedido único. Só após resposta (sucesso ou erro) define gpsReady=true
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsReady(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lon: longitude });
        // Actualizar localização no perfil em background (separado do fetch de matches)
        void (async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            void supabase.rpc("update_my_location", {
              p_user_id: user.id,
              p_lat: latitude,
              p_lon: longitude,
            });
          }
        })();
        setGpsReady(true);
      },
      () => {
        console.warn("GPS bloqueado no Mapa, usando fallback do perfil cadastrado.");
        setGpsReady(true); // Continua sem coords — RPC usa perfil
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Fetch de matches: só dispara quando GPS já respondeu (gpsReady) ou quando radius mudar
  useEffect(() => {
    if (!gpsReady) return;
    fetchNearbyMatches();
  }, [gpsReady, radius]);

  // Debounce do slider: espera 400ms depois de parar de arrastar para actualizar radius
  function handleSliderChange(value: number) {
    setSliderRadius(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setRadius(value);
    }, 400);
  }

  async function fetchNearbyMatches() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);

    const rpcParams: any = {
      p_user_id: user.id,
      p_radius_km: radius,
    };

    if (coords) {
      rpcParams.p_lat = coords.lat;
      rpcParams.p_lon = coords.lon;
    }

    const { data } = await supabase.rpc("get_nearby_matches", rpcParams);

    if (data && data.length > 0) {
      const userIds = data.map((m: any) => m.user_id);
      const { data: locationsData } = await supabase
        .from("profiles")
        .select("id, location")
        .in("id", userIds);

      if (locationsData) {
        const locationMap: Record<string, string> = {};
        locationsData.forEach((p: any) => {
          if (p.location) locationMap[p.id] = p.location;
        });
        setMatches(data.map((m: any) => ({ ...m, location: locationMap[m.user_id] || null })));
      } else {
        setMatches(data);
      }
    } else {
      setMatches(data || []);
    }

    setLoading(false);
  }

  // Centro do mapa: coords GPS se disponível, senão Lisboa como fallback
  const mapCenter: [number, number] = coords
    ? [coords.lat, coords.lon]
    : [38.7223, -9.1393];

  return (
    <PremiumPaywallOverlay
      pageName="Radar GPS de Colecionadores"
      explanation="Visualiza todos os colecionadores de figurinhas num mapa interativo em tempo real! Descobre quem está perto de ti e inicia trocas imediatas."
      benefits={[
        "Visualização no mapa interativo em tempo real",
        "Distância aproximada para segurança e privacidade",
        "Inicia trocas instantâneas clicando nos pins",
        "Filtros de figurinhas em falta e repetidas diretos"
      ]}
    >
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
        <div style={{ flex: 1, minHeight: 400, position: "relative", borderRadius: 32, overflow: "hidden" }}>
          <TradeMap
            matches={matches}
            radius={radius}
            stickersCatalog={stickersCatalog}
            center={mapCenter}
          />

          {/* Painel Flutuante Interativo de Varredura */}
          <div style={{
            position: "absolute", top: 24, right: 24, zIndex: 400,
            background: "rgba(10, 22, 40, 0.8)", backdropFilter: "blur(16px)",
            padding: "20px 24px", borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", gap: 14,
            minWidth: 260
          }}>
            <div>
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--primary)" }}>Varredura de Radar</span>
              <h3 style={{ margin: "2px 0 0 0", fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>Raio de Busca</h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--text-sec)", fontWeight: 500 }}>Distância Máxima:</span>
                <span style={{ fontSize: 15, color: "var(--primary)", fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>{sliderRadius} km</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={sliderRadius}
                onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                style={{
                  width: "100%", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.15)",
                  outline: "none", cursor: "pointer", accentColor: "var(--primary)", transition: "all 0.2s"
                }}
              />
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
              {loading ? (
                <Loader2 size={14} style={{ color: "var(--primary)", flexShrink: 0, animation: "spin 1s linear infinite" }} />
              ) : (
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)", boxShadow: "0 0 10px #00C96D", flexShrink: 0 }} />
              )}
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
                {loading ? "A procurar..." : `${matches.length} Colecionadores Próximos`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </PremiumPaywallOverlay>
  );
}
