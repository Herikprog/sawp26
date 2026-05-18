"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Check, 
  X, 
  Repeat2, 
  Sparkles, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { getFlagUrl } from "@/types";

// ============================================================
// SINTETIZADOR WEB AUDIO API PARA TOQUE PREMIUM SEM DEPENDÊNCIAS
// ============================================================
let audioCtx: AudioContext | null = null;
let ringInterval: any = null;

function startRingingSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
    
    const playFuturisticChime = () => {
      const ctx = audioCtx;
      if (!ctx || ctx.state === "suspended") return;
      const now = ctx.currentTime;
      
      // Frequências para acorde futurista suave e harmonioso
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = "sine";
        // Pequeno atraso cascata para efeito harpa
        const noteDelay = idx * 0.08;
        osc.frequency.setValueAtTime(freq, now + noteDelay);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + noteDelay + 0.6);
        
        gainNode.gain.setValueAtTime(0, now + noteDelay);
        gainNode.gain.linearRampToValueAtTime(0.12, now + noteDelay + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + noteDelay + 0.8);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(now + noteDelay);
        osc.stop(now + noteDelay + 0.9);
      });
    };
    
    playFuturisticChime();
    ringInterval = setInterval(playFuturisticChime, 1800);
  } catch (e) {
    console.error("Audio Context Ringing Error:", e);
  }
}

function stopRingingSound() {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
  if (audioCtx) {
    audioCtx.close().catch(() => {});
    audioCtx = null;
  }
}

