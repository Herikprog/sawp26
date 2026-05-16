"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check, Zap, Shield, Crown, Star, ArrowRight } from "lucide-react";

const FEATURES = [
  { icon: Zap, text: "Raio de busca de 50km (vs 10km gratuito)" },
  { icon: Shield, text: "Prioridade máxima nos resultados de match" },
  { icon: Crown, text: "Badge dourado exclusivo no perfil" },
  { icon: Star, text: "Acesso antecipado a novas funcionalidades" },
];

export default function PremiumPage() {
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
      else throw new Error("Sem URL");
    } catch {
      toast.error("Erro ao iniciar pagamento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 24px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 64 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          marginBottom: 20, padding: "6px 16px", borderRadius: 100,
          background: "var(--warning-light)", border: "1px solid rgba(245,183,0,0.2)",
        }}>
          <Star size={14} style={{ color: "var(--warning)", fill: "var(--warning)" }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--warning)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Plano Premium
          </span>
        </div>

        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 40,
          fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.03em",
          marginBottom: 16,
        }}>
          Torna-te um Colecionador de Elite
        </h1>
        <p style={{ color: "var(--text-sec)", fontSize: 17, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
          Completa o teu álbum 3x mais rápido com ferramentas profissionais.
        </p>
      </div>

      {/* Plans Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        {/* Free Plan */}
        <div style={{
          background: "var(--card-bg)", borderRadius: 28,
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "48px 36px", opacity: 0.7,
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-sec)", marginBottom: 8 }}>Explorador</p>
          <p style={{ fontSize: 36, fontWeight: 800, color: "var(--text-main)", marginBottom: 32, fontFamily: "'Space Grotesk', sans-serif" }}>
            Grátis
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Check size={16} style={{ color: "var(--success)" }} />
              <span style={{ fontSize: 14, color: "var(--text-sec)" }}>Registo de figurinhas</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Check size={16} style={{ color: "var(--success)" }} />
              <span style={{ fontSize: 14, color: "var(--text-sec)" }}>Matching básico (10km)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, opacity: 0.4 }}>
              <Check size={16} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: 14, color: "var(--text-muted)" }}>Prioridade nos matches</span>
            </div>
          </div>

          <button disabled style={{
            width: "100%", padding: "14px", borderRadius: 14,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "var(--text-muted)", fontWeight: 600, fontSize: 14, cursor: "not-allowed",
          }}>
            Plano Atual
          </button>
        </div>

        {/* Premium Plan */}
        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
            background: "linear-gradient(135deg, #F5B700, #FFD95A)",
            color: "var(--bg-main)", fontSize: 10, fontWeight: 900,
            padding: "5px 16px", borderRadius: 100,
            textTransform: "uppercase", letterSpacing: "0.15em", zIndex: 10,
          }}>
            Recomendado
          </div>

          <div style={{
            background: "var(--card-bg)", borderRadius: 28,
            border: "1px solid rgba(245,183,0,0.25)",
            padding: "48px 36px",
            boxShadow: "0 0 60px -20px rgba(245,183,0,0.15)",
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--warning)", marginBottom: 8 }}>Colecionador Pro</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 32 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: "var(--text-main)", fontFamily: "'Space Grotesk', sans-serif" }}>
                4,99€
              </span>
              <span style={{ fontSize: 14, color: "var(--text-muted)" }}>/mês</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <f.icon size={16} style={{ color: "var(--warning)", marginTop: 2 }} />
                  <span style={{ fontSize: 14, color: "var(--text-main)" }}>{f.text}</span>
                </div>
              ))}
            </div>

            <button onClick={handleSubscribe} disabled={loading}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "16px", borderRadius: 14, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #F5B700, #FFD95A)",
                color: "var(--bg-main)", fontWeight: 800, fontSize: 15,
                boxShadow: "0 8px 24px -4px rgba(245,183,0,0.3)",
                transition: "all 0.3s ease",
              }}>
              {loading ? "A processar..." : "Subscrever Agora"}
              <ArrowRight size={16} />
            </button>

            <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 16 }}>
              Cancela a qualquer momento. Pagamento seguro via Stripe.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16,
        marginTop: 48,
      }}>
        {[
          { val: "50km", label: "Raio de Busca" },
          { val: "#1", label: "Nos Matches" },
          { val: "∞", label: "Trocas Ativas" },
          { val: "⭐", label: "Badge Dourado" },
        ].map((s, i) => (
          <div key={i} style={{
            textAlign: "center", padding: "20px 16px", borderRadius: 20,
            background: "var(--bg-sec)", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: "var(--warning)", marginBottom: 4 }}>{s.val}</p>
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
