import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { consent_type, consented, terms_version, userId } = await req.json();

    if (!consent_type || typeof consented !== "boolean" || !terms_version) {
      return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
    }

    // Obter IP do utilizador e User-Agent
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
               req.headers.get("x-real-ip") || 
               "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";

    const adminClient = await createAdminClient();

    const { error } = await adminClient.from("consent_logs").insert({
      user_id: userId || null,
      consent_type,
      consented,
      terms_version,
      ip_address: ip,
      user_agent: userAgent
    });

    if (error) {
      console.error("Erro ao gravar consentimento:", error);
      return NextResponse.json({ error: "Erro ao gravar consentimento." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Falha no endpoint de consentimento:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
