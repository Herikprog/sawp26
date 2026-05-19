import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import ChatWindow from "@/components/chat/ChatWindow";
import type { Message, Profile } from "@/types";

interface Props {
  params: { id: string };
}

export default async function ChatRoomPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch conversation and check if user is a participant
  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .select(`
      id,
      user_a:profiles!user_a_id (*),
      user_b:profiles!user_b_id (*)
    `)
    .eq("id", id)
    .single();

  if (convErr || !conv) return notFound();
  
  const isParticipant = (conv as any).user_a.id === user.id || (conv as any).user_b.id === user.id;
  if (!isParticipant) return redirect("/chat");

  const otherUser = ((conv as any).user_a.id === user.id ? (conv as any).user_b : (conv as any).user_a) as Profile;

  // Fetch initial messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(100);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <ChatWindow
        conversationId={id}
        initialMessages={(messages as Message[]) ?? []}
        myUserId={user.id}
        otherUser={otherUser}
      />
    </div>
  );
}
