import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { validateAdminAccess, logAdminAction } from "@/lib/rbac";
import { checkAdminActionRateLimit, createRateLimitHeaders } from "@/lib/rate-limit";

// GET — listar tickets + denúncias (support_tickets + user_reports + post_reports unificados)
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminCtx = await validateAdminAccess(user?.id);
  
  if (!adminCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  
  if (!adminCtx.permissions.has("perm_tickets")) {
    return NextResponse.json({ error: "Sem permissão para visualizar tickets de suporte." }, { status: 403 });
  }

  // Rate Limiting
  const limit = checkAdminActionRateLimit(adminCtx.userId);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: createRateLimitHeaders(limit) });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "open";
  const adminClient = await createAdminClient();

  // 1. Buscar support_tickets (origem: página de suporte)
  const { data: tickets, error: ticketError } = await adminClient
    .from("support_tickets")
    .select("*, profiles(nome, cidade, plano)")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (ticketError) return NextResponse.json({ error: ticketError.message }, { status: 500 });

  // 2. Buscar user_reports (origem: botão Denunciar no perfil/chat) — apenas se status === "open"
  let mappedReports: any[] = [];
  if (status === "open") {
    const { data: reports } = await adminClient
      .from("user_reports")
      .select("*, reporter:profiles!user_reports_reporter_id_fkey(nome, cidade, plano), reported:profiles!user_reports_reported_id_fkey(nome)")
      .order("created_at", { ascending: false });

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

  // 3. Buscar post_reports (origem: denúncia de publicação no feed)
  let mappedPostReports: any[] = [];
  const { data: pReports } = await adminClient
    .from("post_reports")
    .select(`
      id, reporter_id, post_id, reason, details, status, admin_reply, created_at,
      posts (content, profiles!posts_user_id_fkey (nome)),
      reporter:profiles!reporter_id (nome, cidade, plano)
    `)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (pReports) {
    mappedPostReports = pReports.map((r: any) => ({
      id: `post_report_${r.id}`,
      user_id: r.reporter_id,
      type: "post_report",
      subject: `Denúncia de Post: ${r.reason} → Autor: ${r.posts?.profiles?.nome || "Desconhecido"}`,
      message: r.details || "(Sem detalhes adicionais)",
      status: r.status,
      admin_reply: r.admin_reply,
      created_at: r.created_at,
      profiles: r.reporter || { nome: "Desconhecido", cidade: "", plano: "free" },
      _source: "post_reports",
      _raw_id: r.id,
      _reported_name: r.posts?.profiles?.nome || "Desconhecido",
      _post_content: r.posts?.content || "(Conteúdo não disponível)",
    }));
  }

  const allTickets = [...(tickets || []), ...mappedReports, ...mappedPostReports];

  return NextResponse.json({ tickets: allTickets });
}

// PATCH — responder ou fechar ticket
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminCtx = await validateAdminAccess(user?.id);
  
  if (!adminCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  if (!adminCtx.permissions.has("perm_tickets")) {
    return NextResponse.json({ error: "Sem permissão para responder a tickets de suporte." }, { status: 403 });
  }

  // Rate Limiting
  const limit = checkAdminActionRateLimit(adminCtx.userId);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: createRateLimitHeaders(limit) });
  }

  const { id, admin_reply, user_id, status } = await request.json();
  const adminClient = await createAdminClient();

  // Proteger tickets/denúncias criados pelo bragawork01@gmail.com
  try {
    if (!String(id).startsWith("report_") && !String(id).startsWith("post_report_")) {
      const { data: ticket } = await adminClient.from("support_tickets").select("user_id").eq("id", id).single();
      if (ticket) {
        const { data: targetUser } = await adminClient.auth.admin.getUserById(ticket.user_id);
        if (targetUser?.user?.email?.toLowerCase() === "bragawork01@gmail.com" && adminCtx.email !== "bragawork01@gmail.com") {
          return NextResponse.json({ error: "Não é permitido alterar ou fechar tickets do Administrador Principal." }, { status: 403 });
        }
      }
    } else {
      const { data: targetUser } = await adminClient.auth.admin.getUserById(user_id);
      if (targetUser?.user?.email?.toLowerCase() === "bragawork01@gmail.com" && adminCtx.email !== "bragawork01@gmail.com") {
        return NextResponse.json({ error: "Não é permitido alterar ou responder a denúncias criadas pelo Administrador Principal." }, { status: 403 });
      }
    }
  } catch (_) {}

  // Se for um post report
  if (String(id).startsWith("post_report_")) {
    const rawId = String(id).replace("post_report_", "");
    const updatePayload: any = { replied_at: new Date().toISOString() };

    if (admin_reply !== undefined) {
      updatePayload.admin_reply = admin_reply;
      updatePayload.status = "replied";
    }

    if (status !== undefined) {
      updatePayload.status = status;
    }

    const { error } = await adminClient.from("post_reports").update(updatePayload).eq("id", rawId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    await logAdminAction(adminCtx.userId, "reply_post_report", null, { reportId: rawId, status }, "success");

    if (admin_reply && user_id) {
      try {
        await adminClient.from("social_notifications").insert({
          user_id, actor_id: adminCtx.userId, type: "admin_reply",
          content: `A tua denúncia de publicação foi respondida pelo administrador: "${admin_reply.substring(0, 100)}${admin_reply.length > 100 ? "..." : ""}"`,
        });
      } catch (_) {}
    }

    return NextResponse.json({ success: true, message: "Resposta de denúncia de post registada." });
  }

  // Se for um user report
  if (String(id).startsWith("report_")) {
    await logAdminAction(adminCtx.userId, "reply_user_report", null, { reportId: id }, "success");
    if (admin_reply && user_id) {
      try {
        await adminClient.from("social_notifications").insert({
          user_id, actor_id: adminCtx.userId, type: "admin_reply",
          content: `A tua denúncia foi analisada pelo administrador: "${admin_reply.substring(0, 120)}${admin_reply.length > 120 ? "..." : ""}"`,
        });
      } catch (_) {}
    }
    return NextResponse.json({ success: true, message: "Resposta registada." });
  }

  const updatePayload: any = { updated_at: new Date().toISOString() };

  if (admin_reply !== undefined) {
    updatePayload.admin_reply = admin_reply;
    updatePayload.status = "replied";
    updatePayload.replied_at = new Date().toISOString();
  }

  if (status !== undefined) {
    updatePayload.status = status;
  }

  const { error } = await adminClient.from("support_tickets").update(updatePayload).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  await logAdminAction(adminCtx.userId, "reply_ticket", null, { ticketId: id, status }, "success");

  if (admin_reply && user_id) {
    try {
      await adminClient.from("social_notifications").insert({
        user_id, actor_id: adminCtx.userId, type: "admin_reply",
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
