"use client";

import { useState } from "react";
import { Search, Bell } from "lucide-react";
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
        position: "sticky", top: 0, zIndex: 10,
        background: "var(--bg-main)",
        marginBottom: 8,
        padding: "16px 0 12px", borderBottom: "1px solid var(--border-color)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16
    }}>
      <h1 style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 22, fontWeight: 800, color: "var(--text-main)", margin: 0,
        display: "none"
      }} className="sm:block">
        Comunidade
      </h1>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, justifyContent: "flex-end", position: "relative" }}>
        <form onSubmit={handleSearch} style={{ position: "relative", maxWidth: 240, width: "100%", margin: 0 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input 
            type="text" 
            placeholder="Procurar @username..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ 
              width: "100%", background: "var(--input-bg)", border: "1px solid var(--border-color)", 
              borderRadius: 100, padding: "8px 16px 8px 34px", fontSize: 13, outline: "none", color: "var(--text-main)",
              transition: "border-color 0.2s ease"
            }} 
          />
        </form>

        <button 
          onClick={() => setShowNotifications(v => !v)}
          style={{ position: "relative", color: "var(--text-main)", padding: 4, background: "transparent", border: "none", cursor: "pointer" }}
        >
          <Bell size={22} />
          {unreadCount > 0 && !showNotifications && (
            <span style={{ 
              position: "absolute", top: 0, right: 0, background: "var(--danger)", color: "white", 
              fontSize: 10, fontWeight: 800, width: 16, height: 16, borderRadius: "50%", 
              display: "flex", alignItems: "center", justifyContent: "center" 
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
