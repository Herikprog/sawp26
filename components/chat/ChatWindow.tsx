"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message, Profile } from "@/types";
import { timeAgo } from "@/lib/utils";
import { Send, ChevronLeft, Info, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  conversationId: string;
  initialMessages: Message[];
  myUserId: string;
  otherUser: Profile;
}

export default function ChatWindow({ conversationId, initialMessages, myUserId, otherUser }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const supabase = createClient();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const channel = supabase.channel(`room:${conversationId}`, {
      config: {
        broadcast: { ack: true, self: false },
        presence: { key: myUserId },
      },
    });

    channel
      .on("broadcast", { event: "new_message" }, (payload) => {
        const newMsg = payload.payload as Message;
        if (newMsg.sender_id !== myUserId) {
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      })
      .on("broadcast", { event: "messages_read" }, (payload) => {
        const { conversationId: cid, readerId } = payload.payload;
        if (cid === conversationId && readerId !== myUserId) {
          setMessages(prev => prev.map(m => 
            m.sender_id === myUserId ? { ...m, read: true } : m
          ));
        }
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const typingUsers = Object.values(state).flat().filter((u: any) => u.typing && u.user_id !== myUserId);
        setIsTyping(typingUsers.length > 0);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          channelRef.current = channel;
          await channel.track({ user_id: myUserId, typing: false });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, myUserId, supabase]);

  // Mark as read when messages arrive or window opens
  useEffect(() => {
    async function markAsRead() {
      const hasUnread = messages.some(m => !m.read && m.sender_id !== myUserId);
      if (hasUnread) {
        await supabase
          .from("messages")
          .update({ read: true })
          .eq("conversation_id", conversationId)
          .not("sender_id", "eq", myUserId)
          .eq("read", false);
        
        // Broadcast that I read the messages
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "messages_read",
            payload: { conversationId, readerId: myUserId }
          });
        }
      }
    }
    markAsRead();
  }, [messages, conversationId, myUserId, supabase]);

  async function handleTyping(val: string) {
    setInput(val);
    if (channelRef.current) {
      await channelRef.current.track({ user_id: myUserId, typing: val.length > 0 });
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const content = input.trim();
    setInput("");
    
    // Create optimistic message for instant UI feedback
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId as any,
      conversation_id: conversationId,
      sender_id: myUserId,
      content,
      read: false,
      created_at: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, optimisticMsg]);

    // Save to database
    const { data: savedMsg, error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: myUserId,
      content,
    }).select().single();

    if (error || !savedMsg) {
      console.error("Failed to save message error details:", JSON.stringify(error, null, 2));
      console.error("Full error object:", error);
      // Remove optimistic message if failed
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      return;
    }

    // Replace optimistic message with real message
    setMessages((prev) => prev.map((m) => m.id === tempId ? savedMsg : m));

    // Broadcast the REAL message to the other user
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "new_message",
        payload: savedMsg,
      }).catch(console.error);
      
      channelRef.current.track({ user_id: myUserId, typing: false }).catch(console.error);
    }
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%", maxWidth: 800,
      margin: "0 auto", width: "100%", background: "var(--bg-main)", position: "relative"
    }}>
      {/* Premium Header */}
      <div style={{
        padding: "16px 24px", background: "var(--bg-main-transparent)",
        backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/chat" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
            <ChevronLeft size={24} />
          </Link>
          <div style={{ position: "relative" }}>
            {otherUser.avatar_url ? (
              <Image src={otherUser.avatar_url} alt={otherUser.nome} width={44} height={44} style={{ borderRadius: 14, objectFit: "cover" }} />
            ) : (
              <div style={{
                width: 44, height: 44, borderRadius: 14, background: "var(--input-bg)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 700, color: "var(--primary)",
              }}>
                {otherUser.nome[0]}
              </div>
            )}
            {otherUser.is_online && (
              <div style={{
                position: "absolute", bottom: -2, right: -2, width: 14, height: 14,
                borderRadius: "50%", background: "var(--success)", border: "3px solid #07111F",
              }} />
            )}
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{otherUser.nome}</p>
            <p style={{ fontSize: 12, color: otherUser.is_online ? "var(--success)" : "var(--text-muted)", margin: 0 }}>
              {otherUser.is_online ? "Online agora" : `Visto há ${timeAgo(otherUser.last_seen)}`}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ background: "transparent", border: "none", color: "var(--text-muted)", padding: 8, cursor: "pointer" }}>
            <Info size={20} />
          </button>
          <button style={{ background: "transparent", border: "none", color: "var(--text-muted)", padding: 8, cursor: "pointer" }}>
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Message Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: "20%" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚽</div>
            <h3 style={{ color: "var(--text-main)", fontSize: 20, fontWeight: 700 }}>Inicia a Troca!</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 15 }}>Diz olá ao {otherUser.nome.split(" ")[0]} e combina onde trocar as figurinhas.</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === myUserId;
            const showTime = true; // Could simplify logic
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                style={{
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  maxWidth: "75%",
                  display: "flex", flexDirection: "column",
                  alignItems: isMe ? "flex-end" : "flex-start"
                }}
              >
                <div style={{
                  padding: "14px 20px",
                  borderRadius: isMe ? "22px 22px 4px 22px" : "22px 22px 22px 4px",
                  background: isMe ? "var(--primary)" : "var(--card-bg)",
                  color: "var(--text-main)",
                  fontSize: 15,
                  lineHeight: 1.5,
                  boxShadow: isMe ? "0 4px 15px rgba(0,174,239,0.2)" : "0 4px 15px rgba(0,0,0,0.1)",
                  border: isMe ? "none" : "1px solid rgba(255,255,255,0.05)"
                }}>
                  {msg.content}
                </div>
                {showTime && (
                  <span style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, padding: "0 4px" }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMe && msg.read && " · Lido"}
                  </span>
                )}
              </motion.div>
            );
          })
        )}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                alignSelf: "flex-start", padding: "12px 20px",
                background: "var(--card-bg)", borderRadius: "20px 20px 20px 4px",
                display: "flex", gap: 4, alignItems: "center"
              }}
            >
              <div className="dot-pulse" style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-muted)" }} />
              <div className="dot-pulse" style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-muted)", animationDelay: "0.2s" }} />
              <div className="dot-pulse" style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-muted)", animationDelay: "0.4s" }} />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: "24px", background: "var(--bg-main-transparent)",
        backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        paddingBottom: "max(24px, env(safe-area-inset-bottom))"
      }}>
        <form onSubmit={sendMessage} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{
            flex: 1, background: "var(--input-bg)", borderRadius: 20,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "4px 16px", display: "flex", alignItems: "center"
          }}>
            <textarea
              value={input}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder="Mensagem..."
              style={{
                width: "100%", background: "transparent", border: "none",
                color: "var(--text-main)", fontSize: 15, padding: "12px 0",
                outline: "none", resize: "none", maxHeight: 120,
                fontFamily: "inherit"
              }}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim()}
            style={{
              width: 48, height: 48, borderRadius: "50%",
              background: input.trim() ? "var(--primary)" : "var(--border-light)",
              color: "var(--text-main)", border: "none", display: "flex",
              alignItems: "center", justifyContent: "center",
              cursor: input.trim() ? "pointer" : "default",
              transition: "all 0.3s ease",
              boxShadow: input.trim() ? "0 4px 15px rgba(0,174,239,0.3)" : "none"
            }}
          >
            <Send size={20} style={{ marginLeft: 2 }} />
          </button>
        </form>
      </div>

      <style jsx>{`
        .dot-pulse {
          animation: pulse 1s infinite alternate;
        }
        @keyframes pulse {
          from { opacity: 0.3; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
