"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { MatchResult } from "@/types";
import { formatDistance } from "@/lib/utils";
import { MessageCircle, Shuffle, Star, MapPin, ChevronRight, Zap } from "lucide-react";
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

  const mutual = Math.min(match.stickers_tem.length, match.stickers_precisa.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "var(--card-bg)", borderRadius: 28, border: "1px solid rgba(255,255,255,0.08)",
        padding: 32, display: "flex", flexDirection: "column", gap: 28,
        transition: "all 0.3s ease", cursor: "default"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(0,174,239,0.2)";
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 20px 40px -15px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-color)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* Avatar Area */}
        <div style={{ position: "relative" }}>
          {match.avatar_url ? (
            <Image src={match.avatar_url} alt={match.nome} width={64} height={64} style={{ borderRadius: 20, objectFit: "cover" }} />
          ) : (
            <div style={{
              width: 64, height: 64, borderRadius: 20, background: "var(--input-bg)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 700, color: "var(--primary)",
            }}>
              {match.nome[0]?.toUpperCase()}
            </div>
          )}
          {match.is_premium && (
            <div style={{
              position: "absolute", top: -4, right: -4, width: 24, height: 24,
              background: "var(--warning)", borderRadius: 8, display: "flex",
              alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 10px rgba(245,183,0,0.3)"
            }}>
              <Star size={12} style={{ color: "var(--bg-main)", fill: "var(--bg-main)" }} />
            </div>
          )}
        </div>

        {/* Info Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{match.nome}</p>
            {match.is_premium && (
               <span style={{
                 fontSize: 9, fontWeight: 900, color: "var(--warning)",
                 background: "var(--warning-light)", padding: "2px 8px",
                 borderRadius: 6, textTransform: "uppercase"
               }}>PRO</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <MapPin size={12} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {match.bairro ?? match.cidade ?? "—"} · {formatDistance(match.distancia_km)}
            </span>
          </div>
        </div>

        {/* AI Score */}
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
            <Zap size={14} style={{ color: "var(--primary)" }} />
            <span style={{ fontSize: 24, fontWeight: 800, color: "var(--text-main)", fontFamily: "'Space Grotesk', sans-serif" }}>
              {Math.round(match.score)}
            </span>
          </div>
          <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Compatibilidade</p>
        </div>
      </div>

      {/* Analytics Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <div style={{
          padding: 16, borderRadius: 20, background: "var(--bg-hover-strong)",
          border: "1px solid rgba(255,255,255,0.04)", textAlign: "center"
        }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: "var(--success)", marginBottom: 4 }}>{match.stickers_tem.length}</p>
          <p style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", lineHeight: 1.2 }}>Ele tem<br/>que me falta</p>
        </div>
        <div style={{
          padding: 16, borderRadius: 20, background: "rgba(0,174,239,0.05)",
          border: "1px solid rgba(0,174,239,0.1)", textAlign: "center"
        }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: "var(--primary)", marginBottom: 4 }}>{mutual}</p>
          <p style={{ fontSize: 9, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", lineHeight: 1.2 }}>Trocas<br/>Possíveis</p>
        </div>
        <div style={{
          padding: 16, borderRadius: 20, background: "var(--bg-hover-strong)",
          border: "1px solid rgba(255,255,255,0.04)", textAlign: "center"
        }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: "var(--warning)", marginBottom: 4 }}>{match.stickers_precisa.length}</p>
          <p style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", lineHeight: 1.2 }}>Eu tenho<br/>que lhe falta</p>
        </div>
      </div>

      {/* Primary Action */}
      <button
        onClick={openChat}
        style={{
          width: "100%", padding: "18px", borderRadius: 16,
          background: "var(--primary)", color: "var(--text-main)", fontWeight: 700,
          fontSize: 15, display: "flex", alignItems: "center",
          justifyContent: "center", gap: 10, border: "none", cursor: "pointer",
          boxShadow: "0 8px 20px -4px rgba(0,174,239,0.3)",
          transition: "all 0.3s ease"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = "brightness(1.1)";
          e.currentTarget.style.boxShadow = "0 12px 30px -4px rgba(0,174,239,0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = "brightness(1)";
          e.currentTarget.style.boxShadow = "0 8px 20px -4px rgba(0,174,239,0.3)";
        }}
      >
        <MessageCircle size={18} />
        Iniciar Negociação
        <ChevronRight size={16} />
      </button>
    </motion.div>
  );
}
