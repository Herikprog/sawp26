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
      .select("is_admin, perm_ban, perm_suspend")
      .eq("id", user.id)
      .single();
    if (!isEmailAdmin && !profile?.is_admin) return null;

    return { user, admin };
  } catch (err) {
    return null;
  }
}

export async function GET() {
  const ctx = await verifyAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { data: logs, error } = await ctx.admin
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
