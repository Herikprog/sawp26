import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get("userId");

  if (!targetUserId) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check if conversation already exists
  const { data: existingConvs } = await supabase
    .from("conversations")
    .select("id")
    .or(`and(user_a_id.eq.${user.id},user_b_id.eq.${targetUserId}),and(user_a_id.eq.${targetUserId},user_b_id.eq.${user.id})`);

  if (existingConvs && existingConvs.length > 0) {
    return NextResponse.redirect(new URL(`/chat/${existingConvs[0].id}`, request.url));
  }

  // Create new conversation
  const { data: newConv, error } = await supabase
    .from("conversations")
    .insert({
      user_a_id: user.id,
      user_b_id: targetUserId
    })
    .select("id")
    .single();

  if (error || !newConv) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  return NextResponse.redirect(new URL(`/chat/${newConv.id}`, request.url));
}
