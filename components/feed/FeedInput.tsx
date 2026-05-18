"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, Smile, X } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

const EMOJI_CATEGORIES = [
  { label: "Futebol", emojis: ["⚽", "🏆", "🥅", "🥇", "🎽", "🏟️", "📋", "🤙"] },
  { label: "Reações", emojis: ["🔥", "💎", "💯", "✅", "❤️", "😍", "😎", "🤩"] },
  { label: "Bandeiras", emojis: ["🇵🇹", "🇧🇷", "🇦🇷", "🇫🇷", "🇩🇪", "🇪🇸", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "🇮🇹"] },
];

const MAX_CHARS = 500;

interface FeedInputProps {
  userProfile: any;
  replyTo?: { id: string; userName: string } | null;
  onReplyCancel?: () => void;
  onPosted?: () => void;
  compact?: boolean;
}

export default function FeedInput({ userProfile, replyTo, onReplyCancel, onPosted, compact = false }: FeedInputProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;
  const isNearLimit = charsLeft <= 50 && charsLeft >= 0;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [content]);

  // Close emoji picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojis(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handlePost() {
    if (!content.trim() || isOverLimit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        user_id: userProfile.id,
        content: content.trim(),
      };
      if (replyTo) payload.parent_id = replyTo.id;

      const { error } = await supabase.from("posts").insert(payload);
      if (error) throw error;

      setContent("");
      setShowEmojis(false);
      toast.success(replyTo ? "Resposta enviada!" : "Publicado!");
      onPosted?.();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handlePost();
    }
  }

  const addEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setContent(prev => prev + emoji);
    }
  };

  const avatarLetter = userProfile?.nome?.[0]?.toUpperCase() || "U";

  return (
    <div style={{
      background: compact ? "transparent" : "var(--card-bg)",
      borderRadius: compact ? 0 : 24,
      border: compact ? "none" : "1px solid var(--border-color)",
      padding: compact ? "16px 0" : "24px",
      marginBottom: compact ? 0 : 28,
      boxShadow: compact ? "none" : "var(--shadow-sm)",
      transition: "all 0.3s ease",
    }}>
      {replyTo && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 12, padding: "6px 12px", background: "rgba(var(--primary-rgb, 99,102,241),0.08)",
          borderRadius: 10, fontSize: 13, color: "var(--text-muted)"
        }}>
          <span>Respondendo a <strong style={{ color: "var(--primary)" }}>@{replyTo.userName}</strong></span>
          {onReplyCancel && (
            <button onClick={onReplyCancel} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
              <X size={14} />
            </button>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 14 }}>
        {/* Avatar */}
        <div style={{
          width: compact ? 36 : 46, height: compact ? 36 : 46,
          borderRadius: "50%", overflow: "hidden", flexShrink: 0,
          background: "var(--input-bg)", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: compact ? 14 : 18, fontWeight: 800, color: "var(--primary)",
          border: "2px solid var(--border-color)"
        }}>
          {userProfile?.avatar_url
            ? <Image src={userProfile.avatar_url} alt="Avatar" width={46} height={46} style={{ objectFit: "cover", width: "100%", height: "auto" }} />
            : avatarLetter
          }
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={replyTo ? `Responder a @${replyTo.userName}...` : "O que está a acontecer no teu álbum?"}
            rows={compact ? 2 : 3}
            style={{
              width: "100%", background: "transparent", border: "none",
              color: "var(--text-main)", fontSize: compact ? 14 : 16, outline: "none",
              resize: "none", padding: "8px 0", lineHeight: 1.6,
              fontFamily: "inherit", overflow: "hidden", minHeight: compact ? 48 : 72
            }}
          />

          {/* Toolbar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 8
          }}>
            <div style={{ display: "flex", gap: 4, alignItems: "center", position: "relative" }} ref={emojiPickerRef}>
              <button
                onClick={() => setShowEmojis(!showEmojis)}
                title="Emojis"
                style={{
                  background: showEmojis ? "var(--primary-light, rgba(99,102,241,0.12))" : "transparent",
                  border: "none", color: "var(--primary)", cursor: "pointer",
                  padding: 8, borderRadius: 10, transition: "all 0.15s", display: "flex", alignItems: "center"
                }}
              >
                <Smile size={18} />
              </button>

              {showEmojis && (
                <div style={{
                  position: "absolute", bottom: "calc(100% + 8px)", left: 0,
                  background: "var(--card-bg)", border: "1px solid var(--border-color)",
                  borderRadius: 16, padding: 12, zIndex: 200,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.6)", width: 240
                }}>
                  {/* Category tabs */}
                  <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                    {EMOJI_CATEGORIES.map((cat, i) => (
                      <button key={i} onClick={() => setActiveCategory(i)} style={{
                        background: activeCategory === i ? "var(--primary)" : "transparent",
                        border: "none", color: activeCategory === i ? "white" : "var(--text-muted)",
                        cursor: "pointer", padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600
                      }}>{cat.label}</button>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                    {EMOJI_CATEGORIES[activeCategory].emojis.map(e => (
                      <button key={e} onClick={() => addEmoji(e)} style={{
                        background: "transparent", border: "none", fontSize: 22, cursor: "pointer",
                        padding: 8, borderRadius: 8, transition: "background 0.15s"
                      }}
                        onMouseEnter={ev => (ev.currentTarget.style.background = "var(--input-bg)")}
                        onMouseLeave={ev => (ev.currentTarget.style.background = "transparent")}
                      >{e}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Character counter */}
              {content.length > 0 && (
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: isOverLimit ? "var(--danger, #ef4444)" : isNearLimit ? "var(--warning, #f59e0b)" : "var(--text-muted)"
                }}>
                  {charsLeft}
                </span>
              )}

              <button
                onClick={handlePost}
                disabled={isSubmitting || !content.trim() || isOverLimit}
                style={{
                  background: isSubmitting || !content.trim() || isOverLimit ? "var(--input-bg)" : "var(--gradient-primary)",
                  color: isSubmitting || !content.trim() || isOverLimit ? "var(--text-muted)" : "white",
                  fontWeight: 700, padding: compact ? "8px 20px" : "12px 28px",
                  borderRadius: 14, border: "none", cursor: isSubmitting || !content.trim() || isOverLimit ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 8, fontSize: 14,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: isSubmitting || !content.trim() || isOverLimit ? "none" : "0 8px 24px -4px rgba(0, 153, 255, 0.3)",
                }}
              >
                {isSubmitting ? "A publicar..." : <><Send size={14} /> {replyTo ? "Responder" : "Postar"}</>}
              </button>
            </div>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0 0" }}>Ctrl+Enter para publicar</p>
        </div>
      </div>
    </div>
  );
}
