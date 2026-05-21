import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { validateAdminAccess } from "@/lib/rbac";
import { checkAdminActionRateLimit, createRateLimitHeaders } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminCtx = await validateAdminAccess(user?.id);
  
  if (!adminCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  if (!adminCtx.permissions.has("perm_logs")) {
    return NextResponse.json({ error: "Sem permissão para visualizar logs." }, { status: 403 });
  }

  // Rate Limiting
  const limit = checkAdminActionRateLimit(adminCtx.userId);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: createRateLimitHeaders(limit) });
  }

  const adminClient = await createAdminClient();
  const { data: logs, error } = await adminClient
    .from("ban_suspension_logs")
    .select(`
      id,
      action,
      target_user_name,
      reason,
      created_at,
      admin:profiles!admin_id (nome)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ logs });
}
