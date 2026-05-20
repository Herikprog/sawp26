"use client";

import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem("trocastickers_cookie_consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("trocastickers_cookie_consent", "true");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("trocastickers_cookie_consent", "false");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            width: "calc(100% - 48px)",
            maxWidth: 800,
          }}
        >
          <div style={{
            background: "var(--bg-main)",
            border: "1px solid var(--border-color)",
            borderRadius: 20,
            padding: "clamp(16px, 4vw, 24px)",
            boxShadow: "var(--shadow-xl)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            backdropFilter: "blur(12px)",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: "var(--primary-light)", color: "var(--primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0
                }}>
                  <Cookie size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif" }}>
                    Valorizamos a tua privacidade
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.5, maxWidth: 500 }}>
                    A Troca Stickers utiliza cookies estritamente necessários para o funcionamento e segurança da plataforma (autenticação). Podes ler mais sobre isto na nossa{" "}
                    <Link href="/privacidade" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "underline" }}>Política de Privacidade</Link>.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsVisible(false)}
                style={{ 
                  background: "transparent", border: "none", color: "var(--text-muted)",
                  cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center"
                }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "flex-end", marginTop: 4 }}>
              <button 
                onClick={handleDecline}
                style={{
                  padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: "transparent", color: "var(--text-sec)", border: "1px solid var(--border-color)",
                  cursor: "pointer"
                }}
              >
                Recusar cookies opcionais
              </button>
              <button 
                onClick={handleAccept}
                style={{
                  padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                  background: "var(--text-main)", color: "var(--bg-main)", border: "none",
                  cursor: "pointer", boxShadow: "var(--shadow-sm)"
                }}
              >
                Aceitar todos os cookies
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
