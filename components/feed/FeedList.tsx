"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Post } from "@/types";
import {
  Heart, MessageSquare, Repeat2, Share2,
  MoreHorizontal, Trash2, Flag, Bookmark
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import FeedInput from "./FeedInput";

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionBtn({
  icon, label, count, active, activeColor, onClick
}: {
  icon: React.ReactNode; label: string; count?: number;
  active?: boolean; activeColor?: string; onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color = active ? activeColor : hovered ? activeColor : "var(--text-muted)";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={label}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: 100,
        color, transition: "all 0.15s ease",
        background: hovered ? `${activeColor}18` : "transparent",
      } as any}
    >
      <span style={{ display: "flex", transform: active && label === "Gosto" ? "scale(1.2)" : "scale(1)", transition: "transform 0.2s" }}>
        {icon}
      </span>
      {count !== undefined && count > 0 && (
        <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>{count}</span>
      )}
    </button>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ user, size = 44 }: { user?: any; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", overflow: "hidden",
      background: "var(--input-bg)", flexShrink: 0, border: "2px solid var(--border-color)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--primary)", fontWeight: 800, fontSize: size * 0.38
    }}>
      {user?.avatar_url
        ? <Image src={user.avatar_url} alt={user.nome || "User"} width={size} height={size} style={{ objectFit: "cover", width: "100%", height: "auto" }} />
        : (user?.nome?.[0]?.toUpperCase() || "U")
      }
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({
  post, currentUserId, allPosts,
  onDelete, onLike, onReply, onReport, isReply = false
}: {
  post: Post; currentUserId: string; allPosts: Post[];
  onDelete: (id: string) => void;
  onLike: (id: string, liked: boolean) => void;
  onReply: (post: Post) => void;
  onReport: (post: Post) => void;
  isReply?: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const replies = allPosts.filter(p => p.parent_id === post.id);
  const isOwner = post.user_id === currentUserId;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: pt });

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href + "#post-" + post.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Ligação copiada!");
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  const parentUser = post.parent_id ? allPosts.find(p => p.id === post.parent_id)?.user : null;

  return (
    <motion.article
      id={`post-${post.id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      style={{
        background: isReply ? "transparent" : "var(--card-bg)",
        borderRadius: isReply ? 0 : 24,
        border: isReply ? "none" : "1px solid var(--border-color)",
        borderBottom: isReply ? "1px solid var(--border-light)" : undefined,
        padding: isReply ? "16px 0 16px 58px" : "24px",
        marginLeft: isReply ? 24 : 0,
        position: "relative",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: isReply ? "none" : "var(--shadow-sm)",
      }}
      onMouseEnter={(e) => {
        if (!isReply) {
          e.currentTarget.style.borderColor = "var(--primary-light-strong)";
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "var(--shadow-md)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isReply) {
          e.currentTarget.style.borderColor = "var(--border-color)";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        }
      }}
    >
      {/* Repost indicator */}
      {post.repost_id && !isReply && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          color: "var(--text-muted)", fontSize: 12, fontWeight: 600,
          marginBottom: 10, paddingLeft: 58
        }}>
          <Repeat2 size={14} />
          <span><strong style={{ color: "var(--text-main)" }}>{post.user?.nome}</strong> republicou</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 14 }}>
        {/* Avatar column */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Link href={`/profile/${post.user_id}`} style={{ textDecoration: "none" }}>
            <Avatar user={post.user} size={isReply ? 36 : 44} />
          </Link>
          {/* Thread line */}
          {!isReply && replies.length > 0 && (
            <div style={{ width: 2, flex: 1, background: "var(--border-color)", marginTop: 8, borderRadius: 2 }} />
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <Link href={`/profile/${post.user_id}`} style={{ textDecoration: "none" }}>
                <span style={{ fontWeight: 800, color: "var(--text-main)", fontSize: 15 }} className="hover:underline">
                  {post.user?.nome || "Utilizador"}
                </span>
              </Link>
              <Link href={`/profile/${post.user_id}`} style={{ textDecoration: "none" }}>
                <span style={{ color: "var(--text-muted)", fontSize: 14 }}>
                  @{post.user?.username || "user"}
                </span>
              </Link>
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>·</span>
              <span style={{ color: "var(--text-muted)", fontSize: 13 }} title={new Date(post.created_at).toLocaleString("pt-PT")}>
                {timeAgo}
              </span>
            </div>

            {/* Options Menu */}
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowMenu(v => !v)}
                style={{
                  background: "transparent", border: "none", color: "var(--text-muted)",
                  cursor: "pointer", padding: 6, borderRadius: "50%", display: "flex",
                  transition: "all 0.15s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(99,102,241,0.12)";
                  e.currentTarget.style.color = "var(--primary)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                <MoreHorizontal size={18} />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -8 }}
                    style={{
                      position: "absolute", top: "calc(100% + 4px)", right: 0,
                      background: "var(--card-bg)", border: "1px solid var(--border-color)",
                      borderRadius: 14, padding: 6, zIndex: 50,
                      boxShadow: "0 20px 60px rgba(0,0,0,0.5)", minWidth: 180
                    }}
                  >
                    <MenuItem icon={<Share2 size={15} />} label={copied ? "Copiado! ✓" : "Copiar ligação"} onClick={handleCopyLink} />
                    <MenuItem icon={<Bookmark size={15} />} label="Guardar post" onClick={() => { toast("Em breve!", { icon: "⭐" }); setShowMenu(false); }} />
                    {!isOwner && (
                      <MenuItem icon={<Flag size={15} />} label="Reportar" onClick={() => { onReport(post); setShowMenu(false); }} danger />
                    )}
                    {isOwner && (
                      <>
                        <div style={{ height: 1, background: "var(--border-color)", margin: "4px 0" }} />
                        <MenuItem
                          icon={<Trash2 size={15} />}
                          label="Eliminar publicação"
                          onClick={() => { onDelete(post.id); setShowMenu(false); }}
                          danger
                        />
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Reply context */}
          {isReply && parentUser && (
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>
              Em resposta a <span style={{ color: "var(--primary)", fontWeight: 600 }}>@{parentUser.nome}</span>
            </p>
          )}

          {/* Content */}
          <p style={{
            color: "var(--text-main)", fontSize: 15, lineHeight: 1.65,
            whiteSpace: "pre-wrap", wordBreak: "break-word", margin: "0 0 14px 0"
          }}>
            {post.content}
          </p>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 4, marginLeft: -10 }}>
            <ActionBtn
              icon={<MessageSquare size={18} />}
              label="Comentar"
              count={replies.length}
              activeColor="#1d9bf0"
              onClick={() => setShowReplyBox(v => !v)}
            />
            <ActionBtn
              icon={<Repeat2 size={18} />}
              label="Republicar"
              activeColor="#00ba7c"
              onClick={() => onReply(post)}
            />
            <ActionBtn
              icon={<Heart size={18} style={{ fill: post.user_has_liked ? "currentColor" : "none" }} />}
              label="Gosto"
              count={post.likes_count}
              active={post.user_has_liked}
              activeColor="#f91880"
              onClick={() => onLike(post.id, !!post.user_has_liked)}
            />
            <ActionBtn
              icon={<Share2 size={18} />}
              label="Partilhar"
              activeColor="#1d9bf0"
              onClick={handleCopyLink}
            />
          </div>

          {/* Inline reply box */}
          <AnimatePresence>
            {showReplyBox && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden", marginTop: 12 }}
              >
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 16 }}>
                  <FeedInput
                    userProfile={{ id: currentUserId, nome: "Tu" }}
                    replyTo={{ id: post.id, userName: post.user?.nome || "Utilizador" }}
                    onReplyCancel={() => setShowReplyBox(false)}
                    onPosted={() => setShowReplyBox(false)}
                    compact
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Menu Item ────────────────────────────────────────────────────────────────
function MenuItem({ icon, label, onClick, danger = false }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        background: "transparent", border: "none", padding: "10px 14px",
        cursor: "pointer", color: danger ? "var(--danger, #ef4444)" : "var(--text-main)",
        fontSize: 14, fontWeight: 600, borderRadius: 10, transition: "background 0.15s", textAlign: "left"
      }}
      onMouseEnter={e => e.currentTarget.style.background = danger ? "rgba(239,68,68,0.08)" : "var(--input-bg)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {icon} {label}
    </button>
  );
}

// ─── Repost Modal ─────────────────────────────────────────────────────────────
function RepostModal({ post, currentUserId, onClose, onDone }: {
  post: Post; currentUserId: string; onClose: () => void; onDone: () => void;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function doRepost() {
    setLoading(true);
    try {
      const { error } = await supabase.from("posts").insert({
        user_id: currentUserId,
        content: post.content,
        repost_id: post.id
      });
      if (error) throw error;
      toast.success("Republicado!");
      onDone();
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
    }} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--card-bg)", borderRadius: 20, padding: 24, maxWidth: 400, width: "90%",
          border: "1px solid var(--border-color)", boxShadow: "0 40px 100px rgba(0,0,0,0.6)"
        }}
      >
        <h3 style={{ color: "var(--text-main)", fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Republicar?</h3>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
          O post de <strong style={{ color: "var(--text-main)" }}>{post.user?.nome}</strong> vaia parecer no teu perfil.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 100, border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-main)", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
            Cancelar
          </button>
          <button onClick={doRepost} disabled={loading} style={{ flex: 1, padding: "10px 0", borderRadius: 100, border: "none", background: "var(--primary)", color: "white", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontSize: 14, opacity: loading ? 0.7 : 1 }}>
            {loading ? "A republicar..." : "Republicar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Report Modal ────────────────────────────────────────────────────────────
function ReportModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  async function doReport() {
    if (!reason.trim()) {
      toast.error("Por favor, seleciona um motivo.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/posts/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, reason, details })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Publicação denunciada. Obrigado!", { icon: "🚩" });
      onClose();
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  const reasons = [
    "Spam / Conteúdo Irrelevante",
    "Linguagem Ofensiva / Assédio",
    "Conteúdo Inapropriado / Nudez",
    "Fraude / Golpe de Troca",
    "Outro"
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
    }} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--card-bg)", borderRadius: 20, padding: 24, maxWidth: 440, width: "90%",
          border: "1px solid var(--border-color)", boxShadow: "0 40px 100px rgba(0,0,0,0.6)"
        }}
      >
        <h3 style={{ color: "var(--text-main)", fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Denunciar Publicação</h3>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
          Ajuda-nos a manter a Troca Stickers segura. Por que razão estás a denunciar esta publicação?
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {reasons.map((r) => (
            <label key={r} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 10, cursor: "pointer",
              background: reason === r ? "rgba(74,158,255,0.08)" : "transparent",
              border: `1px solid ${reason === r ? "#4a9eff" : "var(--border-color)"}`,
              fontSize: 13, color: "var(--text-main)", fontWeight: 500,
              transition: "all 0.2s"
            }}>
              <input
                type="radio"
                name="report_reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                style={{ accentColor: "#4a9eff" }}
              />
              {r}
            </label>
          ))}
        </div>

        <textarea
          placeholder="Mais detalhes (opcional)..."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
          style={{
            width: "100%", padding: "10px 12px", background: "var(--input-bg)",
            border: "1px solid var(--border-color)", borderRadius: 10, color: "var(--text-main)",
            fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 20
          }}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 100, border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-main)", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
            Cancelar
          </button>
          <button onClick={doReport} disabled={loading || !reason} style={{ flex: 1, padding: "10px 0", borderRadius: 100, border: "none", background: "var(--danger, #ef4444)", color: "white", fontWeight: 700, cursor: (loading || !reason) ? "not-allowed" : "pointer", fontSize: 14, opacity: (loading || !reason) ? 0.7 : 1 }}>
            {loading ? "A enviar..." : "Denunciar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>⚽</div>
      <h3 style={{ color: "var(--text-main)", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
        Ainda não há publicações!
      </h3>
      <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.6, maxWidth: 360, margin: "0 auto" }}>
        Sê o primeiro a partilhar uma figurinha rara, uma troca épica ou o teu progresso no álbum.
      </p>
    </div>
  );
}

// ─── Main Feed List ───────────────────────────────────────────────────────────
export default function FeedList({
  initialPosts,
  currentUserId,
  currentUserProfile
}: {
  initialPosts: Post[];
  currentUserId: string;
  currentUserProfile?: any;
}) {
  const [allPosts, setAllPosts] = useState<Post[]>(initialPosts);
  const [repostTarget, setRepostTarget] = useState<Post | null>(null);
  const [reportTarget, setReportTarget] = useState<Post | null>(null);
  const supabase = createClient();

  const mainPosts = allPosts.filter(p => !p.parent_id && !p.repost_id)
    .concat(allPosts.filter(p => !p.parent_id && !!p.repost_id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  useEffect(() => {
    setAllPosts(initialPosts);
  }, [initialPosts]);

  // ── Load and sync likes ──
  useEffect(() => {
    async function syncLikes() {
      try {
        const { data: likes } = await supabase.from("post_likes").select("*");
        if (!likes) return;
        setAllPosts(prev => prev.map(post => ({
          ...post,
          likes_count: likes.filter((l: any) => l.post_id === post.id).length,
          user_has_liked: likes.some((l: any) => l.post_id === post.id && l.user_id === currentUserId)
        })));
      } catch (e) {
        console.warn("Could not sync likes:", e);
      }
    }

    syncLikes();

    const channel = supabase
      .channel("feed-realtime-v2")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, async (payload: any) => {
        const { data } = await supabase
          .from("posts")
          .select("*, user:profiles!posts_user_id_fkey(*)")
          .eq("id", payload.new.id)
          .single();

        if (data) {
          setAllPosts(prev => {
            if (prev.some(p => p.id === data.id)) return prev;
            return [{ ...data, likes_count: 0, user_has_liked: false } as Post, ...prev];
          });
        }
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "posts" }, (payload: any) => {
        setAllPosts(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "post_likes" }, () => {
        syncLikes();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, currentUserId]);

  // ── Optimistic Like ──
  async function handleLike(postId: string, hasLiked: boolean) {
    // Optimistic update
    setAllPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      user_has_liked: !hasLiked,
      likes_count: (p.likes_count || 0) + (hasLiked ? -1 : 1)
    } : p));

    try {
      if (hasLiked) {
        const { error } = await supabase.from("post_likes").delete()
          .eq("post_id", postId).eq("user_id", currentUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: currentUserId });
        if (error) throw error;
      }
    } catch (e: any) {
      // Revert on failure
      setAllPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        user_has_liked: hasLiked,
        likes_count: (p.likes_count || 0) + (hasLiked ? 1 : -1)
      } : p));
      toast.error("Erro ao registar gosto");
    }
  }

  // ── Delete ──
  async function handleDelete(postId: string) {
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      toast.error("Erro ao eliminar");
    } else {
      toast.success("Publicação eliminada");
    }
  }

  if (mainPosts.length === 0) return <EmptyState />;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <AnimatePresence mode="popLayout">
          {mainPosts.map(post => {
            const replies = allPosts.filter(p => p.parent_id === post.id);
            return (
              <div key={post.id}>
                <PostCard
                  post={post}
                  currentUserId={currentUserId}
                  allPosts={allPosts}
                  onDelete={handleDelete}
                  onLike={handleLike}
                  onReply={setRepostTarget}
                  onReport={setReportTarget}
                />
                {/* Thread replies */}
                {replies.length > 0 && (
                  <div style={{
                    borderLeft: "2px solid var(--border-color)",
                    marginLeft: 22, marginTop: 0,
                    paddingTop: 8
                  }}>
                    {replies.map(reply => (
                      <PostCard
                        key={reply.id}
                        post={reply}
                        currentUserId={currentUserId}
                        allPosts={allPosts}
                        onDelete={handleDelete}
                        onLike={handleLike}
                        onReply={setRepostTarget}
                        onReport={setReportTarget}
                        isReply
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Repost Modal */}
      <AnimatePresence>
        {repostTarget && (
          <RepostModal
            post={repostTarget}
            currentUserId={currentUserId}
            onClose={() => setRepostTarget(null)}
            onDone={() => setRepostTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {reportTarget && (
          <ReportModal
            post={reportTarget}
            onClose={() => setReportTarget(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
