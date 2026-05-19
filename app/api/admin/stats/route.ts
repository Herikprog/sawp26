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

export async function GET() {
  const ctx = await verifyAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = ctx.admin;

  const [
    { count: totalUsers },
    { count: premiumUsers },
    { count: freeUsers },
    { count: bannedUsers },
    { count: openTickets },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("plano", "premium"),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("plano", "free"),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("is_banned", true),
    admin.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
  ]);

  let recentSignups: any[] = [];
  try {
    const { data } = await admin.rpc("get_daily_signups_14d");
    if (data) recentSignups = data;
  } catch (err) {}

  // Distribuição por país/cidade (top 10)
  const { data: cityDist } = await admin
    .from("profiles")
    .select("cidade")
    .not("cidade", "is", null)
    .limit(500);

  const cityCount: Record<string, number> = {};
  cityDist?.forEach((p: any) => {
    if (p.cidade) {
      cityCount[p.cidade] = (cityCount[p.cidade] || 0) + 1;
    }
  });

  const topCities = Object.entries(cityCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([city, count]) => ({ city, count }));

  const conversionRate = totalUsers && premiumUsers
    ? ((premiumUsers / totalUsers) * 100).toFixed(1)
    : "0.0";

  return NextResponse.json({
    totalUsers,
    premiumUsers,
    freeUsers,
    bannedUsers,
    openTickets,
    conversionRate,
    topCities,
    recentSignups: recentSignups || [],
  });
}
