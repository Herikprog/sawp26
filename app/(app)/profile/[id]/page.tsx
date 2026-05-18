import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { MessageCircle, MapPin, Star, Shuffle, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { getFlagUrl } from "@/types";
import FollowButton from "@/components/profile/FollowButton";
import ReportButton from "@/components/profile/ReportButton";
import FollowStats from "@/components/profile/FollowStats";
import AlbumGrid from "@/components/album/AlbumGrid";
import TradeCallButton from "@/components/profile/TradeCallButton";

interface Props {
  params: { id: string };
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user: me } } = await supabase.auth.getUser();

  if (id === me?.id) redirect("/profile");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !profile) return notFound();

  const { data: userStickers } = await supabase
    .from("user_stickers")
    .select(`
      quantity,
      sticker:stickers (*)
    `)
    .eq("user_id", id)
    .gt("quantity", 0);

  const duplicates = userStickers?.filter(s => s.quantity > 1) ?? [];
  const obtained = userStickers?.filter(s => s.quantity === 1) ?? [];

  // Fetch all stickers to determine missing ones
  const { data: allStickers } = await supabase.from("stickers").select("*").order("codigo");
  const userStickerIds = new Set(userStickers?.map((s: any) => s.sticker?.id) || []);
  const missing = allStickers?.filter(s => !userStickerIds.has(s.id)) ?? [];

  // Fetch user posts
  const { data: posts } = await supabase
    .from("posts")
    .select("*, user:profiles!posts_user_id_fkey(*)")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Check follow status
  let isFollowing = false;
  if (me) {
    const { data: follow } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", me.id)
      .eq("following_id", id)
      .single();
    isFollowing = !!follow;
  }

  const { count: fwCount } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", id);
  const { count: fgCount } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", id);
  const followersCount = fwCount || 0;
  const followingCount = fgCount || 0;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px 100px" }}>
      {/* Back button */}
      <Link href="/matches" style={{
        display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-muted)",
        textDecoration: "none", fontSize: 14, fontWeight: 600, marginBottom: 32,
        transition: "color 0.2s ease"
      }}>
        <ArrowLeft size={16} /> Voltar
      </Link>

      {/* Profile Header Card */}
      <div style={{
        background: "var(--glass-bg)", borderRadius: 32, border: "1px solid var(--glass-border)",
        padding: "48px", marginBottom: 48, position: "relative", overflow: "hidden",
        backdropFilter: "blur(24px)", boxShadow: "var(--shadow-lg)"
      }}>
        <div style={{
          position: "absolute", top: "-10%", right: "-5%", width: 400, height: 400,
          background: "var(--primary)", opacity: 0.05, filter: "blur(100px)", borderRadius: "50%", pointerEvents: "none"
        }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", flexWrap: "wrap", gap: 40, alignItems: "center" }}>
          {/* Avatar Section */}
          <div style={{ position: "relative" }}>
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.nome} width={128} height={128} style={{ borderRadius: 40, objectFit: "cover", border: "4px solid rgba(255,255,255,0.05)", boxShadow: "0 12px 32px rgba(0,0,0,0.3)" }} />
            ) : (
              <div style={{
                width: 128, height: 128, borderRadius: 40, background: "var(--input-bg)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 48, fontWeight: 700, color: "var(--primary)", border: "4px solid rgba(255,255,255,0.05)", boxShadow: "0 12px 32px rgba(0,0,0,0.3)"
              }}>
                {profile.nome[0]?.toUpperCase()}
              </div>
            )}
            {profile.is_online && (
              <div style={{
                position: "absolute", bottom: 6, right: 6, width: 20, height: 20,
                borderRadius: "50%", background: "var(--success)", border: "4px solid var(--card-bg)"
              }} />
            )}
          </div>

          {/* Info Section */}
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                {profile.nome}
              </h1>
              {profile.plano === "premium" && (
                <span style={{
                  fontSize: 10, fontWeight: 900, color: "var(--warning)",
                  background: "var(--warning-light)", padding: "4px 12px",
                  borderRadius: 8, textTransform: "uppercase", letterSpacing: "0.1em"
                }}>PRO</span>
              )}
            </div>
            {profile.username && (
              <p style={{ fontSize: 16, color: "var(--text-muted)", marginBottom: 16 }}>@{profile.username}</p>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 14 }}>
                <MapPin size={16} style={{ color: "var(--primary)" }} /> {profile.bairro || profile.cidade || "Localização oculta"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 14 }}>
                <Star size={16} style={{ color: "var(--warning)", fill: "var(--warning)" }} /> {profile.reputacao.toFixed(1)} Reputação
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 14 }}>
                <Shuffle size={16} style={{ color: "var(--success)" }} /> {profile.total_trocas} Trocas
              </div>
            </div>

            <FollowStats userId={id} followersCount={followersCount} followingCount={followingCount} />

            {profile.descricao && (
              <p style={{ color: "var(--text-sec)", fontSize: 15, lineHeight: 1.6, margin: 0, maxWidth: 600, background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
                {profile.descricao}
              </p>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 220 }}>
            {me && (
              <div style={{ width: "100%", marginBottom: 4 }}>
                <FollowButton 
                  targetUserId={id} 
                  currentUserId={me.id} 
                  initialIsFollowing={isFollowing} 
                />
              </div>
            )}
            <Link href={`/api/chat/start?userId=${id}`} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "var(--gradient-primary)", color: "#fff", fontWeight: 700, fontSize: 15,
              padding: "16px 24px", borderRadius: 16, textDecoration: "none",
              boxShadow: "0 8px 24px -4px rgba(0,174,239,0.3), inset 0 1px 0 rgba(255,255,255,0.2)", transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
            }} className="hover:scale-105">
              <MessageCircle size={18} /> Iniciar Chat
            </Link>
            <TradeCallButton targetUserId={id} />
            <ReportButton />
          </div>
        </div>
      </div>

      {/* Publicações Section */}
      {posts && posts.length > 0 && (
        <section style={{ marginBottom: 64 }}>
          <header style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
              Últimas Publicações
            </h2>
          </header>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {posts.map((post) => (
              <div key={post.id} style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", padding: 24, borderRadius: 24 }}>
                <p style={{ color: "var(--text-main)", fontSize: 15, lineHeight: 1.6, margin: "0 0 12px 0" }}>{post.content}</p>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(post.created_at).toLocaleDateString("pt-PT")}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Inventory Sections */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32 }}>
        
        {/* Procurando (Missing) Section */}
        <section style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: 24, padding: 24 }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, color: "var(--text-main)", margin: 0 }}>Procurando</h2>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)", background: "var(--danger-light)", padding: "4px 10px", borderRadius: 100 }}>
              {missing.length} Faltantes
            </span>
          </header>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: 10, maxHeight: 300, overflowY: "auto", paddingRight: 8 }}>
            {missing.length === 0 ? (
              <div style={{ gridColumn: "1/-1", padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                Álbum completo ou nenhuma registrada.
              </div>
            ) : (
              missing.map((s: any) => (
                <div key={s.id} style={{
                  aspectRatio: "3/4", background: "rgba(255,77,106,0.05)", borderRadius: 8,
                  border: "1px dashed rgba(255,77,106,0.3)", display: "flex",
                  flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: 4, opacity: 0.8
                }}>
                  <Image src={getFlagUrl(s.codigo)} alt="" width={24} height={18} style={{ borderRadius: 3, marginBottom: 4, filter: "grayscale(0.8)" }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: "var(--danger)" }}>{s.codigo}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Repetidas Section */}
        <section style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: 24, padding: 24 }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, color: "var(--text-main)", margin: 0 }}>Para Troca</h2>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--warning)", background: "var(--warning-light)", padding: "4px 10px", borderRadius: 100 }}>
              {duplicates.length} Repetidas
            </span>
          </header>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: 10, maxHeight: 300, overflowY: "auto", paddingRight: 8 }}>
            {duplicates.length === 0 ? (
              <div style={{ gridColumn: "1/-1", padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                Sem repetidas disponíveis.
              </div>
            ) : (
              duplicates.map((s: any) => (
                <div key={s.sticker.id} style={{
                  aspectRatio: "3/4", background: "var(--input-bg)", borderRadius: 8,
                  border: "1px solid rgba(245,183,0,0.3)", display: "flex",
                  flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: 4, position: "relative"
                }}>
                  <Image src={getFlagUrl(s.sticker.codigo)} alt="" width={24} height={18} style={{ borderRadius: 3, marginBottom: 4 }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-main)" }}>{s.sticker.codigo}</span>
                  <div style={{
                    position: "absolute", top: -4, right: -4, background: "var(--warning)",
                    color: "#000", fontSize: 8, fontWeight: 900, padding: "2px 5px",
                    borderRadius: 4, boxShadow: "0 2px 8px rgba(245,183,0,0.3)"
                  }}>x{s.quantity}</div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Collection Section */}
        <section style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: 24, padding: 24 }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, color: "var(--text-main)", margin: 0 }}>Coleção</h2>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--success)", background: "var(--success-light)", padding: "4px 10px", borderRadius: 100 }}>
              {obtained.length} Obtidas
            </span>
          </header>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: 10, maxHeight: 300, overflowY: "auto", paddingRight: 8 }}>
            {obtained.length === 0 ? (
              <div style={{ gridColumn: "1/-1", padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                Ainda não começou a coleção.
              </div>
            ) : (
              obtained.map((s: any) => (
                <div key={s.sticker.id} style={{
                  aspectRatio: "3/4", background: "var(--bg-hover)", borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.05)", display: "flex",
                  flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: 4, opacity: 0.6
                }}>
                  <Image src={getFlagUrl(s.sticker.codigo)} alt="" width={24} height={18} style={{ borderRadius: 3, marginBottom: 4 }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-sec)" }}>{s.sticker.codigo}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Album Section */}
      <section id="album" style={{ marginTop: 64 }}>
        <header style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
            Álbum Completo
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Consulta todas as figurinhas de {profile.nome.split(" ")[0]}.</p>
        </header>
        
        <div style={{ background: "var(--glass-bg)", borderRadius: 32, border: "1px solid var(--glass-border)", padding: "32px", backdropFilter: "blur(20px)" }}>
          <AlbumGrid 
            stickers={allStickers || []} 
            userStickers={userStickers?.reduce((acc: any, s: any) => {
              acc[s.sticker.id] = s.quantity;
              return acc;
            }, {}) || {}} 
            readOnly={true}
          />
        </div>
      </section>
    </div>
  );
}
