"use client";

import { useState } from "react";
import FollowListModal from "./FollowListModal";

interface Props {
  userId: string;
  followersCount: number;
  followingCount: number;
}

export default function FollowStats({ userId, followersCount, followingCount }: Props) {
  const [modalType, setModalType] = useState<"followers" | "following" | null>(null);

  return (
    <>
      <div style={{ display: "flex", gap: 24, fontSize: 14, marginBottom: 24 }}>
        <div 
          onClick={() => setModalType("following")}
          style={{ display: "flex", gap: 6, cursor: "pointer", transition: "opacity 0.2s" }}
          className="hover:opacity-75"
        >
          <span style={{ fontWeight: 800, color: "var(--text-main)" }}>{followingCount}</span>
          <span style={{ color: "var(--text-muted)" }}>A seguir</span>
        </div>
        <div 
          onClick={() => setModalType("followers")}
          style={{ display: "flex", gap: 6, cursor: "pointer", transition: "opacity 0.2s" }}
          className="hover:opacity-75"
        >
          <span style={{ fontWeight: 800, color: "var(--text-main)" }}>{followersCount}</span>
          <span style={{ color: "var(--text-muted)" }}>Seguidores</span>
        </div>
      </div>

      {modalType && (
        <FollowListModal 
          userId={userId} 
          type={modalType} 
          onClose={() => setModalType(null)} 
        />
      )}
    </>
  );
}
