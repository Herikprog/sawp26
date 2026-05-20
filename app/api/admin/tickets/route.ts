import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

async function verifyAdmin() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const isEmailAdmin = user?.email?.toLowerCase() === "bragawork01@gmail.com";
    const admin = await createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin, perm_tickets")
      .eq("id", user.id)
      .single();
    if (!isEmailAdmin && !profile?.is_admin) return null;

    const permissions = {
      perm_tickets: isEmailAdmin ? true : !!profile?.perm_tickets,
    };

    return { user, admin, permissions, isSuperAdmin: isEmailAdmin };
  } catch (err: any) {
    console.error("[verifyAdmin] error:", err.message);
    return null;
  }
}

// GET — listar tickets + denúncias (support_tickets + user_reports unificados)
export async function GET(request: Request) {
  const ctx = await verifyAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  
  if (!ctx.permissions.perm_tickets) {
    return NextResponse.json({ error: "Sem permissão para visualizar tickets de suporte." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "open";

  // 1. Buscar support_tickets (origem: página de suporte)
  const { data: tickets, error: ticketError } = await ctx.admin
    .from("support_tickets")
    .select("*, profiles(nome, cidade, plano)")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (ticketError) return NextResponse.json({ error: ticketError.message }, { status: 500 });

  // 2. Buscar user_reports (origem: botão Denunciar no perfil/chat) — apenas se status === "open"
  let mappedReports: any[] = [];
  if (status === "open") {
    const { data: reports } = await ctx.admin
      .from("user_reports")
      .select("*, reporter:profiles!user_reports_reporter_id_fkey(nome, cidade, plano), reported:profiles!user_reports_reported_id_fkey(nome)")
      .order("created_at", { ascending: false });

    // Mapear user_reports para o mesmo formato de support_tickets
    if (reports) {
      mappedReports = reports.map((r: any) => ({
        id: `report_${r.id}`,
        user_id: r.reporter_id,
        type: "report",
        subject: `Denúncia: ${r.reason.replace(/_/g, " ")} → ${r.reported?.nome || "Desconhecido"}`,
        message: r.details || "(Sem detalhes adicionais)",
        status: "open",
        admin_reply: null,
        created_at: r.created_at,
        profiles: r.reporter || { nome: "Desconhecido", cidade: "", plano: "free" },
        _source: "user_reports",
        _raw_id: r.id,
        _reported_name: r.reported?.nome,
      }));
    }
  }

  // Unir as duas fontes (tickets nativos primeiro, depois reports do botão)
  const allTickets = [...(tickets || []), ...mappedReports];

  return NextResponse.json({ tickets: allTickets });
}

// PATCH — responder ou fechar ticket
export async function PATCH(request: Request) {
  const ctx = await verifyAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  if (!ctx.permissions.perm_tickets) {
    return NextResponse.json({ error: "Sem permissão para responder a tickets de suporte." }, { status: 403 });
  }

  const { id, admin_reply, user_id, status } = await request.json();

  // Proteger tickets/denúncias criados pelo bragawork01@gmail.com
  try {
    if (!String(id).startsWith("report_")) {
      const { data: ticket } = await ctx.admin
        .from("support_tickets")
        .select("user_id")
        .eq("id", id)
        .single();

      if (ticket) {
        const { data: targetUser } = await ctx.admin.auth.admin.getUserById(ticket.user_id);
        if (targetUser?.user?.email?.toLowerCase() === "bragawork01@gmail.com") {
          return NextResponse.json({ error: "Não é permitido alterar ou fechar tickets do Administrador Principal." }, { status: 403 });
        }
      }
    } else {
      const { data: targetUser } = await ctx.admin.auth.admin.getUserById(user_id);
      if (targetUser?.user?.email?.toLowerCase() === "bragawork01@gmail.com") {
        return NextResponse.json({ error: "Não é permitido alterar ou responder a denúncias criadas pelo Administrador Principal." }, { status: 403 });
      }
    }
  } catch (_) {}

  // Se for um report do botão de denúncia (id começa com "report_"), ignorar update na tabela support_tickets
  if (String(id).startsWith("report_")) {
    if (admin_reply && user_id) {
      try {
        await ctx.admin.from("social_notifications").insert({
          user_id,
          actor_id: ctx.user.id,
          type: "admin_reply",
          content: `A tua denúncia foi analisada pelo administrador: "${admin_reply.substring(0, 120)}${admin_reply.length > 120 ? "..." : ""}"`,
        });
      } catch (_) {}
    }
    return NextResponse.json({ success: true, message: "Resposta registada." });
  }

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

  // Notificar o utilizador via social_notifications
  if (admin_reply && user_id) {
    try {
      await ctx.admin.from("social_notifications").insert({
        user_id,
        actor_id: ctx.user.id,
        type: "admin_reply",
        content: `A tua mensagem de suporte foi respondida pelo administrador: "${admin_reply.substring(0, 100)}${admin_reply.length > 100 ? "..." : ""}"`,
      });
    } catch (_) {}
  }

  return NextResponse.json({ success: true, message: "Ticket atualizado com sucesso." });
}

// POST — utilizador criar ticket de suporte (não precisa ser admin)
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
