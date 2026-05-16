"use client";

import { motion } from "framer-motion";
import type { AlbumStats } from "@/types";
import { Trophy, Star, Shield } from "lucide-react";

export default function ProgressBar({ stats }: { stats: AlbumStats | null }) {
  const pct = stats?.completion_pct ?? 0;
  const obtained = stats?.obtained ?? 0;
  const total = stats?.total_stickers ?? 0;
  const duplicates = stats?.duplicates ?? 0;

  return (
    <div style={{
      background: "var(--card-bg)", borderRadius: 32, border: "1px solid rgba(255,255,255,0.08)",
      padding: "40px", boxShadow: "0 25px 80px -20px rgba(0,0,0,0.4)",
      position: "relative", overflow: "hidden"
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", top: "-20%", right: "-10%", width: 300, height: 300,
        background: "var(--primary)", opacity: 0.05, filter: "blur(80px)", borderRadius: "50%"
      }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 32 }}>
        {/* Top Stats */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <Trophy size={20} style={{ color: "var(--warning)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Estado do Álbum</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 48, fontWeight: 800, color: "var(--text-main)", fontFamily: "'Space Grotesk', sans-serif" }}>{pct}</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: "var(--text-muted)" }}>%</span>
            </div>
          </div>

          <div style={{ textAlign: "right", display: "flex", gap: 24 }}>
            <div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>{obtained}</p>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Obtidas</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--warning)" }}>{duplicates}</p>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Repetidas</p>
            </div>
          </div>
        </div>

        {/* Progress Track */}
        <div style={{ height: 16, background: "var(--input-bg)", borderRadius: 100, overflow: "hidden", position: "relative" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              height: "100%", borderRadius: 100,
              background: "linear-gradient(90deg, var(--success), var(--primary))",
              boxShadow: "0 0 20px rgba(0,201,109,0.3)"
            }}
          />
        </div>

        {/* Bottom Legend */}
        <div style={{ display: "flex", gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-sec)" }}>Concluído</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-sec)" }}>{total - obtained} em falta</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--warning)" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-sec)" }}>Trading Duplicates</span>
          </div>
        </div>
      </div>
    </div>
  );
}
