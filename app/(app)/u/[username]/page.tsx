import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { MapPin, User, Star, MessageSquare } from "lucide-react";
import FeedList from "@/components/feed/FeedList";
import FollowButton from "@/components/profile/FollowButton";

export const revalidate = 0;

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // Find user by username
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", params.username)
    .single();

  if (!profile) return notFound();

  // Redirect to my profile editor if it's me
  if (currentUser && currentUser.id === profile.id) {
    redirect("/profile");
  }

  // Get user's posts
  const { data: posts } = await supabase
    .from("posts")
    .select("*, user:profiles!posts_user_id_fkey(*)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Check follow status
  let isFollowing = false;
  let followersCount = 0;
  let followingCount = 0;

  if (currentUser) {
    const { data: follow } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", currentUser.id)
      .eq("following_id", profile.id)
      .single();
    isFollowing = !!follow;
  }

  const { count: fwCount } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id);
  const { count: fgCount } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id);
  followersCount = fwCount || 0;
  followingCount = fgCount || 0;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 0 100px 0" }}>
      {/* Cover Image Placeholder */}
      <div style={{ height: 160, background: "linear-gradient(135deg, var(--primary), var(--primary-light-strong))" }} />

      <div style={{ padding: "0 24px" }}>
        {/* Avatar & Actions Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: -40, marginBottom: 16 }}>
          <div style={{
            width: 96, height: 96, borderRadius: "50%", background: "var(--card-bg)",
            padding: 4, display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "var(--input-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile.nome} width={88} height={88} style={{ objectFit: "cover" }} />
              ) : (
                <User size={40} style={{ color: "var(--text-muted)" }} />
              )}
            </div>
          </div>
          
          <div style={{ display: "flex", gap: 12 }}>
            <button style={{
              width: 44, height: 44, borderRadius: "50%", border: "1px solid var(--border-color)",
              background: "var(--card-bg)", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--text-main)"
            }}>
              <MessageSquare size={20} />
            </button>
            {currentUser && (
              <FollowButton 
                targetUserId={profile.id} 
                currentUserId={currentUser.id} 
                initialIsFollowing={isFollowing} 
              />
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 800, color: "var(--text-main)", marginBottom: 2 }}>
            {profile.nome}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 12 }}>
            @{profile.username}
          </p>
          
          {profile.descricao && (
            <p style={{ color: "var(--text-sec)", fontSize: 15, lineHeight: 1.5, marginBottom: 16, whiteSpace: "pre-wrap" }}>
              {profile.descricao}
            </p>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            {profile.cidade && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={16} />
                <span>{profile.cidade}{profile.bairro ? `, ${profile.bairro}` : ""}</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--warning)" }}>
              <Star size={16} fill="var(--warning)" />
              <span style={{ fontWeight: 700 }}>{profile.reputacao.toFixed(1)} Reputação</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, fontSize: 14 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{followingCount}</span>
              <span style={{ color: "var(--text-muted)" }}>A seguir</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{followersCount}</span>
              <span style={{ color: "var(--text-muted)" }}>Seguidores</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: "var(--border-color)", margin: "0 0 16px 0" }} />

      <h3 style={{ padding: "0 24px", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Publicações</h3>

      {posts && posts.length > 0 ? (
        <FeedList 
          initialPosts={posts as any} 
          currentUserId={currentUser?.id || ""} 
          currentUserProfile={null} 
        />
      ) : (
        <div style={{ textAlign: "center", padding: "40px 24px" }}>
          <p style={{ color: "var(--text-muted)" }}>Este utilizador ainda não publicou nada.</p>
        </div>
      )}
    </div>
  );
}
