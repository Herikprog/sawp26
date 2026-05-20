import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const isEmailAdmin = user?.email?.toLowerCase() === "bragawork01@gmail.com";
  const admin = await createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!isEmailAdmin && !profile?.is_admin) return null;
  return { user, admin };
}

// GET — listar tickets
export async function GET(request: Request) {
  const ctx = await verifyAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "open";

  const { data: tickets, error } = await ctx.admin
    .from("support_tickets")
    .select("*, profiles(nome, cidade, plano)")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tickets });
}

// PATCH — responder ou fechar ticket
export async function PATCH(request: Request) {
  const ctx = await verifyAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id, admin_reply, user_id, status } = await request.json();

  const updatePayload: any = {
    updated_at: new Date().toISOString(),
  };

  if (admin_reply !== undefined) {
    updatePayload.admin_reply = admin_reply;
    updatePayload.status = "replied";
    updatePayload.replied_at = new Date().toISOString();
  }

  if (status !== undefined) {
    updatePayload.status = status;
  }

  const { error } = await ctx.admin
    .from("support_tickets")
    .update(updatePayload)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Se tiver resposta, notificar o utilizador via social_notifications
  if (admin_reply && user_id) {
    try {
      await ctx.admin.from("social_notifications").insert({
        user_id,
        actor_id: ctx.user.id,
        type: "admin_reply",
        content: `A tua mensagem de suporte foi respondida pelo administrador: "${admin_reply.substring(0, 100)}${admin_reply.length > 100 ? "..." : ""}"`,
      });
    } catch (err) {
      // não bloquear se falhar
    }
  }

  return NextResponse.json({ success: true, message: "Ticket atualizado com sucesso." });
}

// POST — utilizador criar ticket (não precisa de ser admin)
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, subject, message } = await request.json();
  if (!subject || !message) return NextResponse.json({ error: "Assunto e mensagem são obrigatórios." }, { status: 400 });

  const { data, error } = await supabase.from("support_tickets").insert({
    user_id: user.id,
    type: type || "support",
    subject,
    message,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ticket: data });
}
