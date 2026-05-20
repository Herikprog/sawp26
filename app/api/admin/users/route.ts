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
      .select("is_admin, perm_ban, perm_suspend, perm_delete_user, perm_grant_admin, perm_grant_premium, perm_impersonate, perm_tickets")
      .eq("id", user.id)
      .single();
    if (!isEmailAdmin && !profile?.is_admin) return null;

    const permissions = {
      perm_ban: isEmailAdmin ? true : !!profile?.perm_ban,
      perm_suspend: isEmailAdmin ? true : !!profile?.perm_suspend,
      perm_delete_user: isEmailAdmin ? true : !!profile?.perm_delete_user,
      perm_grant_admin: isEmailAdmin ? true : !!profile?.perm_grant_admin,
      perm_grant_premium: isEmailAdmin ? true : !!profile?.perm_grant_premium,
      perm_impersonate: isEmailAdmin ? true : !!profile?.perm_impersonate,
      perm_tickets: isEmailAdmin ? true : !!profile?.perm_tickets,
    };

    return { user, admin, permissions, isSuperAdmin: isEmailAdmin };
  } catch (err: any) {
    console.error("[verifyAdmin] error:", err.message);
    return null;
  }
}

// GET — listar utilizadores com as suas permissões detalhadas
export async function GET(request: Request) {
  const ctx = await verifyAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  let query = ctx.admin
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
  const ctx = await verifyAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { action, userId, days, permissions: inputPermissions, reason } = await request.json();
  const admin = ctx.admin;
  const adminId = ctx.user.id;
  const perms = ctx.permissions;

  // 1. Proteger a conta do Administrador Principal bragawork01@gmail.com
  try {
    const { data: targetUser } = await admin.auth.admin.getUserById(userId);
    const targetEmail = targetUser?.user?.email?.toLowerCase();
    if (targetEmail === "bragawork01@gmail.com") {
      return NextResponse.json({ error: "Não é permitido alterar ou remover privilégios do Administrador Principal." }, { status: 403 });
    }
  } catch (_) {}

  // 2. Controlar permissões com base na ação solicitada
  if (action === "impersonate") {
    if (!perms.perm_impersonate) {
      return NextResponse.json({ error: "Sem permissão para entrar em contas." }, { status: 403 });
    }

    try {
      const { data: targetUser, error: userError } = await admin.auth.admin.getUserById(userId);
      if (userError || !targetUser.user?.email) {
        return NextResponse.json({ error: "Utilizador não encontrado ou sem email de login." }, { status: 400 });
      }
      
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: targetUser.user.email,
        options: {
          redirectTo: `${new URL(request.url).origin}/auth/session`
        }
      });
      
      if (linkError) {
        return NextResponse.json({ error: linkError.message }, { status: 500 });
      }
      
      // Registar no audit log
      await admin.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "impersonate",
        target_user: userId,
        metadata: { target_email: targetUser.user.email }
      });
      
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
      if (!perms.perm_ban) return NextResponse.json({ error: "Sem permissão para banir utilizadores." }, { status: 403 });
      update = { is_banned: true, ban_reason: reason || null };
      break;

    case "unban":
      // Validar se está a tentar remover ban ou suspensão
      const { data: targetProfile } = await admin.from("profiles").select("suspended_until, is_banned").eq("id", userId).single();
      const isSusp = targetProfile?.suspended_until && new Date(targetProfile.suspended_until) > new Date();
      const isBan = targetProfile?.is_banned;
      if (isBan && !perms.perm_ban) return NextResponse.json({ error: "Sem permissão para remover ban." }, { status: 403 });
      if (isSusp && !perms.perm_suspend) return NextResponse.json({ error: "Sem permissão para remover suspensão." }, { status: 403 });
      
      update = { is_banned: false, suspended_until: null, ban_reason: null, suspend_reason: null };
      break;

    case "suspend":
      if (!perms.perm_suspend) return NextResponse.json({ error: "Sem permissão para suspender utilizadores." }, { status: 403 });
      const until = new Date();
      until.setDate(until.getDate() + (days || 7));
      update = { suspended_until: until.toISOString(), suspend_reason: reason || null };
      logAction = `suspend_${days}d`;
      break;

    case "set_premium":
      if (!perms.perm_grant_premium) return NextResponse.json({ error: "Sem permissão para gerir plano Premium." }, { status: 403 });
      update = { plano: "premium" };
      break;

    case "set_free":
      if (!perms.perm_grant_premium) return NextResponse.json({ error: "Sem permissão para gerir plano Premium." }, { status: 403 });
      update = { plano: "free" };
      break;

    case "set_admin":
      if (!perms.perm_grant_admin) return NextResponse.json({ error: "Sem permissão para gerir administradores." }, { status: 403 });
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
      if (!perms.perm_grant_admin) return NextResponse.json({ error: "Sem permissão para gerir administradores." }, { status: 403 });
      update = { 
        is_admin: false,
        perm_ban: false,
        perm_suspend: false,
        perm_delete_user: false,
        perm_grant_admin: false,
        perm_grant_premium: false,
        perm_impersonate: false,
        perm_tickets: false
      };
      break;

    case "update_permissions":
      if (!perms.perm_grant_admin) return NextResponse.json({ error: "Sem permissão para gerir permissões de administrador." }, { status: 403 });
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
  const { error } = await admin.from("profiles").update(update).eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Obter o nome do utilizador alvo
  let targetUserName = "";
  try {
    const { data: targetProf } = await admin.from("profiles").select("nome").eq("id", userId).single();
    targetUserName = targetProf?.nome || "";
  } catch (_) {}

  // Registar no audit log
  await admin.from("admin_audit_log").insert({
    admin_id: adminId,
    action: logAction,
    target_user: userId,
    metadata: { 
      update,
      target_user_name: targetUserName,
      reason: reason || ""
    }
  });

  // Registar no histórico de ban/suspensão
  if (action === "ban" || action === "suspend" || action === "unban") {
    let actionLabel = action;
    if (action === "suspend") {
      actionLabel = `Suspensão (${days} dias)`;
    } else if (action === "ban") {
      actionLabel = "Banimento Permanente";
    } else {
      actionLabel = "Remoção de Ban/Suspensão";
    }

    try {
      await admin.from("ban_suspension_logs").insert({
        admin_id: adminId,
        target_user_id: userId,
        target_user_name: targetUserName || "Utilizador",
        action: actionLabel,
        reason: reason || (action === "unban" ? "Ban/suspensão removido pelo administrador." : "Sem motivo indicado.")
      });
    } catch (err: any) {
      console.error("Erro ao gravar log de ban/suspensão:", err.message);
    }
  }
  // Notificar utilizador via social_notifications para ban/suspend/unban
  const notificationContent: Record<string, string> = {
    ban: "🚫 A tua conta foi permanentemente banida por violação das regras da plataforma.",
    unban: "✅ O ban da tua conta foi removido. Podes voltar a aceder normalmente.",
    set_admin: "🛡️ A tua conta foi promovida a Administrador da plataforma.",
    set_premium: "⭐ O teu plano foi atualizado para Premium pelo administrador.",
  };
  const notifKey = action === "suspend" ? "suspend" : action;
  const suspendMsg = action === "suspend"
    ? `⏸ A tua conta foi suspensa por ${days} dia(s) por violação das regras.`
    : null;
  const notifContent = suspendMsg || notificationContent[notifKey];
  if (notifContent) {
    try {
      await admin.from("social_notifications").insert({
        user_id: userId,
        actor_id: adminId,
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
  const ctx = await verifyAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { userId } = await request.json();
  
  if (!ctx.permissions.perm_delete_user) {
    return NextResponse.json({ error: "Sem permissão para apagar contas." }, { status: 403 });
  }

  // Proteger o Administrador Principal
  try {
    const { data: targetUser } = await ctx.admin.auth.admin.getUserById(userId);
    const targetEmail = targetUser?.user?.email?.toLowerCase();
    if (targetEmail === "bragawork01@gmail.com") {
      return NextResponse.json({ error: "Não é permitido apagar a conta do Administrador Principal." }, { status: 403 });
    }
  } catch (_) {}

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
