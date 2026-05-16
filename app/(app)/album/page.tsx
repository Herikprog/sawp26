import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AlbumGrid from "@/components/album/AlbumGrid";
import ProgressBar from "@/components/album/ProgressBar";
import type { AlbumStats } from "@/types";

export default async function AlbumPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch all stickers
  const { data: stickers } = await supabase
    .from("stickers")
    .select("*")
    .order("codigo");

  const { data: userStickers } = await supabase
    .from("user_stickers")
    .select("sticker_id, quantity")
    .eq("user_id", user.id);

  const userStickersMap = (userStickers || []).reduce((acc: any, curr) => {
    acc[curr.sticker_id] = curr.quantity;
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px" }}>
      {/* ─── Grid Section ─── */}
      <AlbumGrid 
        stickers={stickers || []} 
        userStickers={userStickersMap} 
      />
    </div>
  );
}
