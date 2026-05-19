import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:suporte@swap26.com",
    vapidPublicKey,
    vapidPrivateKey
  );
}

// Instanciar o cliente administrativo do Supabase para ignorar políticas RLS na leitura das subscrições
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole || "placeholder-to-prevent-supabase-sdk-crash");

export async function POST(request: Request) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error("VAPID Keys não configuradas nas variáveis de ambiente da Vercel.");
    return NextResponse.json({ error: "VAPID Keys não configuradas." }, { status: 500 });
  }

  if (!supabaseServiceRole) {
    console.error("SUPABASE_SERVICE_ROLE_KEY não configurada nas variáveis de ambiente da Vercel.");
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada." }, { status: 500 });
  }

  try {
    // Obter o payload enviado pelo Webhook do Supabase
    const body = await request.json();
    const { table, record } = body;

    if (!record) {
      return NextResponse.json({ success: true, message: "Sem registo de dados para processar." });
    }

    let recipientId = "";
    let pushTitle = "Swap26";
    let pushBody = "Tem uma nova atualização na sua conta!";
    let pushUrl = "/feed";

    // ─── 1. CASO: Nova mensagem de chat recebida ───
    if (table === "messages") {
      const { conversation_id, sender_id, content } = record;

      // Obter a conversa para descobrir quem é o destinatário (o outro participante)
      const { data: conv, error: convErr } = await supabaseAdmin
        .from("conversations")
        .select("user_a_id, user_b_id")
        .eq("id", conversation_id)
        .single();

      if (convErr || !conv) {
        console.warn("Conversa não encontrada para push:", convErr?.message);
        return NextResponse.json({ success: false, message: "Conversa não encontrada." });
      }

      recipientId = conv.user_a_id === sender_id ? conv.user_b_id : conv.user_a_id;

      // Obter o nome de quem enviou a mensagem
      const { data: sender } = await supabaseAdmin
        .from("profiles")
        .select("nome")
        .eq("id", sender_id)
        .single();

      pushTitle = sender?.nome ? `${sender.nome}` : "Nova Mensagem";
      pushBody = content || "Enviou-lhe um anexo ou figurinha.";
      pushUrl = `/chat/${conversation_id}`;
    } 
    // ─── 2. CASO: Nova notificação global do sistema ───
    else if (table === "social_notifications") {
      const { user_id, actor_id, type } = record;
      recipientId = user_id;

      // Buscar o nome de quem realizou a ação (actor)
      const { data: actor } = await supabaseAdmin
        .from("profiles")
        .select("nome")
        .eq("id", actor_id)
        .single();

      const actorName = actor?.nome ? actor.nome : "Alguém";

      pushTitle = "Swap26";
      
      switch (type) {
        case "like":
          pushBody = `${actorName} gostou do teu post!`;
          break;
        case "reply":
          pushBody = `${actorName} comentou no teu post!`;
          break;
        case "follow":
          pushBody = `${actorName} começou a seguir-te!`;
          break;
        case "trade":
          pushBody = `${actorName} propôs-te uma troca de figurinhas!`;
          break;
        case "repost":
          pushBody = `${actorName} partilhou o teu post!`;
          break;
        default:
          pushBody = "Tem uma nova atualização na sua conta!";
      }

      pushUrl = "/feed";
    } 
    // Outras tabelas não suportadas
    else {
      return NextResponse.json({ success: true, message: "Tabela não mapeada para Push." });
    }

    if (!recipientId) {
      return NextResponse.json({ success: true, message: "Destinatário não identificado." });
    }

    // ─── 3. Procurar subscrições ativas do utilizador alvo ───
    const { data: subscriptions, error: subErr } = await supabaseAdmin
      .rpc("get_user_push_subscriptions", { p_user_id: recipientId });

    if (subErr) {
      console.error("Erro ao ler subscrições do Supabase:", subErr.message);
      throw subErr;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: "O destinatário não tem subscrições ativas neste browser." });
    }

    // ─── 4. Efetuar o envio concorrente para todos os dispositivos registados ───
    const sendPromises = (subscriptions as any[]).map(async (sub: any) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      const payload = JSON.stringify({
        title: pushTitle,
        body: pushBody,
        url: pushUrl,
        icon: "/icon-192.png"
      });

      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err: any) {
        // Se a subscrição expirou ou o browser desinstalou/revogou, limpamos automaticamente da base de dados
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Limpando subscrição expirada no endpoint: ${sub.endpoint}`);
          await supabaseAdmin
            .rpc("delete_expired_push_subscription", { p_endpoint: sub.endpoint });
        } else {
          console.error("Falha ao enviar notificação push:", err);
        }
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, sentCount: subscriptions.length });
  } catch (err: any) {
    console.error("Erro geral na API de Push:", err);
    return NextResponse.json({ error: err.message || "Erro interno do servidor." }, { status: 500 });
  }
}
