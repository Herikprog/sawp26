"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import Image from "next/image";
import { User, MapPin, FileText, Camera, Save } from "lucide-react";

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
      <div className="skeleton" style={{ width: "100%", height: 400, borderRadius: 24 }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p style={{
          fontSize: 11, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 12,
        }}>Definições</p>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 32,
          fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.03em",
        }}>
          O Meu Perfil
        </h1>
      </div>

      {/* Card */}
      <div style={{
        background: "var(--card-bg)", borderRadius: 28,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "48px 40px",
        boxShadow: "0 25px 80px -20px rgba(0,0,0,0.4)",
      }}>
        <form onSubmit={handleSave}>
          {/* Avatar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 48 }}>
            <div style={{ position: "relative", cursor: "pointer" }}>
              <div style={{
                width: 96, height: 96, borderRadius: 28, overflow: "hidden",
                background: "var(--input-bg)", display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px dashed rgba(255,255,255,0.15)",
              }}>
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt="Avatar" width={96} height={96} style={{ objectFit: "cover" }} />
                ) : (
                  <User size={36} style={{ color: "var(--text-muted)" }} />
                )}
              </div>
              <label style={{
                position: "absolute", bottom: -4, right: -4,
                width: 32, height: 32, borderRadius: 10,
                background: "var(--primary)", display: "flex",
                alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 4px 12px rgba(0,174,239,0.3)",
              }}>
                <Camera size={16} style={{ color: "var(--text-main)" }} />
                <input type="file" accept="image/*" onChange={handleAvatar} style={{ display: "none" }} />
              </label>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 16 }}>Clica para mudar a foto</p>
          </div>

          {/* Fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 10 }}>Username (@)</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="user_123"
                style={{ width: "100%", background: "var(--input-bg)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px", color: "var(--text-main)", fontSize: 14, outline: "none" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 10 }}>Nome</label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required
                style={{ width: "100%", background: "var(--input-bg)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px", color: "var(--text-main)", fontSize: 14, outline: "none" }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, marginBottom: 24 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 10 }}>Cidade</label>
              <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: Lisboa"
                style={{ width: "100%", background: "var(--input-bg)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px", color: "var(--text-main)", fontSize: 14, outline: "none" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 10 }}>Bairro (Aproximado)</label>
            <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Ex: Benfica"
              style={{ width: "100%", background: "var(--input-bg)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px", color: "var(--text-main)", fontSize: 14, outline: "none" }}
            />
          </div>

          <div style={{ marginBottom: 40 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 10 }}>Bio / Descrição</label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="O que procuras trocar..."
              style={{ width: "100%", background: "var(--input-bg)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px", color: "var(--text-main)", fontSize: 14, outline: "none", minHeight: 100, resize: "vertical" }}
            />
          </div>

          {/* Save Button */}
          <button type="submit" disabled={saving}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "var(--primary)", color: "var(--text-main)", fontWeight: 700, fontSize: 15,
              padding: "16px 24px", borderRadius: 14, border: "none", cursor: "pointer",
              boxShadow: "0 8px 24px -4px rgba(0,174,239,0.3)",
            }}>
            <Save size={18} />
            {saving ? "A guardar..." : "Guardar Alterações"}
          </button>
        </form>
      </div>
    </div>
  );
}
