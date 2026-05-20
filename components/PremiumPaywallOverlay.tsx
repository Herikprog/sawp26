"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Crown, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

interface PremiumPaywallOverlayProps {
  children: React.ReactNode;
  pageName: string;
  explanation: string;
  benefits: string[];
}

export default function PremiumPaywallOverlay({
  children,
  pageName,
  explanation,
  benefits,
}: PremiumPaywallOverlayProps) {
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkPlan() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsPremium(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("plano")
          .eq("id", user.id)
          .single();

        setIsPremium(profile?.plano === "premium");
      } catch (err) {
        console.error("Erro ao carregar plano do utilizador:", err);
        setIsPremium(false);
      }
    }

    checkPlan();
  }, [supabase]);

  async function handleSubscribe() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("Sem URL");
      }
    } catch {
      toast.error("Erro ao iniciar pagamento.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  // Se ainda estiver a carregar, exibe o conteúdo original para evitar piscadas
  if (isPremium === null) {
    return <>{children}</>;
  }

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "80vh" }}>
      {/* Conteúdo da página original, mas ofuscado e sem interações */}
      <div
        style={{
          filter: "blur(14px)",
          pointerEvents: "none",
          userSelect: "none",
          width: "100%",
          height: "100%",
          transition: "filter 0.3s ease",
        }}
      >
        {children}
      </div>

      {/* Overlay do Paywall */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          zIndex: 100,
          background: "rgba(10, 15, 30, 0.4)",
        }}
      >
        <div
          style={{
            background: "rgba(13, 22, 45, 0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderRadius: 32,
            border: "1px solid rgba(251, 191, 36, 0.25)",
            boxShadow: "0 24px 80px rgba(0, 0, 0, 0.6), 0 0 40px rgba(251, 191, 36, 0.1)",
            padding: "48px 36px",
            maxWidth: 520,
            width: "100%",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            animation: "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Luz de Fundo Dourada */}
          <div
            style={{
              position: "absolute",
              top: -60,
              left: "50%",
              transform: "translateX(-50%)",
              width: 180,
              height: 180,
              background: "var(--warning, #fbbf24)",
              opacity: 0.15,
              borderRadius: "50%",
              filter: "blur(50px)",
              pointerEvents: "none",
            }}
          />

          {/* Ícone de Coroa Dourada Flutuante */}
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 24,
              background: "linear-gradient(135deg, #FFE082 0%, #FFB300 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 28px",
              boxShadow: "0 12px 24px -4px rgba(251, 191, 36, 0.4), 0 0 20px rgba(251, 191, 36, 0.2)",
              animation: "float 4s ease-in-out infinite",
            }}
          >
            <Crown size={36} style={{ color: "#4A2B00", fill: "#4A2B00" }} />
          </div>

          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "var(--warning, #fbbf24)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(251, 191, 36, 0.1)",
              padding: "6px 14px",
              borderRadius: 100,
              marginBottom: 16,
            }}
          >
            <Sparkles size={12} /> Acesso Exclusivo Premium
          </span>

          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 28,
              fontWeight: 700,
              color: "var(--text-main)",
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            {pageName}
          </h2>

          <p
            style={{
              color: "var(--text-sec)",
              fontSize: 14,
              lineHeight: 1.6,
              marginBottom: 32,
              padding: "0 10px",
            }}
          >
            {explanation}
          </p>

          {/* Lista de Vantagens */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: 20,
              border: "1px solid rgba(255, 255, 255, 0.05)",
              padding: "20px 24px",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginBottom: 36,
            }}
          >
            {benefits.map((benefit, index) => (
              <div key={index} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <CheckCircle2 size={16} style={{ color: "var(--warning, #fbbf24)", flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: "var(--text-sec)", fontWeight: 500 }}>{benefit}</span>
              </div>
            ))}
          </div>

          {/* Ações */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <button
              onClick={handleSubscribe}
              disabled={checkoutLoading}
              style={{
                width: "100%",
                height: 52,
                borderRadius: 16,
                background: "var(--gradient-gold, linear-gradient(135deg, #fbbf24 0%, #d97706 100%))",
                color: "#1a1100",
                fontSize: 15,
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 10px 24px -4px rgba(251, 191, 36, 0.35)",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              className="premium-pulse-button"
            >
              {checkoutLoading ? (
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #1a1100", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
              ) : (
                <>
                  Obter Acesso Premium · 4,99€
                  <ArrowRight size={16} />
                </>
              )}
            </button>
            <a
              href="/premium"
              style={{
                color: "var(--text-muted)",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-main)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              Saber mais sobre o Plano Premium
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .premium-pulse-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px -4px rgba(251, 191, 36, 0.5);
        }
        .premium-pulse-button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
