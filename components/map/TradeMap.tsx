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

// Premium WC2026 Pin
const customIcon = L.divIcon({
  className: "custom-pin",
  html: `
    <div style="position: relative; width: 32px; height: 32px;">
      <div style="position: absolute; inset: 0; background: #00AEEF; border-radius: 12px 12px 12px 2px; transform: rotate(-45deg); border: 2px solid #FFFFFF; box-shadow: 0 4px 15px rgba(0,174,239,0.4);"></div>
      <div style="position: absolute; inset: 0; display: flex; items-center; justify-content: center; transform: rotate(0); z-index: 1;">
        <span style="font-size: 14px;">⚽</span>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Componente auxiliar para animar e centrar o mapa suavemente quando a localização mudar
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, {
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
      <MapContainer center={center} zoom={13} style={{ width: "100%", height: "100%", background: "var(--bg-main)" }}>
        <ChangeView center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* User's approximate area */}
        <Circle center={center} radius={800} pathOptions={{ color: "var(--primary)", fillColor: "var(--primary)", fillOpacity: 0.1, weight: 1, dashArray: "5, 10" }} />

        {matches.map((match) => {
          // Simulate position for privacy
          const angle = (match.user_id.length % 360) * (Math.PI / 180);
          const latOffset = (match.distancia_km / 111) * Math.cos(angle);
          const lngOffset = (match.distancia_km / 111) * Math.sin(angle);
          const pos: [number, number] = [center[0] + latOffset, center[1] + lngOffset];

          return (
            <Marker key={match.user_id} position={pos} icon={customIcon}>
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
      `}</style>
    </div>
  );
}
