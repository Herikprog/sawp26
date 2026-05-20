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
            width: "calc(100% - 32px)",
            maxWidth: 800,
          }}
        >
          <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-[20px] p-4 sm:p-6 shadow-[var(--shadow-xl)] flex flex-col gap-4 sm:gap-5 backdrop-blur-md">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="flex gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
                  <Cookie size={18} className="sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-[14px] sm:text-[16px] font-bold text-[var(--text-main)] mb-1 sm:mb-1.5 font-['Space_Grotesk',sans-serif]">
                    Valorizamos a tua privacidade
                  </h3>
                  <p className="text-[12px] sm:text-[13px] text-[var(--text-sec)] leading-relaxed max-w-[500px]">
                    A Troca Stickers utiliza cookies estritamente necessários para o funcionamento e segurança da plataforma (autenticação). Podes ler mais sobre isto na nossa{" "}
                    <Link href="/privacidade" className="text-[var(--primary)] font-semibold underline hover:opacity-80 transition-opacity">Política de Privacidade</Link>.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsVisible(false)}
                className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer p-1.5 flex items-center justify-center hover:bg-[var(--bg-sec)] rounded-full transition-colors shrink-0 -mt-1 -mr-1 sm:mt-0 sm:mr-0"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 sm:justify-end mt-1 sm:mt-2">
              <button 
                onClick={handleDecline}
                className="w-full sm:w-auto px-4 py-2.5 rounded-[10px] text-[13px] font-semibold bg-transparent text-[var(--text-sec)] border border-[var(--border-color)] cursor-pointer hover:bg-[var(--bg-sec)] transition-colors"
              >
                Recusar opcionais
              </button>
              <button 
                onClick={handleAccept}
                className="w-full sm:w-auto px-4 py-2.5 rounded-[10px] text-[13px] font-bold bg-[var(--text-main)] text-[var(--bg-main)] border-none cursor-pointer shadow-[var(--shadow-sm)] hover:opacity-90 transition-opacity"
              >
                Aceitar todos
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
