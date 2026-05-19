import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Clock } from "lucide-react";
import Image from "next/image";

export default async function ChatListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: conversations } = await supabase
    .from("conversations")
    .select(`
      id,
      last_msg_at,
      created_at,
      user_a:profiles!user_a_id (id, nome, avatar_url, is_online),
      user_b:profiles!user_b_id (id, nome, avatar_url, is_online)
    `)
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order("last_msg_at", { ascending: false, nullsFirst: false });

  // Fetch unread counts — filtrado pelas conversas do utilizador (evita vazamento de dados)
  const conversationIds = conversations?.map(c => c.id) ?? [];
  const { data: unreadMessages } = conversationIds.length > 0
    ? await supabase
        .from("messages")
        .select("conversation_id")
        .eq("read", false)
        .not("sender_id", "eq", user.id)
        .in("conversation_id", conversationIds)
    : { data: [] };

  const unreadCounts: Record<string, number> = {};
  unreadMessages?.forEach(m => {
    unreadCounts[m.conversation_id] = (unreadCounts[m.conversation_id] || 0) + 1;
  });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p style={{
          fontSize: 11, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 12,
        }}>Mensagens</p>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 32,
          fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.03em",
        }}>
          As Tuas Conversas
        </h1>
      </div>

      {/* Conversation List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(!conversations || conversations.length === 0) ? (
          <div style={{
            textAlign: "center", padding: "80px 24px",
            background: "var(--card-bg)", borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <MessageCircle size={40} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-main)", marginBottom: 8 }}>
              Sem conversas ainda
            </p>
            <p style={{ color: "var(--text-sec)", fontSize: 14 }}>
              Encontra parceiros de troca e inicia uma conversa!
            </p>
          </div>
        ) : (
          conversations.map((conv: any) => {
            const other = conv.user_a.id === user.id ? conv.user_b : conv.user_a;
            const timeAgo = new Date(conv.last_msg_at || conv.created_at).toLocaleDateString("pt-PT", {
              day: "numeric", month: "short",
            });

            return (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "20px 24px", borderRadius: 20,
                  background: "var(--card-bg)", border: "1px solid rgba(255,255,255,0.08)",
                  textDecoration: "none", color: "inherit",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Avatar */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {other.avatar_url ? (
                    <Image
                      src={other.avatar_url} alt={other.nome}
                      width={48} height={48}
                      style={{ borderRadius: 16, objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{
                      width: 48, height: 48, borderRadius: 16,
                      background: "var(--input-bg)", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontSize: 18, fontWeight: 700, color: "var(--primary)",
                    }}>
                      {other.nome[0]}
                    </div>
                  )}
                  {other.is_online && (
                    <div style={{
                      position: "absolute", bottom: -2, right: -2,
                      width: 14, height: 14, borderRadius: "50%",
                      background: "var(--success)",
                      border: "3px solid var(--card-bg)",
                    }} />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-main)" }}>
                    {other.nome}
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    Toca para continuar a conversa
                  </p>
                </div>

                {/* Time & Badge */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={14} style={{ color: "var(--text-muted)" }} />
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{timeAgo}</span>
                  </div>
                  {unreadCounts[conv.id] > 0 && (
                    <div style={{
                      background: "var(--danger)", color: "#fff",
                      fontSize: 11, fontWeight: 800, padding: "2px 8px",
                      borderRadius: 10, boxShadow: "0 2px 8px rgba(255,77,106,0.4)"
                    }}>
                      {unreadCounts[conv.id]}
                    </div>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
