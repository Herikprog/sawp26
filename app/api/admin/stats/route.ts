import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { validateAdminAccess } from "@/lib/rbac";
import { checkAdminActionRateLimit, createRateLimitHeaders } from "@/lib/rate-limit";

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

  const [
    { count: totalUsers },
    { count: premiumUsers },
    { count: freeUsers },
    { count: bannedUsers },
    { count: openTickets },
  ] = await Promise.all([
    adminClient.from("profiles").select("*", { count: "exact", head: true }),
    adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("plano", "premium"),
    adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("plano", "free"),
    adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("is_banned", true),
    adminClient.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
  ]);

  let recentSignups: any[] = [];
  try {
    const { data } = await adminClient.rpc("get_daily_signups_14d");
    if (data) recentSignups = data;
  } catch (err) {}

  // Distribuição por país/cidade (top 10)
  const { data: cityDist } = await adminClient
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
