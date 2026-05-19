import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = await createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return null;
  return { user, admin };
}

// GET — listar utilizadores
export async function GET(request: Request) {
  const ctx = await verifyAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  let query = ctx.admin
    .from("profiles")
    .select("id, nome, cidade, plano, is_admin, is_banned, suspended_until, total_trocas, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (search) {
    query = query.or(`nome.ilike.%${search}%,cidade.ilike.%${search}%`);
  }

  const { data: users, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users });
}

// PATCH — executar ação sobre um utilizador
export async function PATCH(request: Request) {
  const ctx = await verifyAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { action, userId, days } = await request.json();
  const admin = ctx.admin;
  const adminId = ctx.user.id;

  let update: any = {};
  let logAction = action;

  switch (action) {
    case "ban":
      update = { is_banned: true };
      break;
    case "unban":
      update = { is_banned: false, suspended_until: null };
      break;
    case "suspend":
      const until = new Date();
      until.setDate(until.getDate() + (days || 7));
      update = { suspended_until: until.toISOString() };
      logAction = `suspend_${days}d`;
      break;
    case "set_premium":
      update = { plano: "premium" };
      break;
    case "set_free":
      update = { plano: "free" };
      break;
    case "set_admin":
      update = { is_admin: true };
      break;
    case "remove_admin":
      update = { is_admin: false };
      break;
    default:
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }

  const { error } = await admin.from("profiles").update(update).eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Registar no audit log
  await admin.from("admin_audit_log").insert({
    admin_id: adminId,
    action: logAction,
    target_user: userId,
    metadata: { update }
  });

  const messages: Record<string, string> = {
    ban: "Utilizador banido com sucesso.",
    unban: "Ban removido com sucesso.",
    suspend: `Utilizador suspenso por ${days} dia(s).`,
    set_premium: "Plano Premium concedido.",
    set_free: "Plano revertido para Free.",
    set_admin: "Permissão de administrador concedida.",
    remove_admin: "Permissão de administrador removida.",
  };

  return NextResponse.json({ success: true, message: messages[action] || "Ação concluída." });
}

// DELETE — apagar conta
export async function DELETE(request: Request) {
  const ctx = await verifyAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { userId } = await request.json();

  // Apagar o utilizador diretamente via Admin API do Supabase
  const { error } = await ctx.admin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Registar no audit log
  await ctx.admin.from("admin_audit_log").insert({
    admin_id: ctx.user.id,
    action: "delete_user",
    target_user: userId,
    metadata: {}
  });

  return NextResponse.json({ success: true, message: "Conta apagada com sucesso." });
}
