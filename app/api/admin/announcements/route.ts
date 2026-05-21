import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { validateAdminAccess, logAdminAction } from "@/lib/rbac";
import { checkAdminActionRateLimit, createRateLimitHeaders } from "@/lib/rate-limit";
import { adminAnnouncementSchema, validateRequest } from "@/lib/validation-schemas";

// GET — listar anúncios
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

  const adminClient = await createAdminClient();
  const { data: announcements, error } = await adminClient
    .from("global_announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ announcements });
}

// POST — criar novo anúncio
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminCtx = await validateAdminAccess(user?.id);
  
  if (!adminCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  if (!adminCtx.permissions.has("perm_announcements")) {
    return NextResponse.json({ error: "Sem permissão para gerir anúncios." }, { status: 403 });
  }

  // Rate Limiting
  const limit = checkAdminActionRateLimit(adminCtx.userId);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: createRateLimitHeaders(limit) });
  }

  const { data, error: validationError } = await validateRequest<any>(request, adminAnnouncementSchema);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const { title, body, type, expires_at } = data;
  const adminClient = await createAdminClient();

  const { data: announcement, error } = await adminClient.from("global_announcements").insert({
    title,
    body,
    type: type || "info",
    active: true,
    created_by: adminCtx.userId,
    expires_at: expires_at || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  await logAdminAction(adminCtx.userId, "create_announcement", null, { title }, "success");
  
  return NextResponse.json({ announcement });
}

// PATCH — ativar/desativar anúncio
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminCtx = await validateAdminAccess(user?.id);
  
  if (!adminCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  if (!adminCtx.permissions.has("perm_announcements")) {
    return NextResponse.json({ error: "Sem permissão para gerir anúncios." }, { status: 403 });
  }

  // Rate Limiting
  const limit = checkAdminActionRateLimit(adminCtx.userId);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: createRateLimitHeaders(limit) });
  }

  const { id, active } = await request.json();
  const adminClient = await createAdminClient();
  
  const { error } = await adminClient.from("global_announcements").update({ active }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  await logAdminAction(adminCtx.userId, "update_announcement", null, { id, active }, "success");
  
  return NextResponse.json({ success: true });
}

// DELETE — apagar anúncio
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminCtx = await validateAdminAccess(user?.id);
  
  if (!adminCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  if (!adminCtx.permissions.has("perm_announcements")) {
    return NextResponse.json({ error: "Sem permissão para gerir anúncios." }, { status: 403 });
  }

  // Rate Limiting
  const limit = checkAdminActionRateLimit(adminCtx.userId);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: createRateLimitHeaders(limit) });
  }

  const { id } = await request.json();
  const adminClient = await createAdminClient();
  
  const { error } = await adminClient.from("global_announcements").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  await logAdminAction(adminCtx.userId, "delete_announcement", null, { id }, "success");
  
  return NextResponse.json({ success: true });
}
