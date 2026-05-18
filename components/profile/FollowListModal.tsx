"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  userId: string;
  type: "followers" | "following";
  onClose: () => void;
}

export default function FollowListModal({ userId, type, onClose }: Props) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      if (type === "followers") {
        const { data } = await supabase
          .from("follows")
          .select("follower:profiles!follows_follower_id_fkey(id, nome, username, avatar_url)")
          .eq("following_id", userId);
        setUsers(data?.map(d => d.follower) || []);
      } else {
        const { data } = await supabase
          .from("follows")
          .select("following:profiles!follows_following_id_fkey(id, nome, username, avatar_url)")
          .eq("follower_id", userId);
        setUsers(data?.map(d => d.following) || []);
      }
      setLoading(false);
    }
    load();
  }, [userId, type, supabase]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)"
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          width: "100%", maxWidth: 400, background: "var(--card-bg)", borderRadius: 24,
          border: "1px solid var(--border-color)", overflow: "hidden", display: "flex", flexDirection: "column",
          maxHeight: "80vh"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border-color)" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{type === "followers" ? "Seguidores" : "A seguir"}</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex" }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: "12px", overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>A carregar...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Ninguém encontrado.</div>
          ) : (
            users.map(u => (
              <Link key={u.id} href={`/profile/${u.id}`} onClick={onClose} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "12px", textDecoration: "none", color: "inherit",
                borderRadius: 16, transition: "background 0.2s"
              }} className="hover:bg-[var(--bg-hover)]">
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--input-bg)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {u.avatar_url ? (
                    <Image src={u.avatar_url} alt="" width={44} height={44} style={{ objectFit: "cover" }} />
                  ) : (
                    <User size={20} style={{ color: "var(--text-muted)" }} />
                  )}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{u.nome}</p>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>@{u.username || "user"}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
