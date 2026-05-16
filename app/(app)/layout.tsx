import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

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
      display: "flex", minHeight: "100vh", background: "var(--bg-main)",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Sidebar — desktop only */}
      <Sidebar profile={profile} email={user.email} />

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, position: "relative" }}>
        <div style={{
          width: "100%", height: "100%",
          overflowY: "auto", overflowX: "hidden",
          // Add bottom padding on mobile so content doesn't hide behind nav
          paddingBottom: "env(safe-area-inset-bottom)",
        }}>
          {/* Mobile bottom padding spacer */}
          <div className="md:hidden" style={{ paddingBottom: 0 }} />
          {children}
          {/* Mobile spacer to prevent content under nav */}
          <div className="md:hidden" style={{ height: 80 }} />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
