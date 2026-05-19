import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import RealtimeManager from "@/components/RealtimeManager";
import GlobalTradeManager from "@/components/trade/GlobalTradeManager";
import GlobalNotificationBell from "@/components/layout/GlobalNotificationBell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div style={{
      display: "flex", height: "100dvh", overflow: "hidden",
      background: "var(--bg-main)", color: "var(--text-main)",
      fontFamily: "'Inter', sans-serif"
    }}>
      <RealtimeManager />
      <GlobalTradeManager />
      {/* Global Notifications Bell (Desktop) */}
      <div className="hidden md:block">
        <GlobalNotificationBell />
      </div>
      {/* Sidebar — desktop only */}
      <Sidebar profile={profile} email={user.email} />

      {/* Main content */}
      <main style={{
        flex: 1, minWidth: 0, position: "relative",
        background: "var(--bg-main)",
      }}>
        {/* Subtle pattern overlay */}
        <div className="pattern-bg" style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        }} />

        <div style={{
          width: "100%", height: "100%",
          overflowY: "auto", overflowX: "hidden",
          position: "relative", zIndex: 1,
        }}>
          {/* Top spacer for mobile top-nav */}
          <div className="md:hidden" style={{ height: 64 }} />
          {children}
        </div>
      </main>
    </div>
  );
}
