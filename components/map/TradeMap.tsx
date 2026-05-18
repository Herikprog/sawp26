"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { type MatchResult, getFlagUrl } from "@/types";
import { formatDistance } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Zap, MapPin, User, PhoneCall } from "lucide-react";
import toast from "react-hot-toast";

import { createClient } from "@/lib/supabase/client";

// Função para criar o pino premium do utilizador atual (bola azul flutuante de radar calibrada de 96px com foto de perfil)
function createCurrentUserIcon(avatarUrl: string | null, nome: string) {
  const size = 96;
  const imgSize = 84;
  const innerHtml = avatarUrl 
    ? `<img src="${avatarUrl}" style="width: ${imgSize}px; height: ${imgSize}px; border-radius: 50%; object-fit: cover;" />`
    : `<div style="width: ${imgSize}px; height: ${imgSize}px; border-radius: 50%; background: var(--gradient-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800;">${nome[0]?.toUpperCase() || "?"}</div>`;

  return L.divIcon({
    className: "my-profile-dot",
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
        <!-- Anel pulsante calibrado de radar azul -->
        <div class="pulse-glow" style="position: absolute; inset: -8px; background: #00AEEF; border-radius: 50%; opacity: 0.25;"></div>
        <!-- Bola azul flutuante brilhante sem ponta/direcional -->
        <div style="position: absolute; inset: 0; background: #00AEEF; border-radius: 50%; box-shadow: 0 0 20px rgba(0,174,239,0.5); border: 3px solid #FFFFFF;"></div>
        <!-- Foto de Perfil embutida calibrada -->
        <div style="position: relative; z-index: 2; width: ${imgSize}px; height: ${imgSize}px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #07111F;">
          ${innerHtml}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2], // Fixa a ancoragem no centro absoluto do circulo da zona!
  });
}

// Função para criar o pino premium das matches (azul brilhante com foto de perfil)
function createMatchUserIcon(avatarUrl: string | null, nome: string) {
  const innerHtml = avatarUrl 
    ? `<img src="${avatarUrl}" style="width: 26px; height: 26px; border-radius: 50%; object-fit: cover;" />`
    : `<div style="width: 26px; height: 26px; border-radius: 50%; background: var(--gradient-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800;">${nome[0]?.toUpperCase() || "?"}</div>`;

  return L.divIcon({
    className: "match-profile-pin",
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <!-- Pointer drop azul royal -->
        <div style="position: absolute; width: 34px; height: 34px; background: #00AEEF; border-radius: 50% 50% 50% 4px; transform: rotate(-45deg); box-shadow: 0 4px 15px rgba(0,174,239,0.3); border: 2px solid #FFFFFF;"></div>
        <!-- Foto de Perfil embutida -->
        <div style="position: relative; z-index: 2; width: 26px; height: 26px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #07111F;">
          ${innerHtml}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });
}

function getZoomForRadius(rad: number) {
  if (rad <= 5) return 14;
  if (rad <= 10) return 13;
  if (rad <= 20) return 12;
  if (rad <= 50) return 11;
  return 10;
}

// Componente auxiliar para animar e centrar o mapa suavemente quando a localização ou raio mudar
function ChangeView({ center, radius }: { center: [number, number]; radius: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, getZoomForRadius(radius), {
      animate: true,
      duration: 1.5
    });
  }, [center, radius, map]);
  return null;
}

// Helper para decodificar WKB Hex de PostGIS
function decodeWKB(wkbHex: string | null): { lat: number; lon: number } | null {
  if (!wkbHex || wkbHex.length < 50) return null;
  try {
    const hasSrid = wkbHex.substring(10, 18).toLowerCase() === "e6100000";
    const xStart = hasSrid ? 18 : 10;
    const yStart = hasSrid ? 34 : 26;
    
    const xHex = wkbHex.substring(xStart, xStart + 16);
    const yHex = wkbHex.substring(yStart, yStart + 16);
    
    const parseDoubleLE = (hex: string): number => {
      const bytes = new Uint8Array(8);
      for (let i = 0; i < 8; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
      }
      const view = new DataView(bytes.buffer);
      return view.getFloat64(0, true);
    };
    
    const lon = parseDoubleLE(xHex);
    const lat = parseDoubleLE(yHex);
    
    if (isNaN(lat) || isNaN(lon)) return null;
    return { lat, lon };
  } catch (e) {
    console.error("WKB Decoding error:", e);
    return null;
  }
}

interface Props {
  matches: MatchResult[];
  radius: number;
  stickersCatalog: Record<number, string>;
}

