import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { postId, reason, details } = await request.json();
    if (!postId || !reason) {
      return NextResponse.json({ error: "ID do post e motivo são obrigatórios." }, { status: 400 });
    }

    const { data, error } = await supabase
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

    return NextResponse.json({ success: true, report: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro no servidor." }, { status: 500 });
  }
}
