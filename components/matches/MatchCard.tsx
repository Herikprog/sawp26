"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { MatchResult } from "@/types";
import { formatDistance } from "@/lib/utils";
import { MessageCircle, Shuffle, Star, MapPin, ChevronRight, Zap, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Props {
  match: MatchResult;
  myUserId: string;
  index: number;
}

export default function MatchCard({ match, myUserId, index }: Props) {
  const router = useRouter();
  const supabase = createClient();

  async function openChat() {
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(`and(user_a_id.eq.${myUserId},user_b_id.eq.${match.user_id}),and(user_a_id.eq.${match.user_id},user_b_id.eq.${myUserId})`)
      .single();

    if (existing) {
      router.push(`/chat/${existing.id}`);
      return;
    }

    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ user_a_id: myUserId, user_b_id: match.user_id })
      .select("id")
      .single();

    if (error) {
      toast.error("Erro ao abrir chat");
      return;
    }
    router.push(`/chat/${created.id}`);
  }

  const stickersTem = match.stickers_tem ?? [];
  const stickersPrecisa = match.stickers_precisa ?? [];
  const mutual = Math.min(stickersTem.length, stickersPrecisa.length);
  const scoreColor = match.score >= 80 ? "var(--success)" : match.score >= 50 ? "var(--primary)" : "var(--warning)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "var(--card-bg)", borderRadius: 24,
        border: "1px solid var(--border-color)",
        padding: 0, display: "flex", flexDirection: "column",
        transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "default", overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--primary-light-strong)";
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "var(--shadow-lg)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-color)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      }}
    >
      {/* Top accent */}
      <div style={{
        height: 3,
        background: match.score >= 80
          ? "var(--gradient-success)"
          : match.score >= 50
            ? "var(--gradient-primary)"
            : "var(--gradient-warm)",
      }} />

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Avatar */}
          <div style={{ position: "relative" }}>
            {match.avatar_url ? (
              <Image src={match.avatar_url} alt={match.nome} width={56} height={56} style={{ borderRadius: 18, objectFit: "cover" }} />
            ) : (
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: "var(--gradient-primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 800, color: "#fff",
              }}>
                {match.nome[0]?.toUpperCase()}
              </div>
            )}
            {match.is_premium && (
              <div style={{
                position: "absolute", top: -3, right: -3, width: 22, height: 22,
                background: "var(--gradient-gold)", borderRadius: 7,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 10px rgba(212,160,23,0.3)",
              }}>
                <Star size={10} style={{ color: "#1A1100", fill: "#1A1100" }} />
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{match.nome}</p>
              {match.is_premium && (
                <span className="badge-pro">
                  <Star size={7} style={{ fill: "var(--warning)" }} />PRO
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <MapPin size={11} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {match.bairro ?? match.cidade ?? "—"} · {formatDistance(match.distancia_km)}
              </span>
            </div>
          </div>

          {/* Score */}
          <div style={{
            textAlign: "center", padding: "12px 16px", borderRadius: 16,
            background: `${scoreColor}10`, border: `1px solid ${scoreColor}18`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
              <TrendingUp size={13} style={{ color: scoreColor }} />
              <span style={{
                fontSize: 22, fontWeight: 800, color: scoreColor,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                {Math.round(match.score)}
              </span>
            </div>
            <p style={{ fontSize: 8, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
              Match
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            { value: stickersTem.length, label: "Ele tem\nque me falta", color: "var(--success)", bg: "var(--success-light)", icon: "📥" },
            { value: mutual, label: "Trocas\nPossíveis", color: "var(--primary)", bg: "var(--primary-light)", icon: "🔄" },
            { value: stickersPrecisa.length, label: "Eu tenho\nque lhe falta", color: "var(--warning)", bg: "var(--warning-light)", icon: "📤" },
          ].map(({ value, label, color, bg, icon }) => (
            <div key={label} style={{
              padding: "14px 10px", borderRadius: 16, background: bg,
              border: `1px solid ${color}12`, textAlign: "center",
            }}>
              <span style={{ fontSize: 12, display: "block", marginBottom: 4 }}>{icon}</span>
              <p style={{ fontSize: 20, fontWeight: 800, color, marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
              <p style={{
                fontSize: 8, fontWeight: 700, color: "var(--text-muted)",
                textTransform: "uppercase", lineHeight: 1.3, whiteSpace: "pre-line",
              }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Primary Action */}
        <button
          onClick={openChat}
          style={{
            width: "100%", padding: "16px", borderRadius: 14,
            background: "var(--gradient-primary)", color: "#fff", fontWeight: 700,
            fontSize: 14, display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8, border: "none", cursor: "pointer",
            boxShadow: "0 8px 24px -4px rgba(0,153,255,0.25)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 12px 32px -4px rgba(0,153,255,0.4)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 8px 24px -4px rgba(0,153,255,0.25)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <MessageCircle size={16} />
          Iniciar Negociação
          <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}
