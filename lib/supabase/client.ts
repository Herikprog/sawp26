import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || url.includes("your_supabase")) {
    console.warn("Supabase not configured. Using mock client.");
    return {} as any; // Mock client
  }

  return createBrowserClient(url, key!);
}
