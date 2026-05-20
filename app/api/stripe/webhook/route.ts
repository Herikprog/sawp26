import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  console.log("[Stripe Webhook] Received webhook call.");
  console.log("[Stripe Webhook] Signature present:", !!signature);

  let event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET in environment variables.");
    }
    
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("[Stripe Webhook] Event construction failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log("[Stripe Webhook] Event verified successfully. Type:", event.type);
  const supabase = await createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const userId = session.metadata?.user_id;

    console.log("[Stripe Webhook] Processing checkout.session.completed. User ID:", userId);

    if (!userId) {
      console.error("[Stripe Webhook] No user_id in session metadata! Session ID:", session.id);
      return NextResponse.json({ error: "No user_id in metadata" }, { status: 400 });
    }

    // 1. Update profile to premium
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ plano: "premium" })
      .eq("id", userId);

    if (profileError) {
      console.error("[Stripe Webhook] Error updating profile to premium:", profileError.message);
    } else {
      console.log("[Stripe Webhook] Profile updated to premium successfully for user:", userId);
    }

    // 2. Safe save/update subscription info (avoid unique constraint violations)
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    let subError;
    if (existingSub) {
      console.log("[Stripe Webhook] Updating existing subscription record:", existingSub.id);
      const { error } = await supabase
        .from("subscriptions")
        .update({
          stripe_customer_id: session.customer,
          stripe_sub_id: session.subscription,
          plan: "premium",
          status: "active",
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", existingSub.id);
      subError = error;
    } else {
      console.log("[Stripe Webhook] Inserting new subscription record for user:", userId);
      const { error } = await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          stripe_customer_id: session.customer,
          stripe_sub_id: session.subscription,
          plan: "premium",
          status: "active",
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      subError = error;
    }

    if (subError) {
      console.error("[Stripe Webhook] Error saving/updating subscription:", subError.message);
    } else {
      console.log("[Stripe Webhook] Subscription database record processed successfully.");
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as any;
    console.log("[Stripe Webhook] Processing customer.subscription.deleted. Sub ID:", subscription.id);
    
    // Find user by subscription id
    const { data: subData } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_sub_id", subscription.id)
      .maybeSingle();

    if (subData) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ plano: "free" })
        .eq("id", subData.user_id);
      
      if (profileError) {
        console.error("[Stripe Webhook] Error reverting profile to free:", profileError.message);
      } else {
        console.log("[Stripe Webhook] User profile reverted to free:", subData.user_id);
      }

      const { error: subUpdateError } = await supabase
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("stripe_sub_id", subscription.id);

      if (subUpdateError) {
        console.error("[Stripe Webhook] Error updating subscription status to canceled:", subUpdateError.message);
      }
    } else {
      console.warn("[Stripe Webhook] No active subscription record found for Stripe Sub ID:", subscription.id);
    }
  }

  return NextResponse.json({ received: true });
}
