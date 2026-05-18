"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { MatchResult } from "@/types";
import { formatDistance } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Zap, MapPin, User } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

// Função para criar o pino premium do utilizador atual (bola azul flutuante de radar com foto de perfil)
function createCurrentUserIcon(avatarUrl: string | null, nome: string) {
  const innerHtml = avatarUrl 
    ? `<img src="${avatarUrl}" style="width: 26px; height: 26px; border-radius: 50%; object-fit: cover;" />`
    : `<div style="width: 26px; height: 26px; border-radius: 50%; background: var(--gradient-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800;">${nome[0]?.toUpperCase() || "?"}</div>`;

  return L.divIcon({
    className: "my-profile-dot",
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <!-- Anel pulsante de radar azul -->
        <div class="pulse-glow" style="position: absolute; inset: -6px; background: #00AEEF; border-radius: 50%; opacity: 0.3;"></div>
        <!-- Bola azul flutuante brilhante sem ponta/direcional -->
        <div style="position: absolute; inset: 0; background: #00AEEF; border-radius: 50%; box-shadow: 0 0 15px rgba(0,174,239,0.6); border: 2px solid #FFFFFF;"></div>
        <!-- Foto de Perfil embutida -->
        <div style="position: relative; z-index: 2; width: 26px; height: 26px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #07111F;">
          ${innerHtml}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17], // Fixa a ancoragem no centro absoluto do circulo da zona!
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

// Componente auxiliar para animar e centrar o mapa suavemente quando a localização mudar
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 11, {
      animate: true,
      duration: 1.5
    });
  }, [center, map]);
  return null;
}

interface Props {
  matches: MatchResult[];
}

export default function TradeMap({ matches }: Props) {
  const [center, setCenter] = useState<[number, number]>([38.7223, -9.1393]);
  const [myProfile, setMyProfile] = useState<{ nome: string; avatar_url: string | null } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadMyProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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

  return (
    <div style={{ width: "100%", height: "100%", borderRadius: 32, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 80px -20px rgba(0,0,0,0.5)" }}>
      <MapContainer center={center} zoom={11} style={{ width: "100%", height: "100%", background: "var(--bg-main)" }}>
        <ChangeView center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* User's approximate area */}
        <Circle center={center} radius={5600} pathOptions={{ color: "var(--primary)", fillColor: "var(--primary)", fillOpacity: 0.1, weight: 1, dashArray: "5, 10" }} />

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

        {matches.map((match) => {
          // Simulate position for privacy
          const angle = (match.user_id.length % 360) * (Math.PI / 180);
          const latOffset = (match.distancia_km / 111) * Math.cos(angle);
          const lngOffset = (match.distancia_km / 111) * Math.sin(angle);
          const pos: [number, number] = [center[0] + latOffset, center[1] + lngOffset];

          return (
            <Marker key={match.user_id} position={pos} icon={createMatchUserIcon(match.avatar_url, match.nome)}>
              <Popup className="premium-popup">
                <div style={{ padding: "16px", minWidth: 260, background: "var(--card-bg)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-main)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                    {match.avatar_url ? (
                       <Image src={match.avatar_url} alt={match.nome} width={48} height={48} style={{ borderRadius: 14, objectFit: "cover" }} />
                    ) : (
                       <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--input-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "var(--primary)" }}>
                         {match.nome[0]}
                       </div>
                    )}
                    <div style={{ flex: 1 }}>
                       <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>{match.nome}</p>
                       <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                         <MapPin size={10} style={{ color: "var(--text-muted)" }} />
                         <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatDistance(match.distancia_km)}</span>
                       </div>
                    </div>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                    <div style={{ padding: 12, borderRadius: 16, background: "rgba(0,201,109,0.08)", border: "1px solid rgba(0,201,109,0.15)", textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--success)" }}>{match.stickers_tem.length}</p>
                      <p style={{ margin: 0, fontSize: 8, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Tem p/ mim</p>
                    </div>
                    <div style={{ padding: 12, borderRadius: 16, background: "rgba(245,183,0,0.08)", border: "1px solid rgba(245,183,0,0.15)", textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--warning)" }}>{match.stickers_precisa.length}</p>
                      <p style={{ margin: 0, fontSize: 8, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Eu tenho p/ ele</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <Link href={`/profile/${match.user_id}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "var(--border-light)", color: "var(--text-main)", borderRadius: 12, padding: "10px", fontSize: 13, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <User size={14} /> Perfil
                    </Link>
                    <Link href={`/api/chat/start?userId=${match.user_id}`} style={{ flex: 1.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "var(--primary)", color: "var(--text-main)", borderRadius: 12, padding: "10px", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", textDecoration: "none", boxShadow: "0 4px 12px rgba(0,174,239,0.2)" }}>
                      <MessageCircle size={14} /> Chat
                    </Link>
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
