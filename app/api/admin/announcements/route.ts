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

// GET — listar anúncios
export async function GET() {
  const ctx = await verifyAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { data: announcements, error } = await ctx.admin
    .from("global_announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ announcements });
}

// POST — criar novo anúncio
export async function POST(request: Request) {
  const ctx = await verifyAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { title, body, type, expires_at } = await request.json();
  if (!title || !body) return NextResponse.json({ error: "Título e mensagem são obrigatórios." }, { status: 400 });

  const { data, error } = await ctx.admin.from("global_announcements").insert({
    title,
    body,
    type: type || "info",
    active: true,
    created_by: ctx.user.id,
    expires_at: expires_at || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ announcement: data });
}

// PATCH — ativar/desativar anúncio
export async function PATCH(request: Request) {
  const ctx = await verifyAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id, active } = await request.json();
  const { error } = await ctx.admin.from("global_announcements").update({ active }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE — apagar anúncio
export async function DELETE(request: Request) {
  const ctx = await verifyAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await request.json();
  const { error } = await ctx.admin.from("global_announcements").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
