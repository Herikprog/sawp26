"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function BannedContent() {
  const params = useSearchParams();
  const until = params.get("until");
  const reason = params.get("reason");
  const isSuspended = !!until;
  const untilDate = until ? new Date(until).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div style={{
      minHeight: "100vh", background: "#080b14",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', sans-serif", padding: 24
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      <div style={{ maxWidth: 480, width: "100%", textAlign: "center", position: "relative", zIndex: 1 }}>
        {/* Icon */}
        <div style={{
          width: 88, height: 88, borderRadius: "50%",
          background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 28px", fontSize: 36
        }}>
          {isSuspended ? "⏸" : "🚫"}
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", marginBottom: 12 }}>
          {isSuspended ? "Conta Suspensa" : "Conta Banida"}
        </h1>

        <p style={{ fontSize: 15, color: "#9ca3af", lineHeight: 1.7, marginBottom: 8 }}>
          {isSuspended
            ? "A tua conta foi temporariamente suspensa por infração às regras da plataforma."
            : "A tua conta foi permanentemente banida por infração grave às regras da plataforma."}
        </p>

        {isSuspended && untilDate && (
          <div style={{
            background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
            borderRadius: 12, padding: "14px 20px", margin: "20px 0",
          }}>
            <p style={{ fontSize: 13, color: "#fbbf24", fontWeight: 600 }}>
              Acesso restabelecido em: {untilDate}
            </p>
          </div>
        )}

        {reason ? (
          <div style={{
            background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 16, padding: "20px 24px", margin: "24px 0", textAlign: "left"
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#f87171", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              ⚠️ Motivo da Decisão:
            </p>
            <p style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
              "{reason}"
            </p>
          </div>
        ) : (
          <div style={{
            background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: 16, padding: 20, margin: "24px 0", textAlign: "left"
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#f87171", marginBottom: 10 }}>📋 Possíveis motivos:</p>
            <ul style={{ margin: 0, padding: "0 0 0 18px", color: "#9ca3af", fontSize: 13, lineHeight: 2 }}>
              <li>Comportamento abusivo ou desrespeitoso</li>
              <li>Uso fraudulento da plataforma</li>
              <li>Violação dos Termos de Serviço</li>
              <li>Spam ou atividade automatizada</li>
            </ul>
          </div>
        )}

        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
          Se acreditas que foi um erro, contacta o suporte através do email{" "}
          <a href="mailto:suporte@trocastickers.com" style={{ color: "#4a9eff", textDecoration: "none" }}>
            suporte@trocastickers.com
          </a>
        </p>

        <div style={{ margin: "24px 0" }}>
          <Link
            href="/dashboard"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
              color: "#fff",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)",
              transition: "all 0.2s"
            }}
          >
            Tentar Entrar Novamente
          </Link>
        </div>

        {/* Botão de voltar apenas para suspensão temporária */}
        {isSuspended && (
          <p style={{ fontSize: 12, color: "#555", marginTop: 8 }}>
            A página irá desbloquear automaticamente quando a suspensão terminar.
          </p>
        )}

        <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid #1e2736" }}>
          <p style={{ fontSize: 11, color: "#4a5568" }}>
            Troca Stickers · Copa do Mundo 2026 · v2.0.0
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BannedPage() {
  return (
    <Suspense fallback={null}>
      <BannedContent />
    </Suspense>
  );
}
