import { NextRequest, NextResponse } from "next/server";
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

  return "PT"; // Fallback padrão unificado para Portugal/EUR (adequado para o domínio .pt)
}

export async function GET(request: NextRequest) {
  const country = detectCountry(request);
  const isBR = country === "BR";
  const fallbackPrice = isBR ? "R$ 19,90" : "4,99€";
  const fallbackCurrency = isBR ? "BRL" : "EUR";
  const fallbackInterval = "mês";

  try {
    const priceId = isBR
      ? process.env.STRIPE_PREMIUM_PRICE_BRL
      : process.env.STRIPE_PREMIUM_PRICE_EUR;

    if (!priceId) {
      console.warn(`[Stripe Pricing] Price ID not set in environment for country ${country}. Returning graceful fallback.`);
      return NextResponse.json({
        displayPrice: fallbackPrice,
        currency: fallbackCurrency,
        country,
        interval: fallbackInterval,
        isFallback: true,
      });
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
    
    // Retornar fallback gracioso em vez de falhar com erro 500 no cliente
    return NextResponse.json({
      displayPrice: fallbackPrice,
      currency: fallbackCurrency,
      country,
      interval: fallbackInterval,
      isFallback: true,
      errorDetail: error instanceof Error ? error.message : String(error),
    });
  }
}
