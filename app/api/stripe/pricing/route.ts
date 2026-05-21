import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

/**
 * Detetar país do utilizador automaticamente pelos headers do request.
 */
function detectCountry(request: NextRequest): string {
  const vercelCountry = request.headers.get("x-vercel-ip-country");
  if (vercelCountry) return vercelCountry.toUpperCase();

  const cfCountry = request.headers.get("cf-ipcountry");
  if (cfCountry && cfCountry !== "XX") return cfCountry.toUpperCase();

  const acceptLang = request.headers.get("accept-language") || "";
  if (acceptLang.includes("pt-BR")) return "BR";

  return "PT"; // Fallback para Portugal/EUR
}

export async function GET(request: NextRequest) {
  try {
    const country = detectCountry(request);
    const isBR = country === "BR";

    const priceId = isBR
      ? process.env.STRIPE_PREMIUM_PRICE_BRL
      : process.env.STRIPE_PREMIUM_PRICE_EUR;

    if (!priceId) {
      return NextResponse.json(
        { error: "Preço não configurado." },
        { status: 500 }
      );
    }

    // Buscar o preço real da Stripe
    const price = await stripe.prices.retrieve(priceId);

    const amount = (price.unit_amount ?? 0) / 100;
    const currency = (price.currency ?? "eur").toUpperCase();

    // Formatar o preço de acordo com a moeda
    let displayPrice: string;
    if (currency === "BRL") {
      displayPrice = `R$ ${amount.toFixed(2).replace(".", ",")}`;
    } else {
      displayPrice = `${amount.toFixed(2).replace(".", ",")}€`;
    }

    // Intervalo da assinatura
    const intervalMap: Record<string, string> = {
      day: "dia",
      week: "semana",
      month: "mês",
      year: "ano",
    };
    const interval = price.recurring?.interval
      ? intervalMap[price.recurring.interval] || price.recurring.interval
      : "mês";

    return NextResponse.json({
      displayPrice,
      currency,
      country,
      interval,
    });
  } catch (error) {
    console.error("Stripe Pricing Error:", error);
    return NextResponse.json(
      { error: "Erro ao obter preço." },
      { status: 500 }
    );
  }
}
