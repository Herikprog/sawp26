"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Ban, Clock, Check, Search, Calendar, User } from "lucide-react";

interface BanLog {
  id: string;
  action: string;
  target_user_name: string;
  reason: string;
  created_at: string;
  admin: { nome: string } | null;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<BanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/logs");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Erro ao carregar logs:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.target_user_name.toLowerCase().includes(search.toLowerCase()) ||
    l.reason.toLowerCase().includes(search.toLowerCase()) ||
    (l.admin?.nome || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#f87171", marginBottom: 6 }}>
          Auditoria
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
          Logs de Ban & Suspensão
        </h1>
        <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
          Histórico completo de todas as ações disciplinares aplicadas pelos administradores.
        </p>
      </div>

      {/* Search Input */}
      <div style={{
        position: "relative", marginBottom: 24, maxWidth: 400,
        background: "#0d1117", border: "1px solid #1e2736", borderRadius: 12,
        display: "flex", alignItems: "center", padding: "0 14px"
      }}>
        <Search size={18} style={{ color: "#444", marginRight: 10 }} />
        <input
          type="text"
          placeholder="Pesquisar por utilizador, motivo ou admin..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, padding: "12px 0", background: "none", border: "none",
            color: "#fff", outline: "none", fontSize: 13
          }}
        />
      </div>

      {/* Logs Table */}
      <div style={{ background: "#0d1117", border: "1px solid #1e2736", borderRadius: 16, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#555" }}>A carregar logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#555" }}>
            <ShieldAlert size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p>Nenhum registo encontrado.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid #1e2736" }}>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase" }}>Utilizador</th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase" }}>Ação</th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase" }}>Motivo da Decisão</th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase" }}>Executado Por</th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase" }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const isBan = log.action.includes("Banimento");
                  const isSuspend = log.action.includes("Suspensão");
                  
                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid #141b24", transition: "background 0.2s" }} className="table-row-hover">
                      {/* Target User */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: isBan ? "rgba(239,68,68,0.1)" : isSuspend ? "rgba(251,146,60,0.1)" : "rgba(52,211,153,0.1)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 700,
                            color: isBan ? "#f87171" : isSuspend ? "#fb923c" : "#34d399"
                          }}>
                            {log.target_user_name.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{log.target_user_name}</span>
                        </div>
                      </td>

                      {/* Action Badges */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
                          background: isBan ? "rgba(239,68,68,0.08)" : isSuspend ? "rgba(251,146,60,0.08)" : "rgba(52,211,153,0.08)",
                          color: isBan ? "#ef4444" : isSuspend ? "#fb923c" : "#10b981",
                          border: `1px solid ${isBan ? "rgba(239,68,68,0.15)" : isSuspend ? "rgba(251,146,60,0.15)" : "rgba(52,211,153,0.15)"}`
                        }}>
                          {isBan ? <Ban size={12} /> : isSuspend ? <Clock size={12} /> : <Check size={12} />}
                          {log.action}
                        </div>
                      </td>

                      {/* Reason */}
                      <td style={{ padding: "16px 20px", maxWidth: 300 }}>
                        <p style={{ fontSize: 13, color: "#e2e8f0", margin: 0, lineHeight: 1.4, wordBreak: "break-word" }}>
                          {log.reason}
                        </p>
                      </td>

                      {/* Admin */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#a0aec0", fontSize: 13 }}>
                          <User size={14} style={{ opacity: 0.5 }} />
                          <span>{log.admin?.nome || "Admin Principal"}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 12 }}>
                          <Calendar size={12} />
                          <span>{new Date(log.created_at).toLocaleString("pt-PT")}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .table-row-hover:hover {
          background: rgba(255,255,255,0.01) !important;
        }
      `}</style>
    </div>
  );
}
