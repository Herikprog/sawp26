"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message, Profile } from "@/types";
import { timeAgo } from "@/lib/utils";
import { 
  Send, ChevronLeft, Info, MoreHorizontal, Shuffle, 
  User, BookOpen, Check, X, Plus, Trash2, Loader2, AlertCircle, PhoneCall
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface Props {
  conversationId: string;
  initialMessages: Message[];
  myUserId: string;
  otherUser: Profile;
}

interface TradeOffer {
  codigo: string;
  quantity: number;
}

interface TradeSession {
  isActive: boolean;
  myOffers: TradeOffer[];
  otherOffers: TradeOffer[];
  myAccepted: boolean;
  otherAccepted: boolean;
  errorMessage: string;
  isExecuting: boolean;
}

export default function ChatWindow({ conversationId, initialMessages, myUserId, otherUser }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [connStatus, setConnStatus] = useState<"connecting" | "connected" | "offline">("connecting");
  
  // Estados para o Sistema de Troca
  const [tradeSession, setTradeSession] = useState<TradeSession>({
    isActive: false,
    myOffers: [],
    otherOffers: [],
    myAccepted: false,
    otherAccepted: false,
    errorMessage: "",
    isExecuting: false
  });
  
  const [myInventory, setMyInventory] = useState<Record<string, number>>({});
  const [myDuplicates, setMyDuplicates] = useState<{ codigo: string; quantity: number }[]>([]);
  const [manualCode, setManualCode] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const amITyping = useRef(false);
  const isScrolledToBottom = useRef(true);
  const typingBroadcastInterval = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const receiverTypingTimeout = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);
  // Ref para evitar markAsRead repetido quando não há novas mensagens do outro
  const hasMarkedRef = useRef(false);
  // Supabase instanciado uma vez — sem leaks de WebSocket por re-render
  const supabase = useMemo(() => createClient(), []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    isScrolledToBottom.current = scrollHeight - scrollTop - clientHeight < 50;
  };

  useEffect(() => {
    if (isFirstRender.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      isFirstRender.current = false;
    } else if (isScrolledToBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Carregar inventário e duplicadas locais para validação de trocas
  async function loadInventory() {
    const { data: userStickers } = await supabase
      .from("user_stickers")
      .select("quantity, sticker:stickers(codigo)")
      .eq("user_id", myUserId)
      .gt("quantity", 0);

    if (userStickers) {
      const inv: Record<string, number> = {};
      const dups: { codigo: string; quantity: number }[] = [];
      
      userStickers.forEach((item: any) => {
        const code = item.sticker.codigo;
        inv[code] = item.quantity;
        if (item.quantity > 1) {
          dups.push({ codigo: code, quantity: item.quantity });
        }
      });
      
      setMyInventory(inv);
      setMyDuplicates(dups);
    }
  }

  useEffect(() => {
    loadInventory();
  }, [tradeSession.isActive]);

  // Carregar proposta de troca pré-selecionada da URL (Chamada telefônica direta)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tradeId = params.get("tradeId");
    if (!tradeId) return;

    async function loadTradeInvite() {
      try {
        const { data: trade, error } = await supabase
          .from("trades")
          .select("*")
          .eq("id", tradeId)
          .single();

        if (error) {
          toast.error(`Erro ao carregar chamada de troca: ${error.message}`);
          return;
        }
        if (!trade) {
          toast.error("A chamada de troca não foi encontrada no banco de dados.");
          return;
        }

        // Se o status da troca não for pending ou accepted, não abrir
        if (trade.status !== "pending" && trade.status !== "accepted") {
          toast.error(`Chamada de troca ignorada: status é '${trade.status}'`);
          return;
        }

        const offeredIds = trade.offered_stickers || [];
        const wantedIds = trade.wanted_stickers || [];

        // Traduzir IDs das figurinhas para códigos
        const allIds = [...offeredIds, ...wantedIds];
        if (allIds.length === 0) {
          toast.error("A chamada de troca não contém figurinhas vinculadas.");
          return;
        }

        const { data: stickers, error: stickersErr } = await supabase
          .from("stickers")
          .select("id, codigo")
          .in("id", allIds);

        if (stickersErr) {
          toast.error(`Erro ao carregar figurinhas da proposta: ${stickersErr.message}`);
          return;
        }
        if (!stickers) {
          toast.error("Falha ao mapear figurinhas.");
          return;
        }

        const idToCode: Record<number, string> = {};
        stickers.forEach((s: any) => {
          idToCode[s.id] = s.codigo;
        });

        // Montar ofertas do ponto de vista deste utilizador
        const isInitiator = myUserId === trade.initiator_id;

        const initiatorOffers = offeredIds.map((id: number) => ({
          codigo: idToCode[id] || `Fig. ${id}`,
          quantity: 1
        }));

        const receiverOffers = wantedIds.map((id: number) => ({
          codigo: idToCode[id] || `Fig. ${id}`,
          quantity: 1
        }));

        const myOffers = isInitiator ? initiatorOffers : receiverOffers;
        const otherOffers = isInitiator ? receiverOffers : initiatorOffers;

        setTradeSession({
          isActive: true,
          myOffers,
          otherOffers,
          myAccepted: false,
          otherAccepted: false,
          errorMessage: "",
          isExecuting: false
        });

        // Limpar o query param tradeId da URL de forma elegante
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);

        // Notificar o outro colecionador via broadcast, com retry até o canal estar pronto
        broadcastWhenReady({
          userId: myUserId,
          offers: myOffers,
          accepted: false,
          isActive: true
        });

      } catch (err) {
        console.error("Failed to load prefilled trade proposal:", err);
      }
    }
    loadTradeInvite();
  }, [supabase, myUserId]);

  // WebSocket / Supabase Realtime Channels
  useEffect(() => {
    const channel = supabase.channel(`room:${conversationId}`, {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload: any) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload: any) => {
          const updatedMsg = payload.new as Message;
          setMessages((prev) => prev.map((m) => m.id === updatedMsg.id ? updatedMsg : m));
        }
      )
      .on("broadcast", { event: "typing" }, (payload: any) => {
        const { userId, typing } = payload.payload;
        if (userId !== myUserId) {
          if (typing) {
            setIsTyping(true);
            if (receiverTypingTimeout.current) clearTimeout(receiverTypingTimeout.current);
            receiverTypingTimeout.current = setTimeout(() => {
              setIsTyping(false);
            }, 3500);
          } else {
            setIsTyping(false);
            if (receiverTypingTimeout.current) {
              clearTimeout(receiverTypingTimeout.current);
              receiverTypingTimeout.current = null;
            }
          }
        }
      })
      .on("broadcast", { event: "trade_sync" }, (payload: any) => {
        const { userId, offers, accepted, isActive, completed } = payload.payload;
        if (userId !== myUserId) {
          setTradeSession((prev) => {
            // BUG2 FIX: troca concluída pelo outro lado — fechar painel e actualizar inventário
            if (completed === true) {
              toast.success("🏆 Troca concluída com sucesso!");
              // loadInventory fora do setState para não violar regras de hooks
              setTimeout(() => loadInventory(), 0);
              return {
                isActive: false, myOffers: [], otherOffers: [],
                myAccepted: false, otherAccepted: false, errorMessage: "", isExecuting: false
              };
            }

            const nextSession = {
              ...prev,
              isActive: prev.isActive || isActive,
              otherOffers: offers ?? prev.otherOffers,
              otherAccepted: accepted ?? prev.otherAccepted,
            };

            // Se o outro utilizador cancelar
            if (isActive === false && prev.isActive) {
              toast.error("O outro colecionador cancelou a negociação de trocas.");
              nextSession.isActive = false;
              nextSession.myOffers = [];
              nextSession.otherOffers = [];
              nextSession.myAccepted = false;
              nextSession.otherAccepted = false;
              nextSession.errorMessage = "";
            }

            return nextSession;
          });
        }
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          setConnStatus("connected");
          channelRef.current = channel;
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setConnStatus("offline");
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (receiverTypingTimeout.current) clearTimeout(receiverTypingTimeout.current);
    };
  }, [conversationId, myUserId, supabase]);

  // Marcar como lido — só corre quando chegam mensagens novas do outro utilizador
  // hasMarkedRef evita UPDATE redundante a cada render (inclui próprias mensagens)
  useEffect(() => {
    const hasNewUnread = messages.some(m => !m.read && m.sender_id !== myUserId);
    if (!hasNewUnread) {
      // Sem mensagens por ler — reset da flag para a próxima vez
      hasMarkedRef.current = false;
      return;
    }
    if (hasMarkedRef.current) return; // Já marcou esta série de mensagens
    hasMarkedRef.current = true;

    async function mark() {
      const { error } = await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", myUserId)
        .eq("read", false);
        
      if (error) {
        console.error("Erro ao marcar mensagens como lidas:", error);
        hasMarkedRef.current = false; // Permite retentar se falhou
      }
    }
    
    mark();
  }, [messages, conversationId, myUserId, supabase]);

  // Digitação
  async function handleTyping(val: string) {
    setInput(val);
    if (!channelRef.current) return;

    if (!amITyping.current && val.length > 0) {
      amITyping.current = true;
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: myUserId, typing: true }
      });

      typingBroadcastInterval.current = setInterval(() => {
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "typing",
            payload: { userId: myUserId, typing: true }
          });
        }
      }, 1500);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    if (val.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 2500);
    } else {
      stopTyping();
    }
  }

  function stopTyping() {
    amITyping.current = false;
    if (typingBroadcastInterval.current) {
      clearInterval(typingBroadcastInterval.current);
      typingBroadcastInterval.current = null;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: myUserId, typing: false }
      });
    }
  }

  // --- MÉTODOS DE CONTROLE DA TROCA ---

  function startTrade() {
    setTradeSession({
      isActive: true,
      myOffers: [],
      otherOffers: [],
      myAccepted: false,
      otherAccepted: false,
      errorMessage: "",
      isExecuting: false
    });
    
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "trade_sync",
        payload: {
          userId: myUserId,
          offers: [],
          accepted: false,
          isActive: true
        }
      });
    }
    toast.success("Painel de Troca em tempo real aberto!");
  }

  function cancelTrade() {
    setTradeSession({
      isActive: false,
      myOffers: [],
      otherOffers: [],
      myAccepted: false,
      otherAccepted: false,
      errorMessage: "",
      isExecuting: false
    });

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "trade_sync",
        payload: {
          userId: myUserId,
          isActive: false
        }
      });
    }
    toast.error("Troca cancelada.");
  }

  function broadcastOffers(myOffers: TradeOffer[], acceptedStatus: boolean) {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "trade_sync",
        payload: { userId: myUserId, offers: myOffers, accepted: acceptedStatus, isActive: true }
      });
    }
  }

  // Broadcast com retry — espera o canal WebSocket estar pronto (evita perda no mount)
  function broadcastWhenReady(payload: object, retries = 15, delayMs = 300) {
    if (channelRef.current) {
      channelRef.current.send({ type: "broadcast", event: "trade_sync", payload });
    } else if (retries > 0) {
      setTimeout(() => broadcastWhenReady(payload, retries - 1, delayMs), delayMs);
    }
  }

  function addStickerToOffer(codigo: string) {
    const cleanCode = codigo.toUpperCase().trim();
    if (!cleanCode) return;

    // Verificar se o usuário possui a figurinha
    const ownedQty = myInventory[cleanCode] || 0;
    if (ownedQty === 0) {
      toast.error(`Você não possui a figurinha ${cleanCode} no seu álbum.`);
      return;
    }

    // REGRA DE QUANTIDADE FRONTEIRA: Manter pelo menos 1 unidade residual
    if (ownedQty <= 1) {
      toast.error(`Você possui apenas 1 unidade de ${cleanCode}. A regra de trocas exige manter pelo menos 1 figurinha residual no álbum.`);
      return;
    }

    // Verificar se já está na lista de ofertas
    const alreadyOffered = tradeSession.myOffers.find(o => o.codigo === cleanCode);
    const offeredQty = alreadyOffered ? alreadyOffered.quantity : 0;

    // Validar se pode adicionar mais 1
    if (offeredQty + 1 >= ownedQty) {
      toast.error(`Bloqueio de Quantidade: Você possui ${ownedQty} unidades de ${cleanCode} e precisa manter pelo menos 1 no álbum.`);
      return;
    }

    let updatedOffers: TradeOffer[];
    if (alreadyOffered) {
      updatedOffers = tradeSession.myOffers.map(o => 
        o.codigo === cleanCode ? { ...o, quantity: o.quantity + 1 } : o
      );
    } else {
      updatedOffers = [...tradeSession.myOffers, { codigo: cleanCode, quantity: 1 }];
    }

    setTradeSession(prev => ({ ...prev, myOffers: updatedOffers, myAccepted: false, errorMessage: "" }));
    broadcastOffers(updatedOffers, false);
    setManualCode("");
  }

  function updateOfferQuantity(codigo: string, delta: number) {
    const offer = tradeSession.myOffers.find(o => o.codigo === codigo);
    if (!offer) return;

    const newQty = offer.quantity + delta;
    if (newQty <= 0) {
      removeStickerFromOffer(codigo);
      return;
    }

    const ownedQty = myInventory[codigo] || 0;
    
    // Validar limite de manter pelo menos 1 figurinha residual
    if (newQty >= ownedQty) {
      toast.error(`Bloqueio de Quantidade: Você possui ${ownedQty} unidades de ${codigo} e precisa manter pelo menos 1 no álbum.`);
      return;
    }

    const updatedOffers = tradeSession.myOffers.map(o => 
      o.codigo === codigo ? { ...o, quantity: newQty } : o
    );

    setTradeSession(prev => {
      const next = { ...prev, myOffers: updatedOffers, myAccepted: false, errorMessage: "" };
      broadcastOffers(updatedOffers, false);
      return next;
    });
  }

  function removeStickerFromOffer(codigo: string) {
    const updatedOffers = tradeSession.myOffers.filter(o => o.codigo !== codigo);

    setTradeSession(prev => {
      const next = { ...prev, myOffers: updatedOffers, myAccepted: false, errorMessage: "" };
      broadcastOffers(updatedOffers, false);
      return next;
    });
  }

  async function proposeTradeCall() {
    if (tradeSession.myOffers.length === 0 && tradeSession.otherOffers.length === 0) {
      toast.error("Adicione pelo menos uma figurinha para propor a troca!");
      return;
    }
    
    setTradeSession(prev => ({ ...prev, isExecuting: true }));
    
    try {
      const offeredCodes = tradeSession.myOffers.map(o => o.codigo);
      const wantedCodes = tradeSession.otherOffers.map(o => o.codigo);
      const allCodes = [...offeredCodes, ...wantedCodes];
      
      let stickersData: any[] = [];
      if (allCodes.length > 0) {
        const { data } = await supabase
          .from("stickers")
          .select("id, codigo")
          .in("codigo", allCodes);
        if (data) stickersData = data;
      }
      
      const codeToId: Record<string, number> = {};
      stickersData.forEach(s => {
        codeToId[s.codigo] = s.id;
      });
      
      const offeredIds = offeredCodes.map(c => codeToId[c]).filter(Boolean);
      const wantedIds = wantedCodes.map(c => codeToId[c]).filter(Boolean);
      
      const { data: newTrade, error } = await supabase
        .from("trades")
        .insert({
          initiator_id: myUserId,
          receiver_id: otherUser.id,
          offered_stickers: offeredIds,
          wanted_stickers: wantedIds,
          status: "pending"
        })
        .select("*")
        .single();
        
      if (error) throw error;
      
      toast.success("📞 Chamada de troca enviada!");
      
      // Fechar modal local do chat de figurinhas
      setTradeSession(prev => ({ ...prev, isActive: false, isExecuting: false }));
      
      // Disparar o modal global de chamada ativa
      window.dispatchEvent(new CustomEvent("trigger_outgoing_trade", { 
        detail: { trade: newTrade } 
      }));
      
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao propor troca: ${err.message || "Erro desconhecido"}`);
      setTradeSession(prev => ({ ...prev, isExecuting: false }));
    }
  }

  async function toggleAccept() {
    const nextAccept = !tradeSession.myAccepted;

    // Prevenir aceitar uma troca vazia!
    if (nextAccept && tradeSession.myOffers.length === 0 && tradeSession.otherOffers.length === 0) {
      toast.error("Adicione pelo menos uma figurinha na troca antes de aceitar!");
      return;
    }

    setTradeSession(prev => ({ ...prev, myAccepted: nextAccept, errorMessage: "" }));
    broadcastOffers(tradeSession.myOffers, nextAccept);

    if (nextAccept && tradeSession.otherAccepted) {
      const iAmExecutor = myUserId < otherUser.id;
      if (iAmExecutor) {
        await executeStickerExchange();
      }
      // Se não sou o executor, fico à espera do broadcast "completed" do outro lado
    }
  }

  async function executeStickerExchange() {
    setTradeSession(prev => ({ ...prev, isExecuting: true, errorMessage: "" }));
    
    // Chamar a procedure transacionada no banco de dados
    const { data, error } = await supabase.rpc("execute_sticker_trade", {
      p_conversation_id: conversationId,
      p_user_a_id: myUserId,
      p_user_b_id: otherUser.id,
      p_user_a_offers: tradeSession.myOffers,
      p_user_b_offers: tradeSession.otherOffers
    });

    if (error) {
      console.error("Erro na transação de troca:", error);
      
      // Cancelar aceites e expor o erro em tela
      setTradeSession(prev => {
        const next = { 
          ...prev, 
          isExecuting: false, 
          myAccepted: false, 
          otherAccepted: false,
          errorMessage: error.message || "Erro desconhecido ao processar a troca." 
        };
        broadcastOffers(prev.myOffers, false);
        return next;
      });
      toast.error("Falha ao concluir troca. Verifique o alerta no painel.");
    } else {
      toast.success("🏆 Troca realizada e álbuns atualizados com sucesso!");

      // BUG2 FIX: Notificar o outro lado para fechar o painel (ele não executa, só aguarda)
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "trade_sync",
          payload: { userId: myUserId, isActive: false, completed: true }
        });
      }

      setTradeSession({
        isActive: false, myOffers: [], otherOffers: [],
        myAccepted: false, otherAccepted: false, errorMessage: "", isExecuting: false
      });

      loadInventory();
    }
  }

  // --- FIM DOS MÉTODOS DE TROCA ---

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const content = input.trim();
    setInput("");
    
    // Interceptar comando de troca
    if (content.toLowerCase() === "/troca") {
      startTrade();
      return;
    }

    const newId = crypto.randomUUID();
    const optimisticMsg: Message = {
      id: newId as any,
      conversation_id: conversationId,
      sender_id: myUserId,
      content,
      read: false,
      created_at: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, optimisticMsg]);

    const { error } = await supabase.from("messages").insert({
      id: newId,
      conversation_id: conversationId,
      sender_id: myUserId,
      content,
    });

    if (error) {
      console.error("Failed to save message:", error);
      setMessages((prev) => prev.filter((m) => m.id !== newId));
      return;
    }

    stopTyping();
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: isMobile ? "100dvh" : "100%", maxWidth: isMobile ? "100%" : 800,
      margin: "0 auto", width: "100%", background: "var(--bg-main)", position: "relative"
    }}>
      {/* Header do Chat */}
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
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{otherUser.nome}</p>
              <div style={{ 
                width: 6, height: 6, borderRadius: "50%", 
                background: connStatus === "connected" ? "var(--success)" : (connStatus === "connecting" ? "var(--warning, #f5a623)" : "var(--danger)"),
                boxShadow: connStatus === "connected" ? "0 0 6px var(--success)" : "none"
              }} title={`Status: ${connStatus}`} />
            </div>
            <p style={{ fontSize: 12, color: otherUser.is_online ? "var(--success)" : "var(--text-muted)", margin: 0 }}>
              {mounted 
                ? (otherUser.is_online ? "Online agora" : `Visto há ${timeAgo(otherUser.last_seen)}`)
                : "Carregando..."}
            </p>
          </div>
        </div>
        
        {/* Ações do Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Botão de Trocar Super Premium */}
          <button 
            onClick={startTrade}
            style={{ 
              background: "var(--gradient-primary)", border: "none", color: "#fff", 
              padding: isMobile ? "8px 12px" : "8px 16px", borderRadius: 12, cursor: "pointer", 
              fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
              boxShadow: "0 4px 15px rgba(0,174,239,0.2)"
            }}
          >
            <Shuffle size={14} />
            {!isMobile && "Propor Troca"}
          </button>
          
          <button style={{ background: "transparent", border: "none", color: "var(--text-muted)", padding: 8, cursor: "pointer" }}>
            <Info size={20} />
          </button>
          <button style={{ background: "transparent", border: "none", color: "var(--text-muted)", padding: 8, cursor: "pointer" }}>
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* ÁREA DA MODAL / OVERLAY DE NEGOCIAÇÃO EM TEMPO REAL */}
      <AnimatePresence>
        {tradeSession.isActive && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "absolute", top: isMobile ? 68 : 77, left: 0, right: 0, bottom: 0,
              background: "rgba(7, 17, 31, 0.98)", backdropFilter: "blur(20px)",
              zIndex: 50, padding: isMobile ? 12 : 24, display: "flex", flexDirection: "column",
              borderTop: "1px solid rgba(255, 255, 255, 0.05)"
            }}
          >
            {/* Header da modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 12 : 20 }}>
              <div>
                <h3 style={{ fontSize: isMobile ? 15 : 18, fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                  <Shuffle size={16} style={{ color: "var(--primary)" }} /> Negociação em Tempo Real
                </h3>
                {!isMobile && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                    Adicione as figurinhas que deseja oferecer e veja o que {otherUser.nome.split(" ")[0]} está oferecendo.
                  </p>
                )}
              </div>
              <button 
                onClick={cancelTrade}
                style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "var(--text-sec)", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Alertas de Erro do Banco de Dados */}
            {tradeSession.errorMessage && (
              <div style={{
                background: "rgba(255,77,106,0.1)", border: "1px solid rgba(255,77,106,0.2)",
                padding: "12px 16px", borderRadius: 12, display: "flex", gap: 10, alignItems: "center",
                color: "var(--danger)", fontSize: 13, marginBottom: 16
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{tradeSession.errorMessage}</span>
              </div>
            )}

            {/* Colunas Duplas de Negociação */}
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: isMobile ? 12 : 20,
              flex: 1,
              overflowY: "auto",
              marginBottom: 16
            }}>
              
              {/* Painel Esquerdo: Minhas Ofertas */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: isMobile ? 12 : 18, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", margin: 0 }}>Tu Ofereces</h4>
                  {tradeSession.myAccepted ? (
                    <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(46,204,113,0.15)", color: "#2ecc71", padding: "4px 8px", borderRadius: 100 }}>ACEITE PRONTO</span>
                  ) : (
                    <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", padding: "4px 8px", borderRadius: 100 }}>EM CONSTRUÇÃO</span>
                  )}
                </div>

                {/* Seletor Rápido de Duplicadas */}
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Minhas figurinhas Repetidas:</p>
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6 }}>
                    {myDuplicates.length === 0 ? (
                      <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>Nenhuma figurinha repetida no seu álbum.</span>
                    ) : (
                      myDuplicates.map(item => {
                        const inOffer = tradeSession.myOffers.find(o => o.codigo === item.codigo);
                        const offerQty = inOffer ? inOffer.quantity : 0;
                        const available = item.quantity - offerQty - 1; // Deve sobrar pelo menos 1

                        return (
                          <button
                            key={item.codigo}
                            disabled={available <= 0}
                            onClick={() => addStickerToOffer(item.codigo)}
                            style={{
                              flexShrink: 0, padding: "5px 10px", borderRadius: 8,
                              background: available <= 0 ? "rgba(255,255,255,0.02)" : "var(--input-bg)",
                              color: available <= 0 ? "rgba(255,255,255,0.1)" : "var(--text-main)",
                              border: "1px solid rgba(255,255,255,0.08)", cursor: available <= 0 ? "default" : "pointer",
                              fontSize: 11, fontWeight: 700
                            }}
                          >
                            {item.codigo} <span style={{ color: "var(--warning)", marginLeft: 2 }}>x{item.quantity}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Input Manual Opcional */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <input
                    type="text"
                    placeholder="Código (Ex: BRA-1)"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    style={{ flex: 1, background: "var(--input-bg)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "6px 10px", color: "var(--text-main)", fontSize: 12, outline: "none" }}
                  />
                  <button
                    onClick={() => addStickerToOffer(manualCode)}
                    style={{ background: "var(--primary)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Lista de figurinhas oferecidas */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, minHeight: 120 }}>
                  {tradeSession.myOffers.length === 0 ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 12, border: "1px dashed rgba(255,255,255,0.03)", borderRadius: 12, minHeight: 80 }}>
                      Nenhuma figurinha oferecida.
                    </div>
                  ) : (
                    tradeSession.myOffers.map(offer => {
                      const maxQty = (myInventory[offer.codigo] || 0) - 1; // restringe manter pelo menos 1
                      return (
                        <div key={offer.codigo} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", padding: "8px 12px", borderRadius: 10 }}>
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-main)" }}>{offer.codigo}</span>
                            <span style={{ fontSize: 9, color: "var(--text-muted)", marginLeft: 6 }}>Disponível: {maxQty + 1}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--input-bg)", borderRadius: 6, padding: "2px 4px" }}>
                              <button onClick={() => updateOfferQuantity(offer.codigo, -1)} style={{ background: "transparent", border: "none", color: "var(--text-sec)", cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>-</button>
                              <span style={{ fontSize: 12, fontWeight: 700, minWidth: 12, textAlign: "center", color: "var(--text-main)" }}>{offer.quantity}</span>
                              <button onClick={() => updateOfferQuantity(offer.codigo, 1)} style={{ background: "transparent", border: "none", color: "var(--text-sec)", cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>+</button>
                            </div>
                            <button onClick={() => removeStickerFromOffer(offer.codigo)} style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Painel Direito: Ofertas de Outro Colecionador */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: isMobile ? 12 : 18, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{otherUser.nome.split(" ")[0]} Oferece</h4>
                  {tradeSession.otherAccepted ? (
                    <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(46,204,113,0.15)", color: "#2ecc71", padding: "4px 8px", borderRadius: 100 }}>ACEITE PRONTO</span>
                  ) : (
                    <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", padding: "4px 8px", borderRadius: 100 }}>EM CONSTRUÇÃO</span>
                  )}
                </div>

                {/* Lista de figurinhas oferecidas pelo outro */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, minHeight: 120 }}>
                  {tradeSession.otherOffers.length === 0 ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 12, border: "1px dashed rgba(255,255,255,0.03)", borderRadius: 12, minHeight: 80 }}>
                      Nenhuma figurinha oferecida por {otherUser.nome.split(" ")[0]} ainda.
                    </div>
                  ) : (
                    tradeSession.otherOffers.map(offer => (
                      <div key={offer.codigo} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-main)" }}>{offer.codigo}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--warning)", background: "rgba(245,183,0,0.1)", padding: "3px 8px", borderRadius: 6 }}>
                          Qtd: {offer.quantity}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Barra Inferior da Modal: Ações e Aceites */}
            <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: 16, display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              {/* Status de Confirmação das Duas Partes */}
              <div style={{ display: "flex", gap: 16, width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "space-around" : "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: tradeSession.myAccepted ? "var(--success)" : "rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {tradeSession.myAccepted && <Check size={10} style={{ color: "#000" }} />}
                  </div>
                  <span style={{ fontSize: 13, color: "var(--text-sec)" }}>Eu</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: tradeSession.otherAccepted ? "var(--success)" : "rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {tradeSession.otherAccepted && <Check size={10} style={{ color: "#000" }} />}
                  </div>
                  <span style={{ fontSize: 13, color: "var(--text-sec)" }}>{otherUser.nome.split(" ")[0]}</span>
                </div>
              </div>

              {/* Botões de Ação do Painel */}
              <div style={{ display: "flex", gap: 10, width: isMobile ? "100%" : "auto" }}>
                <button
                  onClick={cancelTrade}
                  style={{
                    flex: isMobile ? 1 : "none",
                    background: "rgba(255,77,106,0.1)", border: "1px solid rgba(255,77,106,0.2)",
                    color: "var(--danger)", padding: "12px 24px", borderRadius: 14,
                    fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  Recusar / Sair
                </button>
                <button
                  onClick={proposeTradeCall}
                  disabled={tradeSession.isExecuting}
                  style={{
                    flex: isMobile ? 1 : "none",
                    background: "var(--warning)", color: "#000",
                    border: "none", padding: "12px 24px", borderRadius: 14,
                    fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: "0 8px 24px -4px rgba(245,166,35,0.3)",
                    transition: "all 0.3s ease"
                  }}
                >
                  <PhoneCall size={14} /> Chamada
                </button>
                <button
                  onClick={toggleAccept}
                  disabled={tradeSession.isExecuting}
                  style={{
                    flex: isMobile ? 1 : "none",
                    background: tradeSession.isExecuting
                      ? "rgba(255,255,255,0.1)"
                      : tradeSession.myAccepted
                        ? "var(--success)"
                        : "var(--gradient-primary)",
                    color: "#fff",
                    border: "none", padding: "12px 24px", borderRadius: 14,
                    fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: tradeSession.myAccepted
                      ? "0 8px 24px -4px rgba(46,204,113,0.3)"
                      : "0 8px 24px -4px rgba(0,174,239,0.3)",
                    transition: "all 0.3s ease"
                  }}
                >
                  {tradeSession.isExecuting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Efetuando...
                    </>
                  ) : tradeSession.myAccepted ? (
                    <>
                      <Check size={14} />
                      Desmarcar Aceite
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      Aceitar Proposta
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Área de Mensagens do Chat */}
      <div 
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: isMobile ? "16px 12px" : "32px 24px", display: "flex", flexDirection: "column", gap: 16 }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: "20%" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚽</div>
            <h3 style={{ color: "var(--text-main)", fontSize: 20, fontWeight: 700 }}>Inicia a Troca!</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 15 }}>Diz olá ao {otherUser.nome.split(" ")[0]}, combine onde se encontrar ou use o comando <strong>/troca</strong> para trocar figurinhas!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === myUserId;
            // Visual premium para logs de recibo de trocas automáticas do sistema
            const isSystemTradeReceipt = msg.content.includes("🔄 TROCA DE FIGURINHAS CONCLUÍDA!");

            if (isSystemTradeReceipt) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    alignSelf: "center", width: "90%", margin: "16px 0",
                    background: "linear-gradient(135deg, rgba(46,204,113,0.1), rgba(0,174,239,0.05))",
                    border: "1px solid rgba(46,204,113,0.25)",
                    borderRadius: 24, padding: "20px 24px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                    position: "relative", overflow: "hidden"
                  }}
                >
                  <div style={{
                    position: "absolute", top: "-20%", right: "-10%", width: 100, height: 100,
                    background: "#2ecc71", opacity: 0.1, filter: "blur(30px)", borderRadius: "50%"
                  }} />
                  <pre style={{
                    color: "var(--text-main)", fontSize: 13, lineHeight: 1.6,
                    margin: 0, fontFamily: "inherit", whiteSpace: "pre-wrap"
                  }}>
                    {msg.content}
                  </pre>
                  <span style={{ display: "block", fontSize: 10, color: "var(--text-muted)", marginTop: 12, textAlign: "right" }}>
                    {mounted ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "..."} · Sistema de Segurança Swap26
                  </span>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                style={{
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  maxWidth: isMobile ? "85%" : "70%",
                  width: "fit-content",
                  minWidth: 0,
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
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  minWidth: 0,
                  boxShadow: isMe ? "0 4px 15px rgba(0,174,239,0.2)" : "0 4px 15px rgba(0,0,0,0.1)",
                  border: isMe ? "none" : "1px solid rgba(255,255,255,0.05)"
                }}>
                  {msg.content}
                </div>
                <span style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, padding: "0 4px" }}>
                  {mounted ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "..."}
                  {isMe && msg.read && " · Lido"}
                </span>
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
 
      {/* Input de Mensagem */}
      <div style={{
        padding: isMobile ? "12px" : "24px", background: "var(--bg-main-transparent)",
        backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        paddingBottom: `max(${isMobile ? "12px" : "24px"}, env(safe-area-inset-bottom))`
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
              placeholder="Mensagem ou /troca..."
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
