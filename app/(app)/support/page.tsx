"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Flag, Send, CheckCircle, Clock, Shield, Eye, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

type TicketType = "support" | "report";

interface Ticket {
  id: string;
  type: TicketType;
  subject: string;
  message: string;
  status: "open" | "replied" | "closed";
  admin_reply: string | null;
  created_at: string;
  replied_at: string | null;
}

export default function SupportPage() {
  const [type, setType] = useState<TicketType>("support");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  
  // Histórico de Tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  async function loadTickets() {
    try {
      const res = await fetch("/api/support/tickets");
      if (!res.ok) throw new Error("Falha ao carregar histórico");
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingTickets(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

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
      loadTickets();
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--primary)", marginBottom: 8 }}>
          Ajuda & Central de Mensagens
        </p>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.02em", marginBottom: 8 }}>
          Suporte e Denúncias
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
          Tens algum problema, dúvida ou queres denunciar um utilizador? Envia-nos uma mensagem e acompanha as respostas. Se preferires, também nos podes contactar pelo e-mail:{" "}
          <a href="mailto:suporte@trocastickers.email" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
            suporte@trocastickers.email
          </a>
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
        
        {/* LADO ESQUERDO: Form de envio */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-main)", marginBottom: 16 }}>
            Nova Mensagem
          </h2>

          {done ? (
            <div style={{
              background: "var(--card-bg)", border: "1px solid var(--border-color)",
              borderRadius: 20, padding: 32, textAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center"
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(52,211,153,0.1)", border: "2px solid rgba(52,211,153,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20
              }}>
                <CheckCircle size={28} style={{ color: "#34d399" }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-main)", marginBottom: 8 }}>
                Mensagem Enviada!
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 24 }}>
                O teu {type === "report" ? "denúncia" : "pedido de suporte"} foi recebido com sucesso.
                A nossa equipa vai responder diretamente aqui no teu painel.
              </p>
              <button
                onClick={() => { setDone(false); setSubject(""); setMessage(""); }}
                style={{
                  padding: "10px 24px", background: "var(--primary-light)", border: "1px solid var(--primary-light-strong)",
                  borderRadius: 12, color: "var(--primary)", cursor: "pointer", fontSize: 13, fontWeight: 700
                }}
              >
                Enviar nova mensagem
              </button>
            </div>
          ) : (
            <div style={{
              background: "var(--card-bg)", border: "1px solid var(--border-color)",
              borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 16
            }}>
              {/* Type Selector */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setType("support")}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "12px", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 700,
                    background: type === "support" ? "var(--primary-light)" : "rgba(255,255,255,0.03)",
                    border: type === "support" ? "1px solid var(--primary-light-strong)" : "1px solid var(--border-color)",
                    color: type === "support" ? "var(--primary)" : "var(--text-sec)",
                    transition: "all 0.2s"
                  }}
                >
                  <MessageSquare size={15} /> Pedir Suporte
                </button>
                <button
                  type="button"
                  onClick={() => setType("report")}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "12px", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 700,
                    background: type === "report" ? "rgba(248,113,113,0.1)" : "rgba(255,255,255,0.03)",
                    border: type === "report" ? "1px solid rgba(248,113,113,0.25)" : "1px solid var(--border-color)",
                    color: type === "report" ? "#f87171" : "var(--text-sec)",
                    transition: "all 0.2s"
                  }}
                >
                  <Flag size={15} /> Fazer Denúncia
                </button>
              </div>

              {type === "report" && (
                <div style={{
                  padding: "10px 14px", background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10
                }}>
                  <p style={{ fontSize: 11, color: "#f87171", fontWeight: 600, margin: 0 }}>
                    🚨 Identifica claramente quem estás a denunciar e descreve o ocorrido.
                  </p>
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
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
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Mensagem
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Descreve o teu problema ou situação em detalhes..."
                  rows={5}
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
                  padding: "14px", borderRadius: 12, border: "none", cursor: "pointer",
                  background: type === "report"
                    ? "linear-gradient(135deg, #ef4444, #f87171)"
                    : "var(--gradient-primary)",
                  color: "#fff", fontSize: 13, fontWeight: 700,
                  opacity: (sending || !subject.trim() || !message.trim()) ? 0.5 : 1,
                  transition: "all 0.2s"
                }}
              >
                <Send size={14} />
                {sending ? "A enviar..." : type === "report" ? "Enviar Denúncia" : "Enviar Pedido de Suporte"}
              </button>
            </div>
          )}
        </div>

        {/* LADO DIREITO: Histórico de mensagens */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-main)", marginBottom: 16 }}>
            Histórico e Respostas
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {loadingTickets ? (
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>A carregar histórico...</p>
            ) : tickets.length === 0 ? (
              <div style={{
                background: "rgba(255,255,255,0.01)", border: "1px dashed var(--border-color)",
                borderRadius: 16, padding: "32px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13
              }}>
                Ainda não tens nenhuma mensagem ou denúncia enviada.
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(isSelected ? null : t)}
                    style={{
                      background: "var(--card-bg)",
                      border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border-color)",
                      borderRadius: 16, padding: 16, cursor: "pointer",
                      transition: "all 0.2s ease",
                      position: "relative"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                        color: t.type === "report" ? "#f87171" : "var(--primary)"
                      }}>
                        {t.type === "report" ? "Denúncia" : "Suporte"}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
                        background: t.status === "open"
                          ? "rgba(245,158,11,0.12)"
                          : t.status === "replied"
                          ? "rgba(16,185,129,0.12)"
                          : "rgba(156,163,175,0.12)",
                        color: t.status === "open" ? "#fbbf24" : t.status === "replied" ? "#10b981" : "#9ca3af"
                      }}>
                        {t.status === "open" ? "Pendente" : t.status === "replied" ? "Respondido" : "Resolvido"}
                      </span>
                    </div>

                    <h4 style={{ margin: "0 0 6px 0", fontSize: 14, fontWeight: 700, color: "var(--text-main)" }}>
                      {t.subject}
                    </h4>

                    <p style={{
                      margin: 0, fontSize: 12, color: "var(--text-sec)",
                      display: "-webkit-box", WebkitLineClamp: isSelected ? "none" : 2, WebkitBoxOrient: "vertical",
                      overflow: "hidden", lineHeight: 1.5
                    }}>
                      {t.message}
                    </p>

                    {/* Resposta do Admin */}
                    {isSelected && t.admin_reply && (
                      <div style={{
                        marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)",
                        background: "rgba(0,174,239,0.03)", borderRadius: 12, padding: 12
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--primary)", marginBottom: 8 }}>
                          <Shield size={14} />
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Resposta do Administrador
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: "var(--text-main)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {t.admin_reply}
                        </p>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                        {new Date(t.created_at).toLocaleDateString("pt-PT")}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--primary)", display: "flex", alignItems: "center", gap: 4 }}>
                        <Eye size={12} /> {isSelected ? "Recolher" : "Ver resposta"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
