"use client";

import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import Image from "next/image";
import { getFlagUrl } from "@/types";
import { Camera, Plus, Minus, Star, Zap } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Props {
  sticker: any;
  quantity: number;
  onUpdate?: (id: string, newQty: number) => void;
  isEditMode?: boolean;
  readOnly?: boolean;
}

export default function StickerCard({ sticker, quantity, onUpdate, isEditMode }: Props) {
  const [showActions, setShowActions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  // 3D Tilt Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const isMissing = quantity === 0;
  const isDuplicate = quantity > 1;
  const isSpecial = sticker.raridade === "especial" || sticker.raridade === "lendaria";

  async function updateQty(diff: number) {
    const newQty = Math.max(0, quantity + diff);
    if (newQty === quantity) return;
    onUpdate(sticker.id, newQty);

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
    if (readOnly) return;
    if (isEditMode) {
      updateQty(1);
    } else {
      setShowActions(!showActions);
    }
  };

  return (
    <div style={{ perspective: 1000 }}>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ 
          position: "relative", cursor: "pointer",
          rotateX: isEditMode ? 0 : rotateX, 
          rotateY: isEditMode ? 0 : rotateY,
          transformStyle: "preserve-3d"
        }}
        onMouseMove={isEditMode ? undefined : handleMouseMove}
        onMouseLeave={isEditMode ? undefined : handleMouseLeave}
        onClick={handleCardClick}
      >
      <div className={isSpecial && !isMissing ? "sticker-holo" : ""} style={{
        aspectRatio: "3/4", borderRadius: 18, overflow: "hidden", position: "relative",
        background: isMissing ? "var(--input-bg)" : "var(--card-bg)",
        border: "1px solid",
        borderColor: isMissing
          ? "var(--border-light)"
          : isSpecial
            ? "var(--warning)"
            : "var(--border-color)",
        opacity: isMissing ? 0.35 : 1,
        transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: !isMissing
          ? isSpecial
            ? "0 8px 24px -8px rgba(212,160,23,0.3), 0 0 0 1px rgba(212,160,23,0.1)"
            : "var(--shadow-md)"
          : "none",
      }}>
        {/* Special golden glow */}
        {isSpecial && !isMissing && (
          <div style={{
            position: "absolute", inset: -2, borderRadius: 20,
            background: "var(--gradient-gold)", opacity: 0.08,
            zIndex: 0, pointerEvents: "none",
          }} />
        )}

        {/* Shine effect for special cards */}
        {isSpecial && !isMissing && (
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
            style={{
              position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
            }}
          />
        )}

        {/* Content */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "14px 10px", zIndex: 3 }}>
          {/* Top: Code + Special indicator */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <span style={{
              fontSize: 8, fontWeight: 900,
              color: isSpecial ? "var(--warning)" : "var(--text-muted)",
              textTransform: "uppercase", letterSpacing: "0.05em",
              background: isSpecial ? "var(--warning-light)" : "var(--bg-hover-strong)",
              padding: "2px 6px", borderRadius: 4,
            }}>
              {sticker.codigo}
            </span>
            {isSpecial && (
              <div style={{
                display: "flex", alignItems: "center", gap: 2,
                background: "var(--gradient-gold)", padding: "2px 6px",
                borderRadius: 4,
              }}>
                <Zap size={8} style={{ color: "#1A1100" }} />
                <span style={{ fontSize: 7, fontWeight: 900, color: "#1A1100", textTransform: "uppercase" }}>Rara</span>
              </div>
            )}
          </div>

          {/* Center: Image */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{
              width: "100%", aspectRatio: "4/3", position: "relative",
              borderRadius: 8, overflow: "hidden",
              background: isMissing ? "var(--bg-hover-strong)" : "rgba(0,0,0,0.15)",
            }}>
              <Image
                src={getFlagUrl(sticker.codigo)}
                alt={sticker.nome}
                fill
                sizes="(max-width: 768px) 100px, 150px"
                style={{
                  objectFit: "cover",
                  filter: isMissing ? "grayscale(1) contrast(0.4) brightness(0.8)" : "none",
                  transition: "filter 0.3s ease",
                }}
              />
            </div>
          </div>

          {/* Bottom: Player Name */}
          <div style={{ marginTop: 10, textAlign: "center" }}>
            <p style={{
              fontSize: 9, fontWeight: 700, color: "var(--text-main)",
              margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {sticker.nome}
            </p>
          </div>
        </div>

        {/* Quantity Badge */}
        {!isMissing && (
          <div style={{
            position: "absolute", top: 6, right: 6,
            background: isDuplicate ? "var(--gradient-primary)" : "var(--card-bg)",
            color: isDuplicate ? "#fff" : "var(--text-main)",
            fontSize: 9, fontWeight: 900, padding: "3px 8px", borderRadius: 8,
            border: isDuplicate ? "none" : "1px solid var(--border-color)",
            zIndex: 4, boxShadow: "var(--shadow-sm)",
          }}>
            x{quantity}
          </div>
        )}

        {/* Missing overlay icon */}
        {isMissing && (
          <div style={{
            position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
            width: 28, height: 28, borderRadius: "50%",
            background: "var(--bg-hover-strong)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 4,
          }}>
            <span style={{ fontSize: 14 }}>❓</span>
          </div>
        )}
      </div>

      {/* Edit Overlay / Quick Actions */}
      <AnimatePresence>
        {showActions && !isEditMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            style={{
              position: "absolute", inset: 0, zIndex: 10, borderRadius: 18,
              background: "rgba(6,11,24,0.88)", backdropFilter: "blur(8px)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
            }}
          >
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={(e) => { e.stopPropagation(); updateQty(-1); }}
                style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: "var(--danger-light)", color: "var(--danger)",
                  border: "1px solid rgba(255,77,106,0.2)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
              >
                <Minus size={18} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); updateQty(1); }}
                style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: "var(--success-light)", color: "var(--success)",
                  border: "1px solid rgba(0,214,143,0.2)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
              >
                <Plus size={18} />
              </button>
            </div>
            <label
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 10, fontWeight: 700, color: "var(--text-muted)", cursor: "pointer",
              }}
            >
              <Camera size={12} /> Foto
              <input type="file" style={{ display: "none" }} />
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Edit Mode Overlay */}
      {isEditMode && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 5, borderRadius: 18,
          background: "var(--bg-main-transparent)", backdropFilter: "blur(3px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
        }}>
          <div style={{
            fontSize: 18, fontWeight: 800, color: "var(--text-main)",
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            {quantity}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={(e) => { e.stopPropagation(); updateQty(-1); }}
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: "var(--danger-light)", color: "var(--danger)",
                border: "1px solid var(--danger)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 10px rgba(255,77,106,0.15)",
              }}
            >
              <Minus size={18} strokeWidth={3} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); updateQty(1); }}
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: "var(--success-light)", color: "var(--success)",
                border: "1px solid var(--success)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 10px rgba(0,214,143,0.15)",
              }}
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}
      </motion.div>
    </div>
  );
}
