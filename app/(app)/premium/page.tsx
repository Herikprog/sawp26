"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check, Zap, Shield, Crown, Star, ArrowRight } from "lucide-react";

const FEATURES = [
  { icon: Zap, title: "Raio de Busca Estendido", desc: "Localiza e troca figurinhas com outros utilizadores num raio de busca ampliado de até 50km." },
  { icon: Shield, title: "Prioridade Absoluta nos Matches", desc: "Os teus interesses de troca aparecem sempre no topo para os colecionadores perto de ti." },
  { icon: Crown, title: "Badge Dourado de Destaque", desc: "Badge exclusivo com coroa dourada no teu perfil, feed social e listas de pesquisa." },
  { icon: Star, title: "Filtros de Pesquisa Avançados", desc: "Filtra utilizadores por seleções específicas, figurinhas repetidas e distância exata." },
  { icon: Check, title: "Propostas de Troca Ilimitadas", desc: "Propõe e aceita chamadas de troca em tempo real sem qualquer tipo de restrição diária." },
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
      <div style={{ display: "flex", justifyContent: "center" }}>
        {/* Premium Plan */}
        <div style={{ position: "relative", width: "100%", maxWidth: 480 }}>
          <div style={{
            position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
            background: "linear-gradient(135deg, #F5B700, #FFD95A)",
            color: "#0c1322", fontSize: 10, fontWeight: 900,
            padding: "5px 16px", borderRadius: 100,
            textTransform: "uppercase", letterSpacing: "0.15em", zIndex: 10,
          }}>
            Acesso Total
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
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{
                    background: "rgba(245,183,0,0.08)", borderRadius: 10, padding: 8,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    <f.icon size={16} style={{ color: "var(--warning)" }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", margin: "0 0 4px 0" }}>
                      {f.title}
                    </h4>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleSubscribe} disabled={loading}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "16px", borderRadius: 14, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #F5B700, #FFD95A)",
                color: "#0c1322", fontWeight: 800, fontSize: 15,
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
