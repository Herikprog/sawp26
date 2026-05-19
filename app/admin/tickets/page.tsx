"use client";

import { useState, useEffect } from "react";
import { MessageSquare, X, Send, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

interface Ticket {
  id: string;
  user_id: string;
  type: "support" | "report";
  subject: string;
  message: string;
  status: "open" | "replied" | "closed";
  admin_reply: string | null;
  created_at: string;
  profiles: { nome: string; cidade: string; plano: string };
}

const STATUS_CONFIG = {
  open:    { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  label: "Aberto" },
  replied: { color: "#4a9eff", bg: "rgba(74,158,255,0.1)",  label: "Respondido" },
  closed:  { color: "#64748b", bg: "rgba(100,116,139,0.1)", label: "Fechado" },
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState("open");

  async function fetchTickets() {
    setLoading(true);
    const res = await fetch(`/api/admin/tickets?status=${filter}`);
    const data = await res.json();
    setTickets(data.tickets || []);
    setLoading(false);
  }

  useEffect(() => { fetchTickets(); }, [filter]);

  async function handleReply() {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, admin_reply: reply, user_id: selected.user_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Resposta enviada!");
      setReply("");
      setSelected(null);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  async function closeTicket(id: string) {
    await fetch("/api/admin/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "closed" }),
    });
    toast.success("Ticket fechado.");
    setSelected(null);
    fetchTickets();
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#4a9eff", marginBottom: 6 }}>
          Suporte
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Tickets e Denúncias</h1>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["open", "replied", "closed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: "8px 18px", borderRadius: 10, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 700, textTransform: "capitalize",
              background: filter === s ? "#4a9eff" : "#0d1117",
              color: filter === s ? "#fff" : "#666",
              transition: "all 0.2s"
            }}
          >
            {STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#555" }}>A carregar...</div>
        ) : tickets.length === 0 ? (
          <div style={{ background: "#0d1117", border: "1px solid #1e2736", borderRadius: 16, padding: 48, textAlign: "center", color: "#555" }}>
            <MessageSquare size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p>Sem tickets nesta categoria.</p>
          </div>
        ) : tickets.map((ticket) => {
          const cfg = STATUS_CONFIG[ticket.status];
          return (
            <div
              key={ticket.id}
              onClick={() => { setSelected(ticket); setReply(""); }}
              style={{
                background: "#0d1117", border: "1px solid #1e2736", borderRadius: 16, padding: 20,
                cursor: "pointer", transition: "border-color 0.2s",
                display: "flex", justifyContent: "space-between", alignItems: "flex-start"
              }}
              onMouseEnter={(e: any) => e.currentTarget.style.borderColor = "#2a3a50"}
              onMouseLeave={(e: any) => e.currentTarget.style.borderColor = "#1e2736"}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
                    background: ticket.type === "report" ? "rgba(248,113,113,0.15)" : "rgba(74,158,255,0.1)",
                    color: ticket.type === "report" ? "#f87171" : "#4a9eff",
                    textTransform: "uppercase"
                  }}>
                    {ticket.type === "report" ? "🚨 Denúncia" : "💬 Suporte"}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: cfg.bg, color: cfg.color, textTransform: "uppercase" }}>
                    {cfg.label}
                  </span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{ticket.subject}</p>
                <p style={{ fontSize: 12, color: "#666", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 500 }}>
                  {ticket.message}
                </p>
                <p style={{ fontSize: 11, color: "#444", marginTop: 6 }}>
                  De: <span style={{ color: "#888" }}>{ticket.profiles?.nome || "Desconhecido"}</span>
                  {" · "}{new Date(ticket.created_at).toLocaleString("pt-PT")}
                </p>
              </div>
              <ChevronDown size={16} style={{ color: "#555", marginLeft: 12, transform: "rotate(-90deg)" }} />
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24
        }}>
          <div style={{
            background: "#0d1117", border: "1px solid #1e2736", borderRadius: 20,
            padding: 28, width: "100%", maxWidth: 560, maxHeight: "85vh", overflow: "auto", position: "relative"
          }}>
            <button onClick={() => setSelected(null)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#555", cursor: "pointer" }}>
              <X size={18} />
            </button>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, color: "#4a9eff", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>
                {selected.type === "report" ? "🚨 Denúncia" : "💬 Suporte"} · {selected.profiles?.nome}
              </p>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{selected.subject}</h2>
            </div>

            {/* Original message */}
            <div style={{ background: "#0a0f1a", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Mensagem do utilizador:</p>
              <p style={{ fontSize: 14, color: "#d1d5db", lineHeight: 1.6 }}>{selected.message}</p>
            </div>

            {/* Existing reply */}
            {selected.admin_reply && (
              <div style={{ background: "rgba(74,158,255,0.06)", border: "1px solid rgba(74,158,255,0.15)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: "#4a9eff", fontWeight: 700, marginBottom: 6 }}>✅ Resposta enviada:</p>
                <p style={{ fontSize: 14, color: "#d1d5db", lineHeight: 1.6 }}>{selected.admin_reply}</p>
              </div>
            )}

            {/* Reply box */}
            {selected.status !== "closed" && (
              <div>
                <textarea
                  placeholder="Escreve a tua resposta aqui..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={4}
                  style={{
                    width: "100%", padding: "12px 14px", background: "#0a0f1a",
                    border: "1px solid #1e2736", borderRadius: 12, color: "#fff",
                    fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box"
                  }}
                />
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button
                    onClick={handleReply}
                    disabled={sending || !reply.trim()}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: "12px", background: "#4a9eff", border: "none", borderRadius: 12,
                      color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700,
                      opacity: (sending || !reply.trim()) ? 0.5 : 1
                    }}
                  >
                    <Send size={14} /> {sending ? "A enviar..." : "Enviar Resposta"}
                  </button>
                  <button
                    onClick={() => closeTicket(selected.id)}
                    style={{
                      padding: "12px 20px", background: "rgba(100,116,139,0.15)", border: "1px solid #1e2736",
                      borderRadius: 12, color: "#64748b", cursor: "pointer", fontSize: 13, fontWeight: 600
                    }}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
