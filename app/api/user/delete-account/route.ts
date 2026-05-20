import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Utilizador não autenticado." }, { status: 401 });
    }

    // Criar o cliente admin para apagar o utilizador do auth do Supabase
    const adminClient = await createAdminClient();
    const { error } = await adminClient.auth.admin.deleteUser(user.id);

    if (error) {
      console.error("Erro ao apagar conta no Supabase Auth:", error);
      return NextResponse.json({ error: "Falha ao apagar o registo de autenticação." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Falha no endpoint de eliminação de conta:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
