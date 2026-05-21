import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

/**
 * Detetar país do utilizador automaticamente pelos headers do request.
 * 
 * Prioridade:
 * 1. x-vercel-ip-country (Vercel)
 * 2. cf-ipcountry (Cloudflare)
 * 3. Accept-Language (fallback)
 */
function detectCountry(request: NextRequest): string {
  // 1. Vercel
  const vercelCountry = request.headers.get("x-vercel-ip-country");
  if (vercelCountry) return vercelCountry.toUpperCase();

  // 2. Cloudflare
  const cfCountry = request.headers.get("cf-ipcountry");
  if (cfCountry && cfCountry !== "XX") return cfCountry.toUpperCase();

  // 3. Accept-Language fallback
  const acceptLang = request.headers.get("accept-language") || "";
  if (acceptLang.includes("pt-BR")) return "BR";
  if (acceptLang.includes("pt")) return "PT";
  if (acceptLang.includes("es")) return "ES";
  if (acceptLang.includes("fr")) return "FR";
  if (acceptLang.includes("de")) return "DE";
  if (acceptLang.includes("it")) return "IT";
  if (acceptLang.includes("en-GB")) return "GB";
  if (acceptLang.includes("en")) return "US";

  return "BR"; // Fallback padrão para Brasil
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Detetar país
    const country = detectCountry(request);

    // Selecionar o Price ID com base no país (BR -> BRL, resto -> EUR)
    const priceId = country === "BR"
      ? process.env.STRIPE_PREMIUM_PRICE_BRL
      : process.env.STRIPE_PREMIUM_PRICE_EUR;

    if (!priceId) {
      console.error(`Preço do Stripe não configurado para o país ${country} (moeda selecionada).`);
      return NextResponse.json(
        { error: "Configuração de pagamento em falta no servidor." },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?premium=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium?premium=cancel`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        country,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json(
      { error: "Erro ao criar sessão de pagamento." },
      { status: 500 }
    );
  }
}
