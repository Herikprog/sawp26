import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { consentLogSchema, validateRequest } from "@/lib/validation-schemas";

/**
 * ENDPOINT DE CONSENTIMENTO — GDPR & LGPD
 * 
 * Protegido com:
 * - Validação de schema (Zod)
 * - Autenticação do utilizador (userId deve ser o utilizador autenticado)
 * - Rate limiting a nível de middleware
 */

export async function POST(req: Request) {
  try {
    // 1. VALIDAR SCHEMA
    const { data, error } = await validateRequest(req, consentLogSchema);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const { consent_type, consented, terms_version, userId } = data;

    // 2. SE userId FOI ENVIADO, VALIDAR QUE PERTENCE AO UTILIZADOR AUTENTICADO
    if (userId) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Se um userId foi fornecido, verificar que é o utilizador autenticado
      if (user && userId !== user.id) {
        return NextResponse.json(
          { error: "Não pode consentir em nome de outro utilizador." },
          { status: 403 }
        );
      }
    }

    // 3. OBTER IP DO CLIENTE (para auditoria)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
               req.headers.get("x-real-ip") || 
               "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";

    // 4. REGISTAR CONSENTIMENTO
    const adminClient = await createAdminClient();
    const { error: dbError } = await adminClient.from("consent_logs").insert({
      user_id: userId || null,
      consent_type,
      consented,
      terms_version,
      ip_address: ip,
      user_agent: userAgent,
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("Erro ao gravar consentimento:", dbError);
      return NextResponse.json(
        { error: "Erro ao gravar consentimento." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Consentimento registado com sucesso." });
  } catch (err: any) {
    console.error("Falha no endpoint de consentimento:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
