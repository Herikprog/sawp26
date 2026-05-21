import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { validateAdminAccess, logAdminAction } from "@/lib/rbac";
import { checkAdminActionRateLimit, createRateLimitHeaders } from "@/lib/rate-limit";
import { adminUserActionSchema, validateRequest } from "@/lib/validation-schemas";

// GET — listar utilizadores
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminCtx = await validateAdminAccess(user?.id);
  
  if (!adminCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  // Rate Limiting
  const limit = checkAdminActionRateLimit(adminCtx.userId);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: createRateLimitHeaders(limit) });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const adminClient = await createAdminClient();

  let query = adminClient
    .from("profiles")
    .select("id, nome, cidade, plano, is_admin, is_banned, suspended_until, total_trocas, created_at, perm_ban, perm_suspend, perm_delete_user, perm_grant_admin, perm_grant_premium, perm_impersonate, perm_tickets, ban_reason, suspend_reason")
    .order("created_at", { ascending: false })
    .limit(100);

  if (search) {
    query = query.or(`nome.ilike.%${search}%,cidade.ilike.%${search}%`);
  }

  const { data: users, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users });
}

// PATCH — executar ação sobre um utilizador com controle de permissões
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminCtx = await validateAdminAccess(user?.id);
  
  if (!adminCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  // Rate Limiting
  const limit = checkAdminActionRateLimit(adminCtx.userId);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: createRateLimitHeaders(limit) });
  }

  const { data: inputData, error: validationError } = await validateRequest<any>(request, adminUserActionSchema);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const { action, userId, days, permissions: inputPermissions, reason } = inputData;
  const adminClient = await createAdminClient();

  // 1. Proteger a conta do Administrador Principal
  try {
    const { data: targetUser } = await adminClient.auth.admin.getUserById(userId);
    const targetEmail = targetUser?.user?.email?.toLowerCase();
    if (targetEmail === "bragawork01@gmail.com" && adminCtx.email !== "bragawork01@gmail.com") {
      return NextResponse.json({ error: "Não é permitido alterar ou remover privilégios do Administrador Principal." }, { status: 403 });
    }
  } catch (_) {}

  // 2. Controlar permissões com base na ação solicitada
  if (action === "impersonate") {
    if (!adminCtx.permissions.has("perm_impersonate")) {
      return NextResponse.json({ error: "Sem permissão para entrar em contas." }, { status: 403 });
    }

    try {
      const { data: targetUser, error: userError } = await adminClient.auth.admin.getUserById(userId);
      if (userError || !targetUser.user?.email) {
        return NextResponse.json({ error: "Utilizador não encontrado ou sem email de login." }, { status: 400 });
      }
      
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: targetUser.user.email,
        options: {
          redirectTo: `${new URL(request.url).origin}/auth/session`
        }
      });
      
      if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });
      
      await logAdminAction(adminCtx.userId, "impersonate", userId, { target_email: targetUser.user.email }, "success");
      
      return NextResponse.json({
        success: true,
        message: "Link de personificação gerado com sucesso.",
        action_link: linkData.properties.action_link
      });
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "Erro ao gerar link de acesso." }, { status: 500 });
    }
  }

  let update: any = {};
  let logAction = action;

  switch (action) {
    case "ban":
      if (!adminCtx.permissions.has("perm_ban")) return NextResponse.json({ error: "Sem permissão para banir utilizadores." }, { status: 403 });
      update = { is_banned: true, ban_reason: reason || null };
      break;

    case "unban":
      const { data: targetProfile } = await adminClient.from("profiles").select("suspended_until, is_banned").eq("id", userId).single();
      const isSusp = targetProfile?.suspended_until && new Date(targetProfile.suspended_until) > new Date();
      const isBan = targetProfile?.is_banned;
      if (isBan && !adminCtx.permissions.has("perm_ban")) return NextResponse.json({ error: "Sem permissão para remover ban." }, { status: 403 });
      if (isSusp && !adminCtx.permissions.has("perm_suspend")) return NextResponse.json({ error: "Sem permissão para remover suspensão." }, { status: 403 });
      update = { is_banned: false, suspended_until: null, ban_reason: null, suspend_reason: null };
      break;

    case "suspend":
      if (!adminCtx.permissions.has("perm_suspend")) return NextResponse.json({ error: "Sem permissão para suspender utilizadores." }, { status: 403 });
      const until = new Date();
      until.setDate(until.getDate() + (days || 7));
      update = { suspended_until: until.toISOString(), suspend_reason: reason || null };
      logAction = `suspend_${days}d`;
      break;

    case "set_premium":
      if (!adminCtx.permissions.has("perm_grant_premium")) return NextResponse.json({ error: "Sem permissão para gerir plano Premium." }, { status: 403 });
      update = { plano: "premium" };
      break;

    case "set_free":
      if (!adminCtx.permissions.has("perm_grant_premium")) return NextResponse.json({ error: "Sem permissão para gerir plano Premium." }, { status: 403 });
      update = { plano: "free" };
      break;

    case "set_admin":
      if (!adminCtx.permissions.has("perm_grant_admin")) return NextResponse.json({ error: "Sem permissão para gerir administradores." }, { status: 403 });
      update = { 
        is_admin: true,
        perm_ban: !!inputPermissions?.perm_ban,
        perm_suspend: !!inputPermissions?.perm_suspend,
        perm_delete_user: !!inputPermissions?.perm_delete_user,
        perm_grant_admin: !!inputPermissions?.perm_grant_admin,
        perm_grant_premium: !!inputPermissions?.perm_grant_premium,
        perm_impersonate: !!inputPermissions?.perm_impersonate,
        perm_tickets: !!inputPermissions?.perm_tickets
      };
      break;

    case "remove_admin":
      if (!adminCtx.permissions.has("perm_grant_admin")) return NextResponse.json({ error: "Sem permissão para gerir administradores." }, { status: 403 });
      update = { 
        is_admin: false,
        perm_ban: false, perm_suspend: false, perm_delete_user: false,
        perm_grant_admin: false, perm_grant_premium: false, perm_impersonate: false, perm_tickets: false
      };
      break;

    case "update_permissions":
      if (!adminCtx.permissions.has("perm_grant_admin")) return NextResponse.json({ error: "Sem permissão para gerir permissões de administrador." }, { status: 403 });
      update = { 
        perm_ban: !!inputPermissions?.perm_ban,
        perm_suspend: !!inputPermissions?.perm_suspend,
        perm_delete_user: !!inputPermissions?.perm_delete_user,
        perm_grant_admin: !!inputPermissions?.perm_grant_admin,
        perm_grant_premium: !!inputPermissions?.perm_grant_premium,
        perm_impersonate: !!inputPermissions?.perm_impersonate,
        perm_tickets: !!inputPermissions?.perm_tickets
      };
      break;

    default:
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }

  const { error } = await adminClient.from("profiles").update(update).eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let targetUserName = "";
  try {
    const { data: targetProf } = await adminClient.from("profiles").select("nome").eq("id", userId).single();
    targetUserName = targetProf?.nome || "";
  } catch (_) {}

  // Usar novo audit logging
  await logAdminAction(adminCtx.userId, logAction, userId, { update, target_user_name: targetUserName, reason: reason || "" }, "success");

  if (action === "ban" || action === "suspend" || action === "unban") {
    let actionLabel = action;
    if (action === "suspend") actionLabel = `Suspensão (${days} dias)`;
    else if (action === "ban") actionLabel = "Banimento Permanente";
    else actionLabel = "Remoção de Ban/Suspensão";

    try {
      await adminClient.from("ban_suspension_logs").insert({
        admin_id: adminCtx.userId,
        target_user_id: userId,
        target_user_name: targetUserName || "Utilizador",
        action: actionLabel,
        reason: reason || (action === "unban" ? "Ban/suspensão removido pelo administrador." : "Sem motivo indicado.")
      });
    } catch (err: any) {
      console.error("Erro ao gravar log de ban/suspensão:", err.message);
    }
  }

  const notificationContent: Record<string, string> = {
    ban: "🚫 A tua conta foi permanentemente banida por violação das regras da plataforma.",
    unban: "✅ O ban da tua conta foi removido. Podes voltar a aceder normalmente.",
    set_admin: "🛡️ A tua conta foi promovida a Administrador da plataforma.",
    set_premium: "⭐ O teu plano foi atualizado para Premium pelo administrador.",
  };
  const notifKey = action === "suspend" ? "suspend" : action;
  const suspendMsg = action === "suspend" ? `⏸ A tua conta foi suspensa por ${days} dia(s) por violação das regras.` : null;
  const notifContent = suspendMsg || notificationContent[notifKey];

  if (notifContent) {
    try {
      await adminClient.from("social_notifications").insert({
        user_id: userId,
        actor_id: adminCtx.userId,
        type: "admin_action",
        content: notifContent,
      });
    } catch (_) {}
  }

  const messages: Record<string, string> = {
    ban: "Utilizador banido com sucesso.",
    unban: "Ban/suspensão removido com sucesso.",
    suspend: `Utilizador suspenso por ${days} dia(s).`,
    set_premium: "Plano Premium concedido.",
    set_free: "Plano revertido para Free.",
    set_admin: "Permissão de administrador concedida.",
    remove_admin: "Permissão de administrador removida.",
    update_permissions: "Permissões de administrador atualizadas.",
  };

  return NextResponse.json({ success: true, message: messages[action] || "Ação concluída." });
}

// DELETE — apagar conta com controle de permissão
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminCtx = await validateAdminAccess(user?.id);
  
  if (!adminCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  // Rate Limiting
  const limit = checkAdminActionRateLimit(adminCtx.userId);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: createRateLimitHeaders(limit) });
  }

  const { userId } = await request.json();
  
  if (!adminCtx.permissions.has("perm_delete_user")) {
    return NextResponse.json({ error: "Sem permissão para apagar contas." }, { status: 403 });
  }

  const adminClient = await createAdminClient();

  // Proteger o Administrador Principal
  try {
    const { data: targetUser } = await adminClient.auth.admin.getUserById(userId);
    const targetEmail = targetUser?.user?.email?.toLowerCase();
    if (targetEmail === "bragawork01@gmail.com") {
      return NextResponse.json({ error: "Não é permitido apagar a conta do Administrador Principal." }, { status: 403 });
    }
  } catch (_) {}

  // Apagar o utilizador diretamente via Admin API do Supabase
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(adminCtx.userId, "delete_user", userId, {}, "success");

  return NextResponse.json({ success: true, message: "Conta apagada com sucesso." });
}
