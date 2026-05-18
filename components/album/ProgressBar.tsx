"use client";

import { motion } from "framer-motion";
import type { AlbumStats } from "@/types";
import { Trophy, TrendingUp } from "lucide-react";

export default function ProgressBar({ stats }: { stats: AlbumStats | null }) {
  const pct = stats?.completion_pct ?? 0;
  const obtained = stats?.obtained ?? 0;
  const total = stats?.total_stickers ?? 0;
  const duplicates = stats?.duplicates ?? 0;
  const missing = total - obtained;

  // Determine rank tier
  const tier = pct >= 90 ? "Lendário" : pct >= 70 ? "Elite" : pct >= 50 ? "Veterano" : pct >= 25 ? "Colecionador" : "Iniciante";
  const tierColor = pct >= 90 ? "var(--warning)" : pct >= 70 ? "var(--secondary)" : pct >= 50 ? "var(--primary)" : pct >= 25 ? "var(--success)" : "var(--text-muted)";

  return (
    <div style={{
      background: "var(--card-bg)", borderRadius: 28,
      border: "1px solid var(--border-color)",
      padding: "36px", boxShadow: "var(--shadow-lg)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Top gradient bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: "var(--gradient-success)", borderRadius: "28px 28px 0 0",
      }} />

      {/* Background glow */}
      <div className="pulse-glow" style={{
        position: "absolute", top: "-20%", right: "-10%", width: 280, height: 280,
        background: "var(--primary)", opacity: 0.04, filter: "blur(80px)", borderRadius: "50%",
      }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 28 }}>
        {/* Top Stats */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Trophy size={18} style={{ color: "var(--warning)" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Estado do Álbum</span>
              <span style={{
                fontSize: 9, fontWeight: 800, color: tierColor,
                background: `${tierColor}15`, padding: "3px 10px",
                borderRadius: 100, textTransform: "uppercase", letterSpacing: "0.08em",
                border: `1px solid ${tierColor}20`,
              }}>{tier}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{
                fontSize: 48, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif",
                background: "var(--gradient-primary)", WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>{pct}</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text-muted)" }}>%</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Obtidas", value: obtained, color: "var(--success)" },
              { label: "Repetidas", value: duplicates, color: "var(--warning)" },
              { label: "Em falta", value: missing, color: "var(--danger)" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
                <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Track */}
        <div style={{ height: 14, background: "var(--input-bg)", borderRadius: 100, overflow: "hidden", position: "relative" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              height: "100%", borderRadius: 100,
              background: "var(--gradient-success)",
              boxShadow: "0 0 20px rgba(0,214,143,0.25)",
              position: "relative",
            }}
          >
            <div style={{
              position: "absolute", inset: 0, borderRadius: 100,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2s ease-in-out infinite",
            }} />
          </motion.div>
        </div>

        {/* Bottom Legend */}
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[
            { label: "Concluído", color: "var(--success)" },
            { label: `${missing} em falta`, color: "var(--primary)" },
            { label: "Duplicatas para troca", color: "var(--warning)" },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}40` }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-sec)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
