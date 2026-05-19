import { redirect, notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  let user = null;
  try {
    const res = await supabase.auth.getUser();
    user = res.data?.user;
  } catch (err) {
    console.error("Supabase getUser error in AdminLayout:", err);
  }

  if (!user) redirect("/login");

  let profile = null;
  try {
    const res = await supabase
      .from("profiles")
      .select("is_admin, nome")
      .eq("id", user.id)
      .single();
    profile = res.data;
  } catch (err) {
    // Ignore error
  }

  const isEmailAdmin = user?.email?.toLowerCase() === "bragawork01@gmail.com";

  if (!isEmailAdmin && !profile?.is_admin) {
    notFound();
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080b14", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      {/* Admin Sidebar */}
      <aside style={{
        width: 240, background: "#0d1117", borderRight: "1px solid #1e2736",
        display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0
      }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #1e2736" }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#4a9eff", marginBottom: 4 }}>
            Admin Panel
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Swap26</div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{profile?.nome || user.email}</div>
        </div>

        <nav style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { href: "/admin", label: "Dashboard", icon: "📊" },
            { href: "/admin/users", label: "Utilizadores", icon: "👥" },
            { href: "/admin/announcements", label: "Avisos Globais", icon: "📢" },
            { href: "/admin/tickets", label: "Suporte", icon: "🎫" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="admin-nav-link"
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10,
                color: "#a0aec0", textDecoration: "none", fontSize: 13, fontWeight: 500,
                transition: "all 0.2s",
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "1px solid #1e2736" }}>
          <a href="/" style={{ fontSize: 12, color: "#666", textDecoration: "none" }}>
            ← Voltar à App
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: "auto", padding: 32 }}>
        {children}
      </main>
      <style>{`
        .admin-nav-link:hover {
          background: #1a2332 !important;
          color: #fff !important;
        }
      `}</style>
    </div>
  );
}
