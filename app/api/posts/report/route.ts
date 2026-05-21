import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkPublicEndpointRateLimit, createRateLimitHeaders } from "@/lib/rate-limit";
import { postReportSchema, validateRequest } from "@/lib/validation-schemas";

export async function POST(request: Request) {
  try {
    // Rate Limiting
    const limit = checkPublicEndpointRateLimit(request);
    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: createRateLimitHeaders(limit) });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error: validationError } = await validateRequest<any>(request, postReportSchema);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const { postId, reason, details } = data;

    const { data: report, error } = await supabase
      .from("post_reports")
      .insert({
        reporter_id: user.id,
        post_id: postId,
        reason,
        details: details || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro no servidor." }, { status: 500 });
  }
}
