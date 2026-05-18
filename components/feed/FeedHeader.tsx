"use client";

import { useState } from "react";
import { Search, Bell, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NotificationsPopup from "./NotificationsPopup";

export default function FeedHeader({ unreadCount }: { unreadCount: number }) {
  const [search, setSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/u/${search.trim().replace("@", "")}`);
    }
  }

  return (
    <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "var(--glass-bg)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        marginBottom: 24,
        padding: "16px 24px",
        borderRadius: "0 0 24px 24px",
        borderBottom: "1px solid var(--glass-border)",
        boxShadow: "var(--shadow-sm)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        margin: "0 -16px 24px -16px"
    }}>
      <div className="hidden sm:flex" style={{ alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: "rgba(255,107,157,0.1)", border: "1px solid rgba(255,107,157,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Users size={18} style={{ color: "#FF6B9D" }} />
        </div>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 24, fontWeight: 800, color: "var(--text-main)", margin: 0,
          letterSpacing: "-0.03em"
        }}>
          Comunidade
        </h1>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, justifyContent: "flex-end", position: "relative" }}>
        <form onSubmit={handleSearch} style={{ position: "relative", maxWidth: 280, width: "100%", margin: 0 }}>
          <Search size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input 
            type="text" 
            placeholder="Procurar @username..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ 
              width: "100%", background: "var(--input-bg)", border: "1px solid var(--border-color)", 
              borderRadius: 14, padding: "10px 16px 10px 42px", fontSize: 13, outline: "none", color: "var(--text-main)",
              transition: "all 0.25s ease"
            }} 
          />
        </form>

        <button 
          onClick={() => setShowNotifications(v => !v)}
          style={{ 
            position: "relative", color: "var(--text-main)", padding: 10, background: "var(--input-bg)", 
            border: "1px solid var(--border-color)", cursor: "pointer", borderRadius: 12,
            transition: "all 0.2s ease", display: "flex", alignItems: "center", justifyContent: "center"
          }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover-strong)"}
          onMouseLeave={e => e.currentTarget.style.background = "var(--input-bg)"}
        >
          <Bell size={18} />
          {unreadCount > 0 && !showNotifications && (
            <span style={{ 
              position: "absolute", top: -4, right: -4, background: "var(--danger)", color: "white", 
              fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: "50%", 
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(255,77,106,0.4)", border: "2px solid var(--card-bg)"
            }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <NotificationsPopup onClose={() => setShowNotifications(false)} />
        )}
      </div>
    </header>
  );
}
