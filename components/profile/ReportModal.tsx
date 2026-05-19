"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X, AlertTriangle, Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedId: string;
  reportedName: string;
}

const REPORT_REASONS = [
  { value: "comportamento_inadequado", label: "Comportamento Inadequado / Ofensivo" },
  { value: "tentativa_fraude", label: "Tentativa de Fraude / Golpe de Trocas" },
  { value: "spam_mensagens", label: "Spam ou Mensagens Inconvenientes" },
  { value: "dados_falsos", label: "Figurinhas Falsas / Mentiras no Catálogo" },
  { value: "outro", label: "Outro Motivo (Especificar abaixo)" }
];

export default function ReportModal({ isOpen, onClose, reportedId, reportedName }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      toast.error("Por favor, selecione um motivo para a denúncia.");
      return;
    }
    if (details.trim().length < 10) {
      toast.error("Por favor, forneça mais detalhes sobre o ocorrido (mínimo 10 caracteres).");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Precisa de estar autenticado para efetuar uma denúncia.");
        return;
      }

      const { error } = await supabase
        .from("user_reports")
        .insert({
          reporter_id: user.id,
          reported_id: reportedId,
          reason: reason,
          details: details.trim()
        });

      if (error) throw error;

      toast.success("Denúncia enviada com sucesso! A equipa de moderação analisará o caso.");
      setReason("");
      setDetails("");
      onClose();
    } catch (err: any) {
      console.error("Erro ao reportar utilizador:", err);
      toast.error(`Falha ao submeter denúncia: ${err.message || "Erro desconhecido"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999999,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16
        }}>
          {/* Backdrop Desfocado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(3, 7, 18, 0.8)",
              backdropFilter: "blur(12px)",
            }}
          />

          {/* Janela de Diálogo */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            style={{
              position: "relative", width: "100%", maxWidth: 480,
              background: "rgba(10, 25, 47, 0.95)",
              border: "1px solid rgba(255, 77, 106, 0.25)",
              borderRadius: 28,
              boxShadow: "0 25px 50px -12px rgba(255, 77, 106, 0.15)",
              padding: "28px 24px",
              zIndex: 10,
              overflow: "hidden"
            }}
          >
            {/* Efeito Glow Lindo no Fundo */}
            <div style={{
              position: "absolute", top: -100, right: -100, width: 200, height: 200,
              background: "radial-gradient(circle, rgba(255,77,106,0.15) 0%, transparent 70%)",
              pointerEvents: "none"
            }} />

            {/* Cabeçalho */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: "rgba(255, 77, 106, 0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--danger)"
                }}>
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>
                    Denunciar Utilizador
                  </h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                    Alvo: <span style={{ color: "var(--text-main)", fontWeight: 600 }}>{reportedName}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "rgba(255,255,255,0.05)", border: "none", color: "var(--text-muted)",
                  width: 32, height: 32, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--text-main)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
              >
                <X size={16} />
              </button>
            </div>

            {/* Banner de Info Importante */}
            <div style={{
              background: "rgba(245, 158, 11, 0.05)",
              border: "1px solid rgba(245, 158, 11, 0.15)",
              borderRadius: 16, padding: "12px 14px",
              display: "flex", gap: 10, marginBottom: 24
            }}>
              <AlertTriangle size={16} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 11, color: "#f59e0b", lineHeight: 1.4 }}>
                Leve as denúncias a sério. Denúncias falsas sistemáticas ou com o intuito de prejudicar outros colecionadores violam as nossas diretrizes e podem resultar no banimento da sua conta.
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Categoria */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Motivo Principal
                </label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  style={{
                    background: "var(--input-bg)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 14, padding: "12px 16px",
                    color: "var(--text-main)", fontSize: 13,
                    outline: "none", cursor: "pointer",
                    width: "100%", transition: "border-color 0.2s"
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--danger)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--border-color)"}
                >
                  <option value="" disabled style={{ background: "#0a192f" }}>Selecione um motivo...</option>
                  {REPORT_REASONS.map(r => (
                    <option key={r.value} value={r.value} style={{ background: "#0a192f" }}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Descrição Detalhada */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Descrição da Ocorrência
                  </label>
                  <span style={{ fontSize: 11, color: details.length < 10 ? "var(--danger)" : "var(--text-muted)" }}>
                    {details.length}/500
                  </span>
                </div>
                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value.slice(0, 500))}
                  placeholder="Explique o que aconteceu com detalhes claros para ajudar a nossa equipa de moderação a agir rapidamente..."
                  rows={4}
                  style={{
                    background: "var(--input-bg)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 14, padding: "14px 16px",
                    color: "var(--text-main)", fontSize: 13,
                    outline: "none", resize: "none",
                    lineHeight: 1.5, transition: "border-color 0.2s"
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--danger)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--border-color)"}
                />
              </div>

              {/* Botões de Ação */}
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    flex: 1, padding: "14px", borderRadius: 16,
                    background: "rgba(255,255,255,0.05)", border: "none",
                    color: "var(--text-sec)", fontSize: 14, fontWeight: 600,
                    cursor: "pointer", transition: "background 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1, padding: "14px", borderRadius: 16,
                    background: "linear-gradient(135deg, #ff4d6a 0%, #cc0033 100%)",
                    border: "none", color: "#fff", fontSize: 14, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 6px 20px rgba(255, 77, 106, 0.25)",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => !loading && (e.currentTarget.style.transform = "translateY(-1px)")}
                  onMouseLeave={e => !loading && (e.currentTarget.style.transform = "translateY(0)")}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submeter
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
