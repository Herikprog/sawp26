import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabase = await createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const userId = session.metadata.user_id;

    // Update profile to premium
    await supabase
      .from("profiles")
      .update({ plano: "premium" })
      .eq("id", userId);

    // Save subscription info
    await supabase.from("subscriptions").insert({
      user_id: userId,
      stripe_customer_id: session.customer,
      stripe_sub_id: session.subscription,
      plan: "premium",
      status: "active",
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // rough estimate
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as any;
    
    // Find user by subscription id
    const { data: subData } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_sub_id", subscription.id)
      .single();

    if (subData) {
      await supabase
        .from("profiles")
        .update({ plano: "free" })
        .eq("id", subData.user_id);
    }
  }

  return NextResponse.json({ received: true });
}