export default function TradeMap({ matches, radius, stickersCatalog }: Props) {
  const [center, setCenter] = useState<[number, number]>([38.7223, -9.1393]);
  const [myProfile, setMyProfile] = useState<{ nome: string; avatar_url: string | null } | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadMyProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setMyUserId(user.id);
        const { data } = await supabase
          .from("profiles")
          .select("nome, avatar_url")
          .eq("id", user.id)
          .single();
        if (data) setMyProfile(data);
      }
    }
    loadMyProfile();
  }, [supabase]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
        () => console.warn("Geolocation blocked")
      );
    }
  }, []);

  async function startDirectTradeCall(match: MatchResult) {
    if (!myUserId) {
      toast.error("Utilizador não autenticado!");
      return;
    }
    const stickersTem = match.stickers_tem ?? [];
    const stickersPrecisa = match.stickers_precisa ?? [];

    if (stickersTem.length === 0 && stickersPrecisa.length === 0) {
      toast.error("Vocês não possuem figurinhas compatíveis para troca!");
      return;
    }

    try {
      const { data: newTrade, error } = await supabase
        .from("trades")
        .insert({
          initiator_id: myUserId,
          receiver_id: match.user_id,
          offered_stickers: stickersPrecisa,
          wanted_stickers: stickersTem,
          status: "pending"
        })
        .select("*")
        .single();

      if (error) throw error;

      toast.success("📞 Chamada de troca direta enviada!");

      window.dispatchEvent(new CustomEvent("trigger_outgoing_trade", { 
        detail: { trade: newTrade } 
      }));
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao iniciar chamada: ${err.message || "Erro desconhecido"}`);
    }
  }

  return (
    <div style={{ width: "100%", height: "100%", borderRadius: 32, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 80px -20px rgba(0,0,0,0.5)" }}>
      <MapContainer center={center} zoom={getZoomForRadius(radius)} style={{ width: "100%", height: "100%", background: "var(--bg-main)" }}>
        <ChangeView center={center} radius={radius} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* User's approximate area dynamic */}
        <Circle center={center} radius={radius * 1000} pathOptions={{ color: "var(--primary)", fillColor: "var(--primary)", fillOpacity: 0.08, weight: 1, dashArray: "5, 10" }} />

        {/* Bola de perfil flutuante e centralizada representativa da sua zona de cobertura de radar */}
        {myProfile && (
          <Marker position={center} icon={createCurrentUserIcon(myProfile.avatar_url, myProfile.nome)}>
            <Popup className="premium-popup">
              <div style={{ padding: "12px 16px", minWidth: 180, background: "var(--card-bg)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-main)", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>Zona do Radar</p>
                <p style={{ margin: "2px 0 0 0", fontSize: 10, color: "var(--text-muted)" }}>Estás posicionado nesta região.</p>
              </div>
            </Popup>
          </Marker>
        )}

        {matches.map((match: any) => {
          // Decodificar a localização WKB real do outro utilizador se disponível
          let pos: [number, number] = [center[0], center[1]];
          const coordsDecoded = decodeWKB(match.location);
          
          if (coordsDecoded) {
            // Aplicar o desvio de privacidade (offset fuzzy de 800m) em torno de suas coordenadas reais estáveis
            const angle = (match.user_id.charCodeAt(0) + match.user_id.charCodeAt(match.user_id.length - 1)) * 17;
            const radAngle = (angle % 360) * (Math.PI / 180);
            
            const latOffset = 0.0055 * Math.cos(radAngle);
            const lngOffset = 0.0075 * Math.sin(radAngle);
            
            pos = [coordsDecoded.lat + latOffset, coordsDecoded.lon + lngOffset];
          } else {
            // Fallback absoluto radial a partir do centro caso a coordenada falhe
            const angle = (match.user_id.length % 360) * (Math.PI / 180);
            const latOffset = (match.distancia_km / 111) * Math.cos(angle);
            const lngOffset = (match.distancia_km / 111) * Math.sin(angle);
            pos = [center[0] + latOffset, center[1] + lngOffset];
          }

          return (
            <Marker key={match.user_id} position={pos} icon={createMatchUserIcon(match.avatar_url, match.nome)}>
              <Popup className="premium-popup">
                <div style={{ padding: "18px 16px", minWidth: 280, maxWidth: 300, background: "rgba(7, 17, 31, 0.95)", backdropFilter: "blur(20px)", borderRadius: 28, border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-main)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)" }}>
                  {/* Perfil Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                    {match.avatar_url ? (
                       <Image src={match.avatar_url} alt={match.nome} width={42} height={42} style={{ borderRadius: 12, objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} />
                    ) : (
                       <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--input-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>
                         {match.nome[0]}
                       </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                       <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{match.nome}</p>
                       <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                         <MapPin size={10} style={{ color: "var(--text-muted)" }} />
                         <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatDistance(match.distancia_km)}</span>
                       </div>
                    </div>
                  </div>

                  {/* Lista de Figurinhas que Tem para Mim */}
                  <div style={{ background: "rgba(0,201,109,0.04)", border: "1px solid rgba(0,201,109,0.12)", borderRadius: 16, padding: "10px 12px", marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tem para mim</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "var(--success)", background: "rgba(0,201,109,0.1)", padding: "2px 6px", borderRadius: 6 }}>{match.stickers_tem.length}</span>
                    </div>
                    {match.stickers_tem.length > 0 ? (
                      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
                        {match.stickers_tem.slice(0, 10).map((id: number) => {
                          const code = stickersCatalog[id] || `Fig. ${id}`;
                          return (
                            <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "3px 6px", fontSize: 10, fontWeight: 700, color: "var(--text-main)", whiteSpace: "nowrap" }}>
                              <img src={getFlagUrl(code)} style={{ width: 12, height: 9, borderRadius: 1.5, objectFit: "cover" }} />
                              {code}
                            </span>
                          );
                        })}
                        {match.stickers_tem.length > 10 && (
                          <span style={{ fontSize: 9, color: "var(--text-muted)", display: "flex", alignItems: "center", fontWeight: 700, paddingLeft: 2 }}>+{match.stickers_tem.length - 10}</span>
                        )}
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>Nenhuma figurinha em comum</p>
                    )}
                  </div>

                  {/* Lista de Figurinhas que Eu Tenho para Ele */}
                  <div style={{ background: "rgba(245,183,0,0.04)", border: "1px solid rgba(245,183,0,0.12)", borderRadius: 16, padding: "10px 12px", marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "var(--warning)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tenho para ele</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "var(--warning)", background: "rgba(245,183,0,0.1)", padding: "2px 6px", borderRadius: 6 }}>{match.stickers_precisa.length}</span>
                    </div>
                    {match.stickers_precisa.length > 0 ? (
                      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
                        {match.stickers_precisa.slice(0, 10).map((id: number) => {
                          const code = stickersCatalog[id] || `Fig. ${id}`;
                          return (
                            <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "3px 6px", fontSize: 10, fontWeight: 700, color: "var(--text-main)", whiteSpace: "nowrap" }}>
                              <img src={getFlagUrl(code)} style={{ width: 12, height: 9, borderRadius: 1.5, objectFit: "cover" }} />
                              {code}
                            </span>
                          );
                        })}
                        {match.stickers_precisa.length > 10 && (
                          <span style={{ fontSize: 9, color: "var(--text-muted)", display: "flex", alignItems: "center", fontWeight: 700, paddingLeft: 2 }}>+{match.stickers_precisa.length - 10}</span>
                        )}
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>Nenhuma figurinha em comum</p>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button
                      onClick={() => startDirectTradeCall(match)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        background: "linear-gradient(135deg, #f5b700 0%, #e0a300 100%)", color: "#1A1100",
                        borderRadius: 14, padding: "10px", fontSize: 13, fontWeight: 800, border: "none", cursor: "pointer",
                        boxShadow: "0 8px 20px rgba(245,183,0,0.2)", transition: "all 0.2s"
                      }}
                    >
                      <PhoneCall size={14} /> Ligar para Trocar
                    </button>
                    
                    <div style={{ display: "flex", gap: 8 }}>
                      <Link href={`/profile/${match.user_id}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(255,255,255,0.05)", color: "var(--text-main)", borderRadius: 14, padding: "10px", fontSize: 13, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.2s" }}>
                        <User size={14} /> Perfil
                      </Link>
                      <Link href={`/api/chat/start?userId=${match.user_id}`} style={{ flex: 1.4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "var(--primary)", color: "var(--text-main)", borderRadius: 14, padding: "10px", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", textDecoration: "none", boxShadow: "0 8px 20px rgba(0,174,239,0.25)", transition: "all 0.2s" }}>
                        <MessageCircle size={14} /> Negociar
                      </Link>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
        }
        .leaflet-popup-tip-container {
          display: none !important;
        }
        .leaflet-container {
          font-family: inherit !important;
        }
        .pulse-glow {
          animation: pulse-ring 2s infinite ease-in-out;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.25); opacity: 0.15; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

