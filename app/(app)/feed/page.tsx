import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FeedInput from "@/components/feed/FeedInput";
import FeedList from "@/components/feed/FeedList";
import FeedHeader from "@/components/feed/FeedHeader";
import type { Post } from "@/types";

export const revalidate = 0;

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: posts, error: postsErr } = await supabase
    .from("posts")
    .select("*, user:profiles!posts_user_id_fkey(*)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (postsErr) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "100px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h1 style={{ color: "var(--danger, #ef4444)", marginBottom: 12, fontSize: 22 }}>
          Erro de Base de Dados
        </h1>
        <p style={{ color: "var(--text-sec)", marginBottom: 20, lineHeight: 1.6 }}>
          {postsErr.message}
        </p>
        <code style={{
          background: "var(--input-bg)", padding: "14px 20px", borderRadius: 12,
          display: "block", color: "var(--warning, #f59e0b)", fontSize: 13, lineHeight: 1.7,
          textAlign: "left"
        }}>
          {postsErr.hint || "Verifique se a tabela 'posts' foi criada corretamente no painel do Supabase."}
        </code>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px 100px" }}>
      <FeedHeader />

      {/* Input */}
      <div style={{ borderBottom: "1px solid var(--border-color)", marginBottom: 8 }}>
        <FeedInput userProfile={profile} />
      </div>

      {/* Feed */}
      <FeedList
        initialPosts={(posts || []) as Post[]}
        currentUserId={user.id}
        currentUserProfile={profile}
      />
    </div>
  );
}
