"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X, Bell } from "lucide-react";
import toast from "react-hot-toast";

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: "info" | "warning" | "success" | "danger";
  active: boolean;
  created_at: string;
  expires_at: string | null;
}

const TYPE_CONFIG = {
  info:    { color: "#4a9eff", bg: "rgba(74,158,255,0.1)",   label: "Informação" },
  warning: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   label: "Aviso" },
  success: { color: "#34d399", bg: "rgba(52,211,153,0.1)",   label: "Sucesso" },
  danger:  { color: "#f87171", bg: "rgba(248,113,113,0.1)",  label: "Urgente" },
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", type: "info", expires_at: "" });
  const [saving, setSaving] = useState(false);

  async function fetchAnnouncements() {
    setLoading(true);
    const res = await fetch("/api/admin/announcements");
    const data = await res.json();
    setAnnouncements(data.announcements || []);
    setLoading(false);
  }

  useEffect(() => { fetchAnnouncements(); }, []);

  async function handleCreate() {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Título e mensagem são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Aviso criado e publicado!");
      setShowForm(false);
      setForm({ title: "", body: "", type: "info", expires_at: "" });
      fetchAnnouncements();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Apagar este aviso?")) return;
    const res = await fetch("/api/admin/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      toast.success("Aviso removido.");
      fetchAnnouncements();
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch("/api/admin/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    });
    fetchAnnouncements();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#4a9eff", marginBottom: 6 }}>
            Comunicação
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Avisos Globais</h1>
          <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
            Mensagens exibidas no dashboard de todos os utilizadores.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
            background: "#4a9eff", border: "none", borderRadius: 12,
            color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700
          }}
        >
          <Plus size={16} /> Novo Aviso
        </button>
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#555" }}>A carregar...</div>
        ) : announcements.length === 0 ? (
          <div style={{
            background: "#0d1117", border: "1px solid #1e2736", borderRadius: 16,
            padding: 48, textAlign: "center", color: "#555"
          }}>
            <Bell size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p>Nenhum aviso criado ainda.</p>
          </div>
        ) : announcements.map((ann) => {
          const cfg = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info;
          return (
            <div key={ann.id} style={{
              background: "#0d1117", border: `1px solid #1e2736`,
              borderLeft: `3px solid ${cfg.color}`,
              borderRadius: 16, padding: 20,
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              opacity: ann.active ? 1 : 0.5
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
                    background: cfg.bg, color: cfg.color, textTransform: "uppercase"
                  }}>
                    {cfg.label}
                  </span>
                  <span style={{ fontSize: 10, color: "#555" }}>
                    {ann.active ? "✅ Ativo" : "⏸ Inativo"}
                  </span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{ann.title}</p>
                <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>{ann.body}</p>
                <p style={{ fontSize: 11, color: "#555", marginTop: 8 }}>
                  Criado em {new Date(ann.created_at).toLocaleString("pt-PT")}
                  {ann.expires_at && ` · Expira em ${new Date(ann.expires_at).toLocaleDateString("pt-PT")}`}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
                <button
                  onClick={() => toggleActive(ann.id, ann.active)}
                  style={{
                    padding: "6px 12px", background: ann.active ? "rgba(100,116,139,0.15)" : "rgba(52,211,153,0.1)",
                    border: "none", borderRadius: 8, color: ann.active ? "#64748b" : "#34d399",
                    cursor: "pointer", fontSize: 12, fontWeight: 600
                  }}
                >
                  {ann.active ? "Desativar" : "Ativar"}
                </button>
                <button
                  onClick={() => handleDelete(ann.id)}
                  style={{
                    padding: "6px 10px", background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8,
                    color: "#ef4444", cursor: "pointer"
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div style={{
            background: "#0d1117", border: "1px solid #1e2736", borderRadius: 20,
            padding: 28, width: "100%", maxWidth: 480, position: "relative"
          }}>
            <button onClick={() => setShowForm(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#555", cursor: "pointer" }}>
              <X size={18} />
            </button>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 20 }}>Criar Novo Aviso</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                placeholder="Título do aviso"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={{ padding: "11px 14px", background: "#0a0f1a", border: "1px solid #1e2736", borderRadius: 10, color: "#fff", fontSize: 13, outline: "none" }}
              />
              <textarea
                placeholder="Mensagem detalhada..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={4}
                style={{ padding: "11px 14px", background: "#0a0f1a", border: "1px solid #1e2736", borderRadius: 10, color: "#fff", fontSize: 13, outline: "none", resize: "vertical" }}
              />
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={{ padding: "11px 14px", background: "#0a0f1a", border: "1px solid #1e2736", borderRadius: 10, color: "#fff", fontSize: 13, outline: "none" }}
              >
                <option value="info">Informação</option>
                <option value="warning">Aviso</option>
                <option value="success">Sucesso / Novidade</option>
                <option value="danger">Urgente / Problema</option>
              </select>
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                placeholder="Data de expiração (opcional)"
                style={{ padding: "11px 14px", background: "#0a0f1a", border: "1px solid #1e2736", borderRadius: 10, color: form.expires_at ? "#fff" : "#555", fontSize: 13, outline: "none" }}
              />
              <button
                onClick={handleCreate}
                disabled={saving}
                style={{
                  padding: "13px", background: "#4a9eff", border: "none", borderRadius: 12,
                  color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700,
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? "A publicar..." : "📢 Publicar Aviso"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
