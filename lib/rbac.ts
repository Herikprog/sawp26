import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "./supabase/server";

/**
 * ROLE-BASED ACCESS CONTROL (RBAC) — Sistema de Permissões
 * 
 * Substitui verificação por email com sistema baseado em is_admin + granular permissions
 * 
 * Principios:
 * - Least Privilege: Cada admin tem permissões específicas
 * - Defense in Depth: Validação em múltiplas camadas
 * - Audit Trail: Todas ações são registadas
 */

export type AdminPermission = 
  | "perm_ban"
  | "perm_suspend"
  | "perm_delete_user"
  | "perm_grant_admin"
  | "perm_grant_premium"
  | "perm_impersonate"
  | "perm_tickets"
  | "perm_announcements"
  | "perm_logs"
  | "perm_view_reports";

export interface AdminContext {
  userId: string;
  email: string;
  is_admin: boolean;
  is_super_admin: boolean; // Super admin pode fazer tudo
  permissions: Set<AdminPermission>;
}

/**
 * Validar que utilizador é admin e tem a permissão necessária
 * 
 * @param userId ID do utilizador autenticado
 * @param requiredPermission Permissão necessária (opcional — se não fornecida, só verifica is_admin)
 * @returns AdminContext se validado, null se não tem acesso
 */
export async function validateAdminAccess(
  userId: string | null | undefined,
  requiredPermission?: AdminPermission
): Promise<AdminContext | null> {
  if (!userId) {
    return null;
  }

  try {
    const adminClient = await createAdminClient();

    // Obter perfil do utilizador
    const { data: profile, error } = await adminClient
      .from("profiles")
      .select("id, email, is_admin, is_super_admin, perm_ban, perm_suspend, perm_delete_user, perm_grant_admin, perm_grant_premium, perm_impersonate, perm_tickets, perm_announcements, perm_logs, perm_view_reports")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      console.warn(`[RBAC] Utilizador ${userId} não encontrado`);
      return null;
    }

    // Verificar is_admin
    if (!profile.is_admin) {
      console.warn(`[RBAC] Utilizador ${userId} não é admin`);
      return null;
    }

    // Construir conjunto de permissões
    const permissions = new Set<AdminPermission>();
    
    // Super admin tem todas as permissões
    if (profile.is_super_admin) {
      permissions.add("perm_ban");
      permissions.add("perm_suspend");
      permissions.add("perm_delete_user");
      permissions.add("perm_grant_admin");
      permissions.add("perm_grant_premium");
      permissions.add("perm_impersonate");
      permissions.add("perm_tickets");
      permissions.add("perm_announcements");
      permissions.add("perm_logs");
      permissions.add("perm_view_reports");
    } else {
      // Admin regular — permissões granulares
      if (profile.perm_ban) permissions.add("perm_ban");
      if (profile.perm_suspend) permissions.add("perm_suspend");
      if (profile.perm_delete_user) permissions.add("perm_delete_user");
      if (profile.perm_grant_admin) permissions.add("perm_grant_admin");
      if (profile.perm_grant_premium) permissions.add("perm_grant_premium");
      if (profile.perm_impersonate) permissions.add("perm_impersonate");
      if (profile.perm_tickets) permissions.add("perm_tickets");
      if (profile.perm_announcements) permissions.add("perm_announcements");
      if (profile.perm_logs) permissions.add("perm_logs");
      if (profile.perm_view_reports) permissions.add("perm_view_reports");
    }

    // Se foi requerida uma permissão específica, validar
    if (requiredPermission && !permissions.has(requiredPermission)) {
      console.warn(
        `[RBAC] Utilizador ${userId} não tem permissão ${requiredPermission}`
      );
      return null;
    }

    return {
      userId: profile.id,
      email: profile.email,
      is_admin: profile.is_admin,
      is_super_admin: profile.is_super_admin,
      permissions,
    };
  } catch (err) {
    console.error("[RBAC] Erro ao validar admin:", err);
    return null;
  }
}

/**
 * HELPER — Response com acesso negado
 */
export function createUnauthorizedResponse(reason: string = "Unauthorized") {
  return NextResponse.json({ error: reason }, { status: 403 });
}

/**
 * LOG DE AÇÃO ADMIN (para auditoria)
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetUserId: string | null,
  details: Record<string, any>,
  result: "success" | "failure"
) {
  try {
    const adminClient = await createAdminClient();
    await adminClient.from("admin_audit_log").insert({
      admin_id: adminId,
      action,
      target_user_id: targetUserId,
      details,
      result,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Auditoria] Erro ao registar ação admin:", err);
  }
}

/**
 * USO EM ENDPOINTS:
 * 
 * export async function POST(request: Request) {
 *   const session = await getSession();
 *   const admin = await validateAdminAccess(session?.user.id, "perm_ban");
 *   
 *   if (!admin) {
 *     return createUnauthorizedResponse("Não tem permissão para esta ação");
 *   }
 *   
 *   // Executar ação...
 *   await logAdminAction(admin.userId, "ban_user", targetUserId, { reason: "spam" }, "success");
 *   
 *   return NextResponse.json({ success: true });
 * }
 */
