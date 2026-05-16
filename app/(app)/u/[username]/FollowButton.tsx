"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function FollowButton({ 
  targetUserId, 
  currentUserId, 
  initialIsFollowing 
}: { 
  targetUserId: string; 
  currentUserId: string; 
  initialIsFollowing: boolean; 
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleFollowToggle() {
    if (loading) return;
    setLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetUserId);
          
        if (error) throw error;
        setIsFollowing(false);
      } else {
        // Follow
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: targetUserId });
          
        if (error) throw error;
        setIsFollowing(true);
        toast.success("A seguir!");
      }
    } catch (error: any) {
      toast.error("Erro ao tentar seguir/deixar de seguir.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleFollowToggle}
      disabled={loading}
      style={{
        padding: "0 24px", height: 44, borderRadius: 100, fontWeight: 700, fontSize: 14, cursor: "pointer",
        background: isFollowing ? "transparent" : "var(--text-main)",
        color: isFollowing ? "var(--text-main)" : "var(--bg-main)",
        border: isFollowing ? "1px solid var(--border-color)" : "none",
        transition: "all 0.2s ease",
        opacity: loading ? 0.7 : 1
      }}
      onMouseEnter={e => {
        if (isFollowing) {
          e.currentTarget.style.borderColor = "var(--danger)";
          e.currentTarget.style.color = "var(--danger)";
          e.currentTarget.innerText = "Deixar de seguir";
        }
      }}
      onMouseLeave={e => {
        if (isFollowing) {
          e.currentTarget.style.borderColor = "var(--border-color)";
          e.currentTarget.style.color = "var(--text-main)";
          e.currentTarget.innerText = "A seguir";
        }
      }}
    >
      {isFollowing ? "A seguir" : "Seguir"}
    </button>
  );
}
