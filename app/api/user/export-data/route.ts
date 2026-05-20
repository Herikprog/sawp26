import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Utilizador não autenticado." }, { status: 401 });
    }

    // 1. Perfil do utilizador
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // 2. Figurinhas do utilizador
    const { data: stickers } = await supabase
      .from("user_stickers")
      .select("quantity, photo_url, updated_at, stickers (codigo, nome, selecao, grupo)")
      .eq("user_id", user.id);

    // 3. Trocas do utilizador
    const { data: trades } = await supabase
      .from("trades")
      .select("*")
      .or(`initiator_id.eq.${user.id},receiver_id.eq.${user.id}`);

    // 4. Publicações no Feed
    const { data: posts } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", user.id);

    // 5. Histórico de Notificações
    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id);

    // 6. Logs de consentimento
    const { data: consentLogs } = await supabase
      .from("consent_logs")
      .select("*")
      .eq("user_id", user.id);

    // Agrupar todos os dados pessoais recolhidos
    const personalData = {
      export_date: new Date().toISOString(),
      user_account: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      profile: profile || {},
      stickers: stickers || [],
      trades: trades || [],
      posts: posts || [],
      notifications: notifications || [],
      consent_logs: consentLogs || []
    };

    // Retornar como download de ficheiro JSON
    const jsonString = JSON.stringify(personalData, null, 2);
    
    return new Response(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="dados_pessoais_trocastickers_${user.id}.json"`,
      },
    });
  } catch (err: any) {
    console.error("Falha ao exportar dados:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
