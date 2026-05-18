"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PhoneCall, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  targetUserId: string;
}

export default function TradeCallButton({ targetUserId }: Props) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleStartCall() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Utilizador não autenticado!");
        return;
      }

      // 1. Obter repetidas e obtidas de ambos para calcular o match real
      const [myStickersRes, targetStickersRes] = await Promise.all([
        supabase.from("user_stickers").select("sticker_id, quantity").eq("user_id", user.id),
        supabase.from("user_stickers").select("sticker_id, quantity").eq("user_id", targetUserId)
      ]);

      const myStickers = (myStickersRes.data || []) as Array<{ sticker_id: number; quantity: number }>;
      const targetStickers = (targetStickersRes.data || []) as Array<{ sticker_id: number; quantity: number }>;

      // Mapear as figurinhas obtidas
      const myObtainedIds = new Set<number>(myStickers.map((s: { sticker_id: number }) => s.sticker_id));
      const targetObtainedIds = new Set<number>(targetStickers.map((s: { sticker_id: number }) => s.sticker_id));

      // Mapear repetidas (quantity > 1)
      const myDuplicates = myStickers.filter((s: { quantity: number }) => s.quantity > 1).map((s: { sticker_id: number }) => s.sticker_id);
      const targetDuplicates = targetStickers.filter((s: { quantity: number }) => s.quantity > 1).map((s: { sticker_id: number }) => s.sticker_id);

      // Calcular o cruzamento:
      // O que eu tenho repetido e o outro precisa
      const offeredIds = myDuplicates.filter((id: number) => !targetObtainedIds.has(id));
      // O que o outro tem repetido e eu preciso
      const wantedIds = targetDuplicates.filter((id: number) => !myObtainedIds.has(id));

      if (offeredIds.length === 0 && wantedIds.length === 0) {
        toast.error("Não existem figurinhas compatíveis para troca com este utilizador!");
        return;
      }

      // 2. Inserir proposta pendente
      const { data: newTrade, error } = await supabase
        .from("trades")
        .insert({
          initiator_id: user.id,
          receiver_id: targetUserId,
          offered_stickers: offeredIds,
          wanted_stickers: wantedIds,
          status: "pending"
        })
        .select("*")
        .single();

      if (error) throw error;

      toast.success("📞 Chamada de troca direta iniciada!");

      // 3. Disparar evento global para abrir a tela de "A chamar..."
      window.dispatchEvent(new CustomEvent("trigger_outgoing_trade", { 
        detail: { trade: newTrade } 
      }));
    } catch (e: any) {
      console.error(e);
      toast.error(`Erro ao iniciar chamada: ${e.message || "Erro desconhecido"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleStartCall}
      disabled={loading}
      style={{
        width: "100%",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        background: "linear-gradient(135deg, #f5b700 0%, #e0a300 100%)", color: "#1A1100", fontWeight: 800, fontSize: 15,
        padding: "16px 24px", borderRadius: 16, border: "none", cursor: "pointer",
        boxShadow: "0 8px 24px -4px rgba(245,183,0,0.3)", transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
      }}
      className="hover:scale-105"
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <PhoneCall size={18} />
      )}
      Ligar para Trocar
    </button>
  );
}
