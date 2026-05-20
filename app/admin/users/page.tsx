"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Ban, Clock, Crown, Shield, Trash2, ChevronDown, X, Users } from "lucide-react";
import toast from "react-hot-toast";

interface User {
  id: string;
  nome: string;
  cidade: string;
  plano: string;
  is_admin: boolean;
  is_banned: boolean;
  suspended_until: string | null;
  total_trocas: number;
  created_at: string;
  email?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [suspendDays, setSuspendDays] = useState(7);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  async function doAction(action: string, userId: string, extra?: any) {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || "Ação concluída!");
      fetchUsers();
      setSelectedUser(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao executar ação.");
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm("Apagar esta conta permanentemente? Esta ação é irreversível!")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Conta apagada com sucesso.");
      fetchUsers();
      setSelectedUser(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao apagar conta.");
    } finally {
      setActionLoading(false);
    }
  }

  async function impersonateUser(userId: string) {
    if (!confirm("Deseja mesmo entrar na conta deste utilizador? A sua sessão administrativa atual será substituída pela dele.")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "impersonate", userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Redirecionando...");
      if (data.action_link) {
        window.location.href = data.action_link;
      } else {
        throw new Error("Link não gerado pela API.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao tentar entrar na conta do utilizador.");
    } finally {
      setActionLoading(false);
    }
  }

  const filteredUsers = users;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#4a9eff", marginBottom: 6 }}>
          Gestão
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
          Utilizadores
        </h1>
        <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
          {users.length} contas registadas na plataforma.
        </p>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 24, maxWidth: 400 }}>
        <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome ou cidade..."
          style={{
            width: "100%", padding: "10px 14px 10px 40px",
            background: "#0d1117", border: "1px solid #1e2736",
            borderRadius: 12, color: "#fff", fontSize: 13,
            outline: "none", boxSizing: "border-box"
          }}
        />
      </div>

      {/* Table */}
      <div style={{ background: "#0d1117", border: "1px solid #1e2736", borderRadius: 16, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1e2736" }}>
              {["Utilizador", "Cidade", "Plano", "Estado", "Registado", "Ações"].map((h) => (
                <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#555" }}>A carregar...</td></tr>
            ) : filteredUsers.map((user, i) => (
              <tr key={user.id} style={{ borderBottom: i < filteredUsers.length - 1 ? "1px solid #111a27" : "none" }}>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: "linear-gradient(135deg, #4a9eff, #7b68ee)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0
                    }}>
                      {user.nome?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{user.nome || "Sem nome"}</p>
                      {user.is_admin && <span style={{ fontSize: 9, color: "#fbbf24", fontWeight: 700 }}>ADMIN</span>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 13, color: "#666" }}>{user.cidade || "—"}</td>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                    background: user.plano === "premium" ? "rgba(251,191,36,0.15)" : "rgba(100,116,139,0.15)",
                    color: user.plano === "premium" ? "#fbbf24" : "#64748b",
                    textTransform: "uppercase"
                  }}>
                    {user.plano}
                  </span>
                </td>
                <td style={{ padding: "14px 20px" }}>
                  {(() => {
                    const isSuspended = user.suspended_until && new Date(user.suspended_until) > new Date();
                    if (user.is_banned) {
                      return (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "rgba(248,113,113,0.15)", color: "#f87171", textTransform: "uppercase" }}>
                          Banido
                        </span>
                      );
                    }
                    if (isSuspended) {
                      return (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "rgba(251,146,60,0.15)", color: "#fb923c", textTransform: "uppercase" }}>
                          Suspenso
                        </span>
                      );
                    }
                    return (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "rgba(52,211,153,0.1)", color: "#34d399", textTransform: "uppercase" }}>
                        Ativo
                      </span>
                    );
                  })()}
                </td>
                <td style={{ padding: "14px 20px", fontSize: 12, color: "#555" }}>
                  {new Date(user.created_at).toLocaleDateString("pt-PT")}
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <button
                    onClick={() => setSelectedUser(user)}
                    style={{
                      padding: "6px 14px", background: "#1a2332", border: "1px solid #2a3a50",
                      borderRadius: 8, color: "#a0aec0", cursor: "pointer", fontSize: 12, fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 6
                    }}
                  >
                    Gerir <ChevronDown size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Modal */}
      {selectedUser && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div style={{
            background: "#0d1117", border: "1px solid #1e2736", borderRadius: 20,
            padding: 28, width: "100%", maxWidth: 420, position: "relative"
          }}>
            <button onClick={() => setSelectedUser(null)} style={{
              position: "absolute", top: 16, right: 16, background: "none", border: "none",
              color: "#555", cursor: "pointer"
            }}>
              <X size={18} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "linear-gradient(135deg, #4a9eff, #7b68ee)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 700, color: "#fff"
              }}>
                {selectedUser.nome?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{selectedUser.nome}</p>
                <p style={{ fontSize: 12, color: "#555" }}>{selectedUser.plano} · {selectedUser.cidade || "Sem cidade"}</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Impersonate */}
              <button onClick={() => impersonateUser(selectedUser.id)} disabled={actionLoading}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 12, color: "#a78bfa", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                <Users size={16} /> Entrar na Conta
              </button>

              {/* Premium */}
              <button 
                onClick={() => doAction(selectedUser.plano === "premium" ? "set_free" : "set_premium", selectedUser.id)} 
                disabled={actionLoading}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 10, 
                  padding: "12px 16px", 
                  background: selectedUser.plano === "premium" ? "rgba(100,116,139,0.08)" : "rgba(251,191,36,0.08)", 
                  border: selectedUser.plano === "premium" ? "1px solid rgba(100,116,139,0.2)" : "1px solid rgba(251,191,36,0.2)", 
                  borderRadius: 12, 
                  color: selectedUser.plano === "premium" ? "#94a3b8" : "#fbbf24", 
                  cursor: "pointer", 
                  fontSize: 13, 
                  fontWeight: 600 
                }}
              >
                <Crown size={16} /> {selectedUser.plano === "premium" ? "Remover Premium" : "Conceder Premium"}
              </button>

              {/* Admin */}
              <button onClick={() => doAction("set_admin", selectedUser.id)} disabled={actionLoading}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.2)", borderRadius: 12, color: "#4a9eff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                <Shield size={16} /> Tornar Administrador
              </button>

              {/* Suspend */}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  value={suspendDays}
                  onChange={(e) => setSuspendDays(Number(e.target.value))}
                  min={1}
                  style={{ width: 70, padding: "10px 12px", background: "#0a0f1a", border: "1px solid #1e2736", borderRadius: 10, color: "#fff", fontSize: 13, textAlign: "center", outline: "none" }}
                />
                <button onClick={() => doAction("suspend", selectedUser.id, { days: suspendDays })} disabled={actionLoading}
                  style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)", borderRadius: 12, color: "#fb923c", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  <Clock size={16} /> Suspender (dias)
                </button>
              </div>

              {/* Remover Suspensão (se suspenso) */}
              {selectedUser.suspended_until && new Date(selectedUser.suspended_until) > new Date() && (
                <button onClick={() => doAction("unban", selectedUser.id)} disabled={actionLoading}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 12, color: "#34d399", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  <Clock size={16} /> Remover Suspensão
                </button>
              )}

              {/* Ban */}
              <button onClick={() => doAction(selectedUser.is_banned ? "unban" : "ban", selectedUser.id)} disabled={actionLoading}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 12, color: "#f87171", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                <Ban size={16} /> {selectedUser.is_banned ? "Remover Ban" : "Banir Permanentemente"}
              </button>

              {/* Delete */}
              <button onClick={() => deleteUser(selectedUser.id)} disabled={actionLoading}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 12, color: "#ef4444", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                <Trash2 size={16} /> Apagar Conta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
