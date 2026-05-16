"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Conta criada! Verifica o teu email para confirmar.");
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { toast.error(error.message); setLoading(false); }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--bg-main)",
      position: "relative", overflow: "hidden", padding: "40px 24px",
    }}>
      {/* Orbs */}
      <div style={{ position: "absolute", width: 700, height: 700, background: "#7B61FF", opacity: 0.05, borderRadius: "50%", filter: "blur(150px)", top: "-25%", right: "-15%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 500, height: 500, background: "var(--success)", opacity: 0.04, borderRadius: "50%", filter: "blur(150px)", bottom: "-20%", left: "-10%", pointerEvents: "none" }} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 460 }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 56, height: 56, borderRadius: 18, background: "var(--text-main)",
            marginBottom: 28, boxShadow: "0 0 50px rgba(255,255,255,0.06)",
          }}>
            <span style={{ fontSize: 28 }}>⚽</span>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 42, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-main)", marginBottom: 12 }}>
            Swap<span style={{ color: "var(--primary)" }}>26</span>
          </h1>
          <p style={{ color: "var(--text-sec)", fontSize: 16 }}>Cria a tua conta de colecionador.</p>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--card-bg)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 28, padding: "48px 40px",
          boxShadow: "0 25px 80px -20px rgba(0,0,0,0.5)",
        }}>
          {/* Google */}
          <button onClick={handleGoogle} disabled={loading}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              background: "var(--text-main)", color: "var(--bg-main)", fontWeight: 700, fontSize: 15,
              padding: "18px 24px", borderRadius: 16, border: "none", cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)", marginBottom: 32,
            }}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Registar com Google
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
            <div style={{ height: 1, flex: 1, background: "var(--border-light)" }} />
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-muted)" }}>ou com email</span>
            <div style={{ height: 1, flex: 1, background: "var(--border-light)" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 10, marginLeft: 4, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Nome completo</label>
              <div style={{ position: "relative" }}>
                <User size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type="text" placeholder="O teu nome" value={nome} onChange={(e) => setNome(e.target.value)} required
                  style={{ width: "100%", background: "var(--input-bg)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "18px 20px 18px 48px", color: "var(--text-main)", fontSize: 15, outline: "none" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 10, marginLeft: 4, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type="email" placeholder="nome@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required
                  style={{ width: "100%", background: "var(--input-bg)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "18px 20px 18px 48px", color: "var(--text-main)", fontSize: 15, outline: "none" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={{ display: "block", marginBottom: 10, marginLeft: 4, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Palavra-passe</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required
                  style={{ width: "100%", background: "var(--input-bg)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "18px 20px 18px 48px", color: "var(--text-main)", fontSize: 15, outline: "none" }}
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                background: "var(--success)", color: "var(--text-main)", fontWeight: 700, fontSize: 16,
                padding: "18px 24px", borderRadius: 16, border: "none", cursor: "pointer",
                boxShadow: "0 8px 24px -4px rgba(0,201,109,0.35)",
              }}>
              {loading ? "A criar conta..." : "Criar Conta Grátis"}
              <ArrowRight size={18} />
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
            <ShieldCheck size={14} style={{ color: "var(--success)" }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Os teus dados estão protegidos</span>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Já tens conta?{" "}
            <Link href="/login" style={{ color: "var(--text-main)", fontWeight: 600, textDecoration: "none" }}>
              Inicia sessão
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
