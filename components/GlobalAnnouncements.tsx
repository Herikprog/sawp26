import { createClient } from "@/lib/supabase/server";
import { X } from "lucide-react";

const TYPE_CONFIG = {
  info:    { color: "#4a9eff", bg: "rgba(74,158,255,0.08)",  border: "rgba(74,158,255,0.2)",  icon: "ℹ️" },
  warning: { color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.2)",  icon: "⚠️" },
  success: { color: "#34d399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.2)",  icon: "✅" },
  danger:  { color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)", icon: "🚨" },
};

export default async function GlobalAnnouncements() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: announcements } = await supabase
    .from("global_announcements")
    .select("*")
    .eq("active", true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!announcements || announcements.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
      {announcements.map((ann: any) => {
        const cfg = TYPE_CONFIG[ann.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.info;
        return (
          <div
            key={ann.id}
            style={{
              display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 18px",
              background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 14,
              position: "relative"
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>{cfg.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: cfg.color, marginBottom: 2 }}>
                {ann.title}
              </p>
              <p style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.5 }}>
                {ann.body}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