export default function GlobalTradeManager() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [outgoingCall, setOutgoingCall] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initiatorProfile, setInitiatorProfile] = useState<any>(null);
  const [receiverProfile, setReceiverProfile] = useState<any>(null);
  const [stickersMap, setStickersMap] = useState<Record<number, string>>({});
  
  const supabase = createClient();
  const outgoingSubscription = useRef<any>(null);

  // 1. Carregar utilizador logado e catálogo de figurinhas
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
      }

      const { data: stickersData } = await supabase.from("stickers").select("id, codigo");
      if (stickersData) {
        const dict: Record<number, string> = {};
        stickersData.forEach((s: any) => {
          dict[s.id] = s.codigo;
        });
        setStickersMap(dict);
      }
    }
    init();
  }, [supabase]);

  // 2. Ouvir propostas de trocas recebidas (Incoming Calls)
  useEffect(() => {
    if (!currentUser) return;

    // Função para carregar perfil do remetente da chamada
    async function fetchInitiatorProfile(initiatorId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", initiatorId)
        .single();
      if (data) {
        setInitiatorProfile(data);
      }
    }

    // Criar canal em tempo real para ouvir inserts na tabela trades
    const channel = supabase.channel("incoming-trades")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trades",
          filter: `receiver_id=eq.${currentUser.id}`
        },
        async (payload: any) => {
          const tradeRow = payload.new;
          if (tradeRow && tradeRow.status === "pending") {
            setIncomingCall(tradeRow);
            await fetchInitiatorProfile(tradeRow.initiator_id);
            startRingingSound();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trades",
          filter: `receiver_id=eq.${currentUser.id}`
        },
        async (payload: any) => {
          const tradeRow = payload.new;
          if (tradeRow) {
            if (tradeRow.status !== "pending") {
              // Se foi cancelado ou fechado pelo outro lado
              setIncomingCall(null);
              setInitiatorProfile(null);
              stopRingingSound();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopRingingSound();
    };
  }, [currentUser, supabase]);

  // 3. Ouvir atualizações da nossa própria chamada enviada (Outgoing Calls)
  useEffect(() => {
    if (!outgoingCall) return;

    async function fetchReceiverProfile(receiverId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", receiverId)
        .single();
      if (data) {
        setReceiverProfile(data);
      }
    }
    fetchReceiverProfile(outgoingCall.receiver_id);

    // Ouvir updates especificamente nessa linha da chamada
    outgoingSubscription.current = supabase.channel(`outgoing-trade-${outgoingCall.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trades",
          filter: `id=eq.${outgoingCall.id}`
        },
        (payload: any) => {
          const tradeRow = payload.new;
          if (tradeRow) {
            if (tradeRow.status === "completed" || tradeRow.status === "accepted") {
              toast.success(`🏆 A sua proposta de troca com ${receiverProfile?.nome || "o utilizador"} foi ACEITA e concluída!`);
              setOutgoingCall(null);
              setReceiverProfile(null);
            } else if (tradeRow.status === "rejected") {
              toast.error(`❌ A sua proposta de troca foi recusada por ${receiverProfile?.nome || "o utilizador"}.`);
              setOutgoingCall(null);
              setReceiverProfile(null);
            } else if (tradeRow.status === "cancelled") {
              setOutgoingCall(null);
              setReceiverProfile(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (outgoingSubscription.current) {
        supabase.removeChannel(outgoingSubscription.current);
      }
    };
  }, [outgoingCall, receiverProfile, supabase]);

  // 4. Ouvir propostas que nós criamos via evento do window (integração flexível com ChatWindow)
  useEffect(() => {
    function handleTriggerOutgoing(event: CustomEvent) {
      if (event.detail && event.detail.trade) {
        setOutgoingCall(event.detail.trade);
      }
    }
    window.addEventListener("trigger_outgoing_trade" as any, handleTriggerOutgoing);
    return () => window.removeEventListener("trigger_outgoing_trade" as any, handleTriggerOutgoing);
  }, []);

  // Aceitar Troca Recebida
  async function handleAccept() {
    if (!incomingCall || !currentUser) return;
    setLoading(true);
    stopRingingSound();

    try {
      // A. Obter ou criar conversa entre os dois utilizadores para logar o recibo no chat
      let { data: conv } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(user_a_id.eq.${incomingCall.initiator_id},user_b_id.eq.${currentUser.id}),and(user_a_id.eq.${currentUser.id},user_b_id.eq.${incomingCall.initiator_id})`)
        .maybeSingle();

      if (!conv) {
        // Criar conversa caso não exista
        const { data: newConv, error: newConvErr } = await supabase
          .from("conversations")
          .insert({
            user_a_id: incomingCall.initiator_id,
            user_b_id: currentUser.id,
            last_message: "Conversa iniciada por proposta de troca",
            last_msg_at: new Date().toISOString()
          })
          .select("id")
          .single();
        
        if (newConvErr) throw newConvErr;
        conv = newConv;
      }

      // B. Traduzir IDs de figurinhas para códigos para a RPC execute_sticker_trade
      const offeredList = incomingCall.offered_stickers.map((id: number) => ({
        codigo: stickersMap[id] || `Fig. ${id}`,
        quantity: 1
      }));
      
      const wantedList = incomingCall.wanted_stickers.map((id: number) => ({
        codigo: stickersMap[id] || `Fig. ${id}`,
        quantity: 1
      }));

      // C. Chamar a procedure transacionada segura execute_sticker_trade
      const { data, error: rpcErr } = await supabase.rpc("execute_sticker_trade", {
        p_conversation_id: conv.id,
        p_user_a_id: incomingCall.initiator_id, // Initiator A
        p_user_b_id: currentUser.id,          // Receiver B
        p_user_a_offers: offeredList,
        p_user_b_offers: wantedList
      });

      if (rpcErr) throw rpcErr;

      // D. Atualizar status da chamada para completada
      await supabase
        .from("trades")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", incomingCall.id);

      toast.success("🏆 Troca efetuada com sucesso! Os seus álbuns foram atualizados.");
    } catch (err: any) {
      console.error("Trade transaction failed:", err);
      toast.error(`Falha ao concluir troca: ${err.message || "Erro desconhecido"}`);
      
      // Se der erro, colocar como rejeitada ou cancelada
      await supabase
        .from("trades")
        .update({ status: "rejected" })
        .eq("id", incomingCall.id);
    } finally {
      setLoading(false);
      setIncomingCall(null);
      setInitiatorProfile(null);
    }
  }

  // Recusar Troca Recebida
  async function handleDecline() {
    if (!incomingCall) return;
    setLoading(true);
    stopRingingSound();

    try {
      await supabase
        .from("trades")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", incomingCall.id);
      toast.error("Chamada de troca recusada.");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIncomingCall(null);
      setInitiatorProfile(null);
    }
  }

  // Cancelar Chamada Enviada
  async function handleCancelOutgoing() {
    if (!outgoingCall) return;
    setLoading(true);

    try {
      await supabase
        .from("trades")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", outgoingCall.id);
      toast.error("Você cancelou a chamada de troca.");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setOutgoingCall(null);
      setReceiverProfile(null);
    }
  }

  return (
    <>
      {/* 🟢 OVERLAY DE CHAMADA RECEBIDA (INCOMING CALL) */}
      <AnimatePresence>
        {incomingCall && initiatorProfile && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(3, 8, 17, 0.9)",
            backdropFilter: "blur(24px)", zIndex: 9999, display: "flex",
            alignItems: "center", justifyContent: "center", padding: 20
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              style={{
                width: "100%", maxWidth: 440, background: "rgba(10, 25, 47, 0.8)",
                border: "1px solid rgba(255, 215, 0, 0.15)", borderRadius: 32,
                padding: "32px 28px", color: "var(--text-main)", textAlign: "center",
                boxShadow: "0 30px 100px rgba(245, 183, 0, 0.12)", position: "relative",
                overflow: "hidden"
              }}
            >
              {/* Efeito Neon Gold de Fundo */}
              <div style={{
                position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)",
                width: 250, height: 250, borderRadius: "50%",
                background: "var(--warning)", opacity: 0.12, filter: "blur(80px)",
                pointerEvents: "none"
              }} />

              {/* Anel Pulsante Dourado e Avatar */}
              <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* Ripples */}
                <div className="call-ripple-1" style={{ position: "absolute", inset: -10, borderRadius: "50%", border: "2px solid rgba(245, 183, 0, 0.3)", opacity: 0.6 }} />
                <div className="call-ripple-2" style={{ position: "absolute", inset: -22, borderRadius: "50%", border: "1px solid rgba(245, 183, 0, 0.15)", opacity: 0.4 }} />
                
                <div style={{
                  width: 90, height: 90, borderRadius: 28, overflow: "hidden",
                  border: "3px solid var(--warning)", boxShadow: "0 0 25px rgba(245, 183, 0, 0.4)",
                  background: "var(--input-bg)", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {initiatorProfile.avatar_url ? (
                    <Image src={initiatorProfile.avatar_url} alt="" width={90} height={90} style={{ objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 32, fontWeight: 800, color: "var(--warning)" }}>{initiatorProfile.nome[0]}</span>
                  )}
                </div>
              </div>

              {/* Título de Chamada */}
              <span style={{ fontSize: 11, fontWeight: 900, color: "var(--warning)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                🚨 CHAMADA DE TROCA RECEBIDA 🚨
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: "8px 0 2px 0", color: "var(--text-main)" }}>
                {initiatorProfile.nome}
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 24px 0" }}>
                Está a propor uma troca de figurinhas em tempo real!
              </p>

              {/* Detalhes da Proposta de Troca */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 24, padding: "18px 20px", marginBottom: 28, textAlign: "left" }}>
                {/* Ele Oferece */}
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Ele te oferece:</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    {incomingCall.offered_stickers.map((id: number) => {
                      const code = stickersMap[id] || `Fig. ${id}`;
                      return (
                        <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.2)", borderRadius: 8, padding: "3px 6px", fontSize: 10, fontWeight: 700, color: "#2ecc71" }}>
                          <img src={getFlagUrl(code)} style={{ width: 12, height: 9, borderRadius: 1.5, objectFit: "cover" }} />
                          {code}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Ele Pede */}
                <div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "var(--warning)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Ele quer de ti:</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    {incomingCall.wanted_stickers.map((id: number) => {
                      const code = stickersMap[id] || `Fig. ${id}`;
                      return (
                        <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(245,183,0,0.1)", border: "1px solid rgba(245,183,0,0.2)", borderRadius: 8, padding: "3px 6px", fontSize: 10, fontWeight: 700, color: "var(--warning)" }}>
                          <img src={getFlagUrl(code)} style={{ width: 12, height: 9, borderRadius: 1.5, objectFit: "cover" }} />
                          {code}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Botões de Decisão */}
              <div style={{ display: "flex", gap: 14 }}>
                <button
                  onClick={handleDecline}
                  disabled={loading}
                  style={{
                    flex: 1, background: "rgba(255,77,106,0.1)", border: "1px solid rgba(255,77,106,0.2)",
                    color: "var(--danger)", borderRadius: 16, padding: "14px 20px", fontSize: 14,
                    fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 8, transition: "all 0.2s"
                  }}
                >
                  <PhoneOff size={16} /> Recusar
                </button>

                <button
                  onClick={handleAccept}
                  disabled={loading}
                  style={{
                    flex: 1.5, background: "var(--gradient-primary)", border: "none",
                    color: "#fff", borderRadius: 16, padding: "14px 20px", fontSize: 14,
                    fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 8, boxShadow: "0 10px 25px rgba(0,174,239,0.35)",
                    transition: "all 0.2s"
                  }}
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <PhoneCall size={16} /> Aceitar Troca
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🔴 OVERLAY DE CHAMADA ENVIADA (OUTGOING CALL PANEL) */}
      <AnimatePresence>
        {outgoingCall && receiverProfile && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(3, 8, 17, 0.85)",
            backdropFilter: "blur(16px)", zIndex: 9999, display: "flex",
            alignItems: "center", justifyContent: "center", padding: 20
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: "100%", maxWidth: 400, background: "rgba(10, 25, 47, 0.95)",
                border: "1px solid rgba(255,255,255,0.06)", borderRadius: 32,
                padding: "36px 28px", color: "var(--text-main)", textAlign: "center",
                boxShadow: "0 30px 80px rgba(0,0,0,0.6)"
              }}
            >
              {/* Efeito Pulsante Radar Azul */}
              <div style={{ position: "relative", width: 90, height: 90, margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="outgoing-pulse" style={{ position: "absolute", inset: -16, borderRadius: "50%", background: "var(--primary)", opacity: 0.12 }} />
                
                <div style={{
                  width: 80, height: 80, borderRadius: 24, overflow: "hidden",
                  border: "3px solid var(--primary)", boxShadow: "0 0 20px rgba(0,174,239,0.3)",
                  background: "var(--input-bg)", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {receiverProfile.avatar_url ? (
                    <Image src={receiverProfile.avatar_url} alt="" width={80} height={80} style={{ objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 28, fontWeight: 800, color: "var(--primary)" }}>{receiverProfile.nome[0]}</span>
                  )}
                </div>
              </div>

              <span style={{ fontSize: 11, fontWeight: 850, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                Proposta Enviada
              </span>
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: "6px 0 2px 0", color: "var(--text-main)" }}>
                A chamar {receiverProfile.nome}...
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 24px 0", lineHeight: 1.4 }}>
                Enviamos uma notificação de chamada interativa no ecrã de {receiverProfile.nome.split(" ")[0]}. Aguardando resposta...
              </p>

              <button
                onClick={handleCancelOutgoing}
                disabled={loading}
                style={{
                  width: "100%", background: "rgba(255,77,106,0.1)", border: "1px solid rgba(255,77,106,0.15)",
                  color: "var(--danger)", borderRadius: 16, padding: "14px 20px", fontSize: 14,
                  fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8, transition: "all 0.2s"
                }}
              >
                <PhoneOff size={16} /> Cancelar Chamada
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ESTILOS DE RIPPLE E PULSOS CINEMATOGRÁFICOS */}
      <style jsx global>{`
        .call-ripple-1 {
          animation: ripple-wave 1.6s infinite ease-out;
        }
        .call-ripple-2 {
          animation: ripple-wave 1.6s infinite ease-out 0.6s;
        }
        .outgoing-pulse {
          animation: pulse-grow 1.8s infinite ease-in-out;
        }
        @keyframes ripple-wave {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes pulse-grow {
          0% { transform: scale(0.95); opacity: 0.15; }
          50% { transform: scale(1.3); opacity: 0.05; }
          100% { transform: scale(0.95); opacity: 0.15; }
        }
      `}</style>
    </>
  );
}
