"use client";

import { useState } from "react";
import { MessageSquare, Flag, Send, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

type TicketType = "support" | "report";

export default function SupportPage() {
  const [type, setType] = useState<TicketType>("support");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!subject.trim() || !message.trim()) {
      toast.error("Preenche todos os campos.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div style={{
        maxWidth: 520, margin: "80px auto", padding: "0 24px",
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center"
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "rgba(52,211,153,0.1)", border: "2px solid rgba(52,211,153,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24
        }}>
          <CheckCircle size={36} style={{ color: "#34d399" }} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-main)", marginBottom: 12 }}>
          Mensagem Enviada!
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.7, marginBottom: 32 }}>
          O teu {type === "report" ? "denúncia" : "pedido de suporte"} foi recebido com sucesso.
          A nossa equipa vai analisar e responder diretamente nas tuas notificações.
        </p>
        <button
          onClick={() => { setDone(false); setSubject(""); setMessage(""); }}
          style={{
            padding: "12px 28px", background: "var(--primary-light)", border: "1px solid var(--primary-light-strong)",
            borderRadius: 12, color: "var(--primary)", cursor: "pointer", fontSize: 13, fontWeight: 700
          }}
        >
          Enviar nova mensagem
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--primary)", marginBottom: 8 }}>
          Ajuda
        </p>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.02em", marginBottom: 8 }}>
          Suporte e Denúncias
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
          Tens algum problema ou queres denunciar um utilizador? Envia-nos uma mensagem.
        </p>
      </div>

      {/* Type Selector */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <button
          onClick={() => setType("support")}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "14px", borderRadius: 14, cursor: "pointer", fontSize: 13, fontWeight: 700,
            background: type === "support" ? "var(--primary-light)" : "var(--card-bg)",
            border: type === "support" ? "1px solid var(--primary-light-strong)" : "1px solid var(--border-color)",
            color: type === "support" ? "var(--primary)" : "var(--text-sec)",
            transition: "all 0.2s"
          }}
        >
          <MessageSquare size={16} /> Pedir Suporte
        </button>
        <button
          onClick={() => setType("report")}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "14px", borderRadius: 14, cursor: "pointer", fontSize: 13, fontWeight: 700,
            background: type === "report" ? "rgba(248,113,113,0.1)" : "var(--card-bg)",
            border: type === "report" ? "1px solid rgba(248,113,113,0.25)" : "1px solid var(--border-color)",
            color: type === "report" ? "#f87171" : "var(--text-sec)",
            transition: "all 0.2s"
          }}
        >
          <Flag size={16} /> Fazer Denúncia
        </button>
      </div>

      {/* Form Card */}
      <div style={{
        background: "var(--card-bg)", border: "1px solid var(--border-color)",
        borderRadius: 20, padding: 28, display: "flex", flexDirection: "column", gap: 16
      }}>
        {type === "report" && (
          <div style={{
            padding: "12px 16px", background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)", borderRadius: 12
          }}>
            <p style={{ fontSize: 12, color: "#f87171", fontWeight: 600 }}>
              🚨 Preenche com o máximo de detalhes possível para agilizar a análise.
            </p>
          </div>
        )}

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
            Assunto
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={type === "report" ? "Ex: Utilizador com comportamento abusivo" : "Ex: Problema ao enviar figurinha"}
            style={{
              width: "100%", padding: "11px 14px",
              background: "var(--input-bg)", border: "1px solid var(--border-color)",
              borderRadius: 12, color: "var(--text-main)", fontSize: 13,
              outline: "none", boxSizing: "border-box"
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
            Mensagem
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Descreve o teu problema ou situação em detalhes..."
            rows={6}
            style={{
              width: "100%", padding: "11px 14px",
              background: "var(--input-bg)", border: "1px solid var(--border-color)",
              borderRadius: 12, color: "var(--text-main)", fontSize: 13,
              outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6
            }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={sending || !subject.trim() || !message.trim()}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "14px", borderRadius: 14, border: "none", cursor: "pointer",
            background: type === "report"
              ? "linear-gradient(135deg, #ef4444, #f87171)"
              : "var(--gradient-primary)",
            color: "#fff", fontSize: 14, fontWeight: 700,
            opacity: (sending || !subject.trim() || !message.trim()) ? 0.5 : 1,
            transition: "all 0.2s"
          }}
        >
          <Send size={15} />
          {sending ? "A enviar..." : type === "report" ? "Enviar Denúncia" : "Enviar Pedido de Suporte"}
        </button>
      </div>
    </div>
  );
}
