"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, ShieldCheck, BookOpen, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
      email, password,
      options: {
        data: { nome },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Conta criada! Verifica o teu email para confirmar.");
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
    <div 
      className="flex flex-col lg:flex-row min-h-screen relative overflow-hidden"
      style={{
        background: "radial-gradient(circle at 30% 50%, #061A1D 0%, #060B18 60%)",
        backgroundColor: "#060B18",
      }}
    >
      {/* ─── Left: Hero Panel ─── */}
      <div style={{
        flex: 1, position: "relative",
        background: "transparent",
      }} className="flex">
        <div className="pulse-glow" style={{
          position: "absolute", width: 500, height: 500,
          background: "#00E09E", opacity: 0.05, borderRadius: "50%", filter: "blur(120px)",
          top: "15%", left: "-10%",
        }} />
        <div className="pulse-glow" style={{
          position: "absolute", width: 400, height: 400,
          background: "#FF6B9D", opacity: 0.04, borderRadius: "50%", filter: "blur(120px)",
          bottom: "10%", right: "-5%", animationDelay: "1.5s",
        }} />

        <div 
          className="px-8 pt-20 pb-10 lg:px-16 lg:py-20"
          style={{
            position: "relative", zIndex: 1,
            display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
            maxWidth: 560, margin: "0 auto", textAlign: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: "clamp(24px, 6vw, 40px)", marginTop: "clamp(40px, 10vh, 60px)" }}>
            <Image
              src="/logo.png"
              alt="Logo"
              width={72}
              height={72}
              style={{ borderRadius: 16, objectFit: "contain" }}
            />
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 800,
              color: "#F0F4FF", letterSpacing: "-0.04em",
            }}>
              Troca<span style={{ color: "#00AEEF" }}> Stickers</span>
            </span>
          </div>

          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(26px, 6vw, 38px)", fontWeight: 700, color: "#F0F4FF",
            lineHeight: 1.2, letterSpacing: "-0.03em", marginBottom: 16,
          }}>
            A maior comunidade de <br className="hidden lg:block" />
            <span style={{
              background: "linear-gradient(135deg, #00E09E, #00AEEF)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>colecionadores</span>
          </h2>

          <p style={{ color: "#8E9FBF", fontSize: "clamp(14px, 3.5vw, 16px)", lineHeight: 1.6, marginBottom: "clamp(28px, 6vw, 48px)", maxWidth: 400 }}>
            Cria a tua conta gratuita e começa a completar o teu álbum com trocadores próximos.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 380 }}>
            {[
              { icon: BookOpen, text: "Gestão completa do álbum", color: "#00E09E" },
              { icon: MapPin, text: "Encontra trocadores próximos", color: "#FFCA28" },
              { icon: Sparkles, text: "100% gratuito para começar", color: "#8B7BF7" },
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                background: "rgba(255,255,255,0.03)", borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.05)",
                textAlign: "left",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${color}14`, display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#B8C7E0" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Right: Register Form ─── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 24px", position: "relative",
      }}>
        <div className="lg:hidden" style={{
          position: "absolute", width: 500, height: 500,
          background: "var(--success)", opacity: 0.04,
          borderRadius: "50%", filter: "blur(120px)",
          top: "-20%", right: "-15%", pointerEvents: "none",
        }} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 420 }}
        >
          {/* Desktop heading */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 30, fontWeight: 700,
              color: "var(--text-main)", letterSpacing: "-0.03em", marginBottom: 8,
            }}>Criar conta</h1>
            <p style={{ color: "var(--text-sec)", fontSize: 15 }}>É grátis. Começa em segundos.</p>
          </div>

          <div style={{
            background: "var(--card-bg)", border: "1px solid var(--border-color)",
            borderRadius: 24, padding: "36px 32px", boxShadow: "var(--shadow-xl)",
          }}>
            <button onClick={handleGoogle} disabled={loading} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              background: "var(--text-main)", color: "var(--bg-main)",
              fontWeight: 700, fontSize: 14, padding: "16px 24px", borderRadius: 14,
              border: "none", cursor: "pointer", boxShadow: "var(--shadow-md)", marginBottom: 28,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Registar com Google
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
              <div style={{ height: 1, flex: 1, background: "var(--border-color)" }} />
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-muted)" }}>ou com email</span>
              <div style={{ height: 1, flex: 1, background: "var(--border-color)" }} />
            </div>

            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, marginLeft: 2, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Nome completo</label>
                <div style={{ position: "relative" }}>
                  <User size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input type="text" placeholder="O teu nome" value={nome} onChange={(e) => setNome(e.target.value)} required
                    style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--border-color)", borderRadius: 14, padding: "16px 20px 16px 44px", color: "var(--text-main)", fontSize: 14, outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, marginLeft: 2, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Email</label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input type="email" placeholder="nome@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required
                    style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--border-color)", borderRadius: 14, padding: "16px 20px 16px 44px", color: "var(--text-main)", fontSize: 14, outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={{ display: "block", marginBottom: 8, marginLeft: 2, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Palavra-passe</label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required
                    style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--border-color)", borderRadius: 14, padding: "16px 20px 16px 44px", color: "var(--text-main)", fontSize: 14, outline: "none" }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                background: "var(--gradient-success)", color: "#fff",
                fontWeight: 700, fontSize: 15, padding: "16px 24px", borderRadius: 14,
                border: "none", cursor: "pointer",
                boxShadow: "0 8px 24px -4px rgba(0,214,143,0.3)",
              }}>
                {loading ? "A criar conta..." : "Criar Conta Grátis"}
                <ArrowRight size={16} />
              </button>
            </form>
          </div>

          <div style={{ marginTop: 32, textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 14 }}>
              <ShieldCheck size={13} style={{ color: "var(--success)" }} />
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Os teus dados estão protegidos</span>
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
              Já tens conta?{" "}
              <Link href="/login" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
                Inicia sessão
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .lg\\:flex { display: flex !important; }
          .lg\\:block { display: block !important; }
          .lg\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
