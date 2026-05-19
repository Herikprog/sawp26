import { createAdminClient } from "@/lib/supabase/server";
import { Users, Crown, TrendingUp, FileText, Bell, ShieldAlert } from "lucide-react";

async function getStats() {
  const supabase = await createAdminClient();
  if (!supabase) {
    return { totalUsers: 0, premiumUsers: 0, openTickets: 0, bannedUsers: 0, recentUsers: [], dailySignups: null };
  }

  const safeQuery = async (queryPromise: any) => {
    try {
      const res = await queryPromise;
      return res || { count: 0, data: null };
    } catch (err) {
      console.error("Admin stats query connection error:", err);
      return { count: 0, data: null };
    }
  };

  const results = await Promise.all([
    safeQuery(supabase.from("profiles").select("*", { count: "exact", head: true })),
    safeQuery(supabase.from("profiles").select("*", { count: "exact", head: true }).eq("plano", "premium")),
    safeQuery(supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open")),
    safeQuery(supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_banned", true)),
    safeQuery(supabase.from("profiles").select("id, nome, plano, created_at, cidade").order("created_at", { ascending: false }).limit(10)),
  ]);

  const totalUsers = results[0]?.count ?? 0;
  const premiumUsers = results[1]?.count ?? 0;
  const openTickets = results[2]?.count ?? 0;
  const bannedUsers = results[3]?.count ?? 0;
  const recentUsers = results[4]?.data ?? [];

  // Registos por dia nos últimos 14 dias
  let dailySignups = null;
  try {
    const { data } = await supabase.rpc("get_daily_signups");
    dailySignups = data;
  } catch (err) {
    // Silently ignore if RPC is not defined
  }

  return { totalUsers, premiumUsers, openTickets, bannedUsers, recentUsers, dailySignups };
}

export default async function AdminDashboard() {
  const { totalUsers, premiumUsers, openTickets, bannedUsers, recentUsers } = await getStats();

  const cards = [
    { label: "Total de Contas", value: (totalUsers ?? 0).toLocaleString(), icon: Users, color: "#4a9eff", bg: "rgba(74,158,255,0.1)" },
    { label: "Assinantes Premium", value: (premiumUsers ?? 0).toLocaleString(), icon: Crown, color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
    { label: "Faturamento Estimado", value: ((premiumUsers ?? 0) * 4.99).toLocaleString("pt-PT", { style: "currency", currency: "EUR" }), icon: TrendingUp, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
    { label: "Tickets Abertos", value: (openTickets ?? 0).toLocaleString(), icon: FileText, color: "#34d399", bg: "rgba(52,211,153,0.1)" },
    { label: "Contas Banidas", value: (bannedUsers ?? 0).toLocaleString(), icon: ShieldAlert, color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  ];

  const conversionRate = totalUsers && premiumUsers
    ? ((premiumUsers / totalUsers) * 100).toFixed(1)
    : "0.0";

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#4a9eff", marginBottom: 6 }}>
          Painel Administrativo
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
          Visão geral da plataforma Swap26 em tempo real.
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        {cards.map((card) => (
          <div key={card.label} style={{
            background: "#0d1117", border: "1px solid #1e2736",
            borderRadius: 16, padding: 24,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: 11, color: "#666", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                  {card.label}
                </p>
                <p style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>{card.value.toLocaleString()}</p>
              </div>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: card.bg, display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <card.icon size={20} style={{ color: card.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Taxa de Conversão */}
      <div style={{
        background: "#0d1117", border: "1px solid #1e2736", borderRadius: 16, padding: 24, marginBottom: 32,
        display: "flex", alignItems: "center", gap: 20
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, background: "rgba(74,158,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <TrendingUp size={24} style={{ color: "#4a9eff" }} />
        </div>
        <div>
          <p style={{ fontSize: 12, color: "#666", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Taxa de Conversão Free → Premium
          </p>
          <p style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>{conversionRate}%</p>
          <p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
            {premiumUsers} assinantes de {totalUsers} contas totais
          </p>
        </div>
      </div>

      {/* Utilizadores Recentes */}
      <div style={{ background: "#0d1117", border: "1px solid #1e2736", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #1e2736", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Registos Recentes</h2>
          <a href="/admin/users" style={{ fontSize: 12, color: "#4a9eff", textDecoration: "none", fontWeight: 600 }}>
            Ver todos →
          </a>
        </div>
        <div>
          {recentUsers?.map((user: any, i: number) => (
            <div key={user.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 24px",
              borderBottom: i < (recentUsers.length - 1) ? "1px solid #1a2332" : "none"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "linear-gradient(135deg, #4a9eff, #7b68ee)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0
                }}>
                  {user.nome?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{user.nome || "Sem nome"}</p>
                  <p style={{ fontSize: 11, color: "#555" }}>{user.cidade || "Sem cidade"}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                  background: user.plano === "premium" ? "rgba(251,191,36,0.15)" : "rgba(100,116,139,0.15)",
                  color: user.plano === "premium" ? "#fbbf24" : "#64748b",
                  textTransform: "uppercase", letterSpacing: "0.08em"
                }}>
                  {user.plano}
                </span>
                <span style={{ fontSize: 11, color: "#555" }}>
                  {user.created_at ? new Date(user.created_at).toLocaleDateString("pt-PT") : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
