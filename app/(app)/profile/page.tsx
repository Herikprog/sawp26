"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import Image from "next/image";
import { User, MapPin, FileText, Camera, Save, AtSign, Globe, Sparkles } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const [nome, setNome] = useState("");
  const [username, setUsername] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile(data);
        setNome(data.nome || "");
        setUsername(data.username || "");
        setCidade(data.cidade || "");
        setBairro(data.bairro || "");
        setDescricao(data.descricao || "");
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    
    // Validar formato username (apenas letras, numeros, underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error("O @username só pode conter letras, números e '_'");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      nome, username: username.toLowerCase(), cidade, bairro, descricao, updated_at: new Date().toISOString(),
    }).eq("id", profile.id);
    
    setSaving(false);
    
    if (error) {
      if (error.code === "23505") {
        toast.error("Esse @username já está a ser utilizado por outro utilizador.");
      } else {
        toast.error("Erro ao guardar: " + error.message);
      }
    } else {
      toast.success("Perfil atualizado! ✨");
    }
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    
    const ext = file.name.split(".").pop();
    const path = `${profile.id}/avatar.${ext}`;
    
    toast.loading("A carregar...", { id: "avatar" });
    
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
      
    if (uploadError) { 
      console.error("Upload error:", uploadError);
      toast.error(`Erro: ${uploadError.message}`, { id: "avatar" }); 
      return; 
    }
    
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    
    // Add timestamp to force refresh the image
    const finalUrl = `${publicUrl}?t=${Date.now()}`;
    
    const { error: updateError } = await supabase.from("profiles")
      .update({ avatar_url: finalUrl })
      .eq("id", profile.id);
      
    if (updateError) {
      toast.error("Erro ao atualizar perfil", { id: "avatar" });
      return;
    }

    setProfile({ ...profile, avatar_url: finalUrl });
    toast.success("Avatar atualizado!", { id: "avatar" });
  }

  if (loading) return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }}>
      <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 32, borderRadius: 8 }} />
      <div className="skeleton" style={{ width: "100%", height: 500, borderRadius: 24 }} />
    </div>
  );

  const inputStyle = {
    width: "100%", background: "var(--input-bg)",
    border: "1px solid var(--border-color)", borderRadius: 14,
    padding: "14px 16px 14px 44px", color: "var(--text-main)",
    fontSize: 14, outline: "none", transition: "all 0.25s ease",
  };

  const labelStyle = {
    display: "block", fontSize: 11, fontWeight: 800 as const,
    textTransform: "uppercase" as const, letterSpacing: "0.1em",
    color: "var(--text-muted)", marginBottom: 8, marginLeft: 2,
  };

  return (
    <div className="pattern-bg" style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px", position: "relative" }}>
      {/* Ambient */}
      <div className="orb" style={{ top: -80, right: -60, width: 300, height: 300, background: "var(--primary)", opacity: 0.03 }} />

      {/* Header */}
      <div style={{ marginBottom: 36, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <User size={14} style={{ color: "var(--primary)" }} />
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)" }}>
            Definições
          </p>
        </div>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 32,
          fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.03em",
        }}>
          O Meu Perfil
        </h1>
      </div>

      {/* Card */}
      <div style={{
        background: "var(--card-bg)", borderRadius: 24,
        border: "1px solid var(--border-color)",
        padding: "44px 36px",
        boxShadow: "var(--shadow-lg)",
        position: "relative", zIndex: 1, overflow: "hidden",
      }}>
        {/* Top accent */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: "var(--gradient-primary)", borderRadius: "24px 24px 0 0",
        }} />

        <form onSubmit={handleSave}>
          {/* Avatar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 40 }}>
            <div style={{ position: "relative", cursor: "pointer" }}>
              <div style={{
                width: 100, height: 100, borderRadius: 24, overflow: "hidden",
                background: "var(--input-bg)", display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid var(--border-color)",
                boxShadow: "var(--shadow-md)",
              }}>
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt="Avatar" width={100} height={100} style={{ objectFit: "cover" }} />
                ) : (
                  <div style={{
                    width: "100%", height: "100%",
                    background: "var(--gradient-primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 32, fontWeight: 800, color: "#fff",
                  }}>
                    {nome?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <label style={{
                position: "absolute", bottom: -6, right: -6,
                width: 34, height: 34, borderRadius: 10,
                background: "var(--gradient-primary)", display: "flex",
                alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 6px 16px rgba(0,153,255,0.25)",
                border: "2px solid var(--card-bg)",
              }}>
                <Camera size={15} style={{ color: "#fff" }} />
                <input type="file" accept="image/*" onChange={handleAvatar} style={{ display: "none" }} />
              </label>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 14 }}>Clica para mudar a foto</p>
          </div>

          {/* Fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>Username (@)</label>
              <div style={{ position: "relative" }}>
                <AtSign size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="user_123" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Nome</label>
              <div style={{ position: "relative" }}>
                <User size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>Cidade</label>
              <div style={{ position: "relative" }}>
                <Globe size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: Lisboa" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Bairro (Aproximado)</label>
              <div style={{ position: "relative" }}>
                <MapPin size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Ex: Benfica" style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={labelStyle}>Bio / Descrição</label>
            <div style={{ position: "relative" }}>
              <Sparkles size={16} style={{ position: "absolute", left: 14, top: 16, color: "var(--text-muted)" }} />
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="O que procuras trocar..."
                style={{
                  ...inputStyle, paddingTop: 14, paddingLeft: 44,
                  minHeight: 100, resize: "vertical", lineHeight: 1.6,
                }}
              />
            </div>
          </div>

          {/* Save Button */}
          <button type="submit" disabled={saving}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "var(--gradient-primary)", color: "#fff", fontWeight: 700, fontSize: 15,
              padding: "16px 24px", borderRadius: 14, border: "none", cursor: "pointer",
              boxShadow: "0 8px 24px -4px rgba(0,153,255,0.25)",
              transition: "all 0.3s ease",
              opacity: saving ? 0.7 : 1,
            }}>
            <Save size={16} />
            {saving ? "A guardar..." : "Guardar Alterações"}
          </button>
        </form>
      </div>
    </div>
  );
}
