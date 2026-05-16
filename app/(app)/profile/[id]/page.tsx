import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { MessageCircle, MapPin, Star, Shuffle, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { getFlagUrl } from "@/types";

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

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>
      {/* Back button */}
      <Link href="/matches" style={{
        display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-muted)",
        textDecoration: "none", fontSize: 14, fontWeight: 600, marginBottom: 32,
        transition: "color 0.2s ease"
      }}>
        <ArrowLeft size={16} /> Voltar aos Matches
      </Link>

      {/* Profile Header Card */}
      <div style={{
        background: "var(--card-bg)", borderRadius: 32, border: "1px solid rgba(255,255,255,0.08)",
        padding: "48px", marginBottom: 48, position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: "-10%", right: "-5%", width: 400, height: 400,
          background: "var(--primary)", opacity: 0.03, filter: "blur(100px)", borderRadius: "50%"
        }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", flexWrap: "wrap", gap: 40, alignItems: "center" }}>
          {/* Avatar Section */}
          <div style={{ position: "relative" }}>
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.nome} width={128} height={128} style={{ borderRadius: 40, objectFit: "cover", border: "4px solid rgba(255,255,255,0.05)" }} />
            ) : (
              <div style={{
                width: 128, height: 128, borderRadius: 40, background: "var(--input-bg)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 48, fontWeight: 700, color: "var(--primary)", border: "4px solid rgba(255,255,255,0.05)"
              }}>
                {profile.nome[0]}
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
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
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

            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 14 }}>
                <MapPin size={16} /> {profile.bairro || profile.cidade || "Localização oculta"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 14 }}>
                <Star size={16} style={{ color: "var(--warning)", fill: "var(--warning)" }} /> {profile.reputacao.toFixed(1)} Reputação
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 14 }}>
                <Shuffle size={16} /> {profile.total_trocas} Trocas
              </div>
            </div>

            {profile.descricao && (
              <p style={{ color: "var(--text-sec)", fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 600 }}>
                {profile.descricao}
              </p>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 220 }}>
            <Link href={`/chat`} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "var(--primary)", color: "var(--text-main)", fontWeight: 700, fontSize: 15,
              padding: "16px 24px", borderRadius: 16, textDecoration: "none",
              boxShadow: "0 8px 20px -4px rgba(0,174,239,0.3)", transition: "all 0.2s ease"
            }}>
              <MessageCircle size={18} /> Iniciar Chat
            </Link>
            <button style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "var(--danger-light)", color: "var(--danger)", fontWeight: 600, fontSize: 14,
              padding: "14px 24px", borderRadius: 16, border: "1px solid var(--danger)",
              cursor: "pointer", transition: "all 0.2s ease"
            }}>
              <Shield size={16} /> Denunciar
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Sections */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 48 }}>
        {/* Repetidas Section */}
        <section>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, color: "var(--text-main)", margin: 0 }}>Para Troca</h2>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--warning)", background: "var(--warning-light)", padding: "4px 12px", borderRadius: 100 }}>
              {duplicates.length} Repetidas
            </span>
          </header>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 12 }}>
            {duplicates.length === 0 ? (
              <div style={{ gridColumn: "1/-1", padding: "48px", textAlign: "center", background: "var(--bg-hover)", borderRadius: 24, border: "1px dashed rgba(255,255,255,0.1)" }}>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Sem repetidas disponíveis.</p>
              </div>
            ) : (
              duplicates.map((s: any) => (
                <div key={s.sticker.id} style={{
                  aspectRatio: "3/4", background: "var(--input-bg)", borderRadius: 12,
                  border: "1px solid rgba(245,183,0,0.2)", display: "flex",
                  flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: 8, position: "relative"
                }}>
                  <Image src={getFlagUrl(s.sticker.codigo)} alt="" width={32} height={24} style={{ borderRadius: 4, marginBottom: 6 }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)" }}>{s.sticker.codigo}</span>
                  <div style={{
                    position: "absolute", top: -4, right: -4, background: "var(--warning)",
                    color: "var(--bg-main)", fontSize: 9, fontWeight: 900, padding: "2px 6px",
                    borderRadius: 6, boxShadow: "0 2px 8px rgba(245,183,0,0.3)"
                  }}>x{s.quantity}</div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Collection Section */}
        <section>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, color: "var(--text-main)", margin: 0 }}>Coleção</h2>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--success)", background: "var(--success-light)", padding: "4px 12px", borderRadius: 100 }}>
              {obtained.length} Obtidas
            </span>
          </header>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 12 }}>
            {obtained.length === 0 ? (
              <div style={{ gridColumn: "1/-1", padding: "48px", textAlign: "center", background: "var(--bg-hover)", borderRadius: 24, border: "1px dashed rgba(255,255,255,0.1)" }}>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Ainda não começou a coleção.</p>
              </div>
            ) : (
              obtained.map((s: any) => (
                <div key={s.sticker.id} style={{
                  aspectRatio: "3/4", background: "var(--bg-hover-strong)", borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.05)", display: "flex",
                  flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: 8, opacity: 0.6
                }}>
                  <Image src={getFlagUrl(s.sticker.codigo)} alt="" width={32} height={24} style={{ borderRadius: 4, marginBottom: 6, filter: "grayscale(0.5)" }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-sec)" }}>{s.sticker.codigo}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
