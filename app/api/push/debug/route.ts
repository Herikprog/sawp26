import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "configured" : "missing",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "configured" : "missing",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? `configured (len: ${process.env.SUPABASE_SERVICE_ROLE_KEY.length})` : "missing",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? `configured (len: ${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY.length})` : "missing",
      VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY ? `configured (len: ${process.env.VAPID_PRIVATE_KEY.length})` : "missing",
    },
    database: {
      connection: "untested",
      push_subscriptions_count: 0,
      error: null,
    },
    webpush: {
      status: "untested",
      error: null,
    }
  };

  // Test Webpush configuration
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    try {
      webpush.setVapidDetails(
        "mailto:suporte@trocastickers.com",
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
      diagnostics.webpush.status = "valid_keys_and_email";
    } catch (err: any) {
      diagnostics.webpush.status = "error_setting_details";
      diagnostics.webpush.error = err.message || err;
    }
  } else {
    diagnostics.webpush.status = "missing_keys";
  }

  // Test Supabase Admin Connection & Table Access
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data, error, count } = await supabaseAdmin
        .from("push_subscriptions")
        .select("*", { count: "exact", head: true });

      if (error) {
        diagnostics.database.connection = "failed_query";
        diagnostics.database.error = error.message;
      } else {
        diagnostics.database.connection = "success";
        diagnostics.database.push_subscriptions_count = count || 0;
      }
    } catch (err: any) {
      diagnostics.database.connection = "exception";
      diagnostics.database.error = err.message || err;
    }
  } else {
    diagnostics.database.connection = "missing_credentials";
  }

  return NextResponse.json(diagnostics);
}
