"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { getFlagUrl } from "@/types";
import { Camera, Plus, Minus, Star, Zap } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Props {
  sticker: any;
  quantity: number;
  onUpdate: (id: string, newQty: number) => void;
  isEditMode?: boolean;
}

export default function StickerCard({ sticker, quantity, onUpdate, isEditMode }: Props) {
  const [showActions, setShowActions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  const isMissing = quantity === 0;
  const isDuplicate = quantity > 1;
  const isSpecial = sticker.raridade === "especial" || sticker.raridade === "lendaria";

  async function updateQty(diff: number) {
    const newQty = Math.max(0, quantity + diff);
    if (newQty === quantity) return;
    onUpdate(sticker.id, newQty);
    
    // Proactive DB update (optimistic UI is handled by onUpdate)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from("user_stickers").upsert({
      user_id: user.id,
      sticker_id: sticker.id,
      quantity: newQty,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id, sticker_id" });
  }

  const handleCardClick = () => {
    if (isEditMode) {
      updateQty(1);
    } else {
      setShowActions(!showActions);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      style={{ position: "relative", cursor: "pointer" }}
      onClick={handleCardClick}
    >
      <div style={{
        aspectRatio: "3/4", borderRadius: 20, overflow: "hidden", position: "relative",
        background: isMissing ? "var(--input-bg)" : "var(--card-bg)",
        border: "1px solid",
        borderColor: isMissing ? "var(--border-light)" : isSpecial ? "var(--warning)" : "rgba(255,255,255,0.1)",
        opacity: isMissing ? 0.4 : 1,
        transition: "all 0.3s ease",
        boxShadow: !isMissing ? "0 10px 30px -10px rgba(0,0,0,0.5)" : "none"
      }}>
        
        {/* Special Shine */}
        {isSpecial && !isMissing && (
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            style={{
              position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)"
            }}
          />
        )}

        {/* Content */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "16px 12px" }}>
          {/* Top: Team & Code */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: isSpecial ? "var(--warning)" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {sticker.codigo}
            </span>
            {isSpecial && <Zap size={10} style={{ color: "var(--warning)", fill: "var(--warning)" }} />}
          </div>

          {/* Center: Image */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ width: "100%", aspectRatio: "4/3", position: "relative", borderRadius: 8, overflow: "hidden", background: "rgba(0,0,0,0.2)" }}>
              <Image
                src={getFlagUrl(sticker.codigo)}
                alt={sticker.nome}
                fill
                sizes="(max-width: 768px) 100px, 150px"
                style={{ objectFit: "cover", filter: isMissing ? "grayscale(1) contrast(0.5)" : "none" }}
              />
            </div>
          </div>

          {/* Bottom: Player Name */}
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-main)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {sticker.nome}
            </p>
          </div>
        </div>

        {/* Quantity Badge */}
        {!isMissing && (
          <div style={{
            position: "absolute", top: 8, right: 8, background: isDuplicate ? "var(--primary)" : "var(--card-bg)",
            color: "var(--text-main)", fontSize: 10, fontWeight: 900, padding: "2px 8px", borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)", zIndex: 2
          }}>
            x{quantity}
          </div>
        )}
      </div>

      {/* Edit Overlay / Quick Actions */}
      <AnimatePresence>
        {showActions && !isEditMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: "absolute", inset: 0, zIndex: 10, borderRadius: 20,
              background: "rgba(7,17,31,0.9)", backdropFilter: "blur(8px)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={(e) => { e.stopPropagation(); updateQty(-1); }}
                style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,59,63,0.15)", color: "#FF3B3F", border: "1px solid rgba(255,59,63,0.2)", cursor: "pointer" }}
              >
                <Minus size={20} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); updateQty(1); }}
                style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(0,201,109,0.15)", color: "var(--success)", border: "1px solid rgba(0,201,109,0.2)", cursor: "pointer" }}
              >
                <Plus size={20} />
              </button>
            </div>
            <label 
              onClick={(e) => e.stopPropagation()}
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: "var(--text-muted)", cursor: "pointer" }}
            >
              <Camera size={14} /> Foto
              <input type="file" style={{ display: "none" }} />
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Edit Mode Overlay */}
      {isEditMode && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 5, borderRadius: 20,
          background: "var(--bg-main-transparent)", backdropFilter: "blur(2px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)", marginBottom: -4 }}>
            Qtd: {quantity}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <button
              onClick={(e) => { e.stopPropagation(); updateQty(-1); }}
              style={{
                width: 40, height: 40, borderRadius: 12, background: "var(--danger-light)", 
                color: "var(--danger)", border: "1px solid var(--danger)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 10px rgba(238,50,78,0.2)"
              }}
            >
              <Minus size={20} strokeWidth={3} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); updateQty(1); }}
              style={{
                width: 40, height: 40, borderRadius: 12, background: "var(--success-light)", 
                color: "var(--success)", border: "1px solid var(--success)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 10px rgba(0,201,109,0.2)"
              }}
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
