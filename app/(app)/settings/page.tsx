"use client";

import { useState, useEffect } from "react";
import { Bell, Lock, Moon, Sun, Smartphone, ChevronRight, LogOut, Users, Shield, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import Link from "next/link";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Load simulated preferences from localStorage
    const savedNotifs = localStorage.getItem("swap26_notifs");
    const savedPublic = localStorage.getItem("swap26_public");
    
    if (savedNotifs !== null) setNotifications(savedNotifs === "true");
    if (savedPublic !== null) setPublicProfile(savedPublic === "true");
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function toggleNotifications() {
    const next = !notifications;
    setNotifications(next);
    localStorage.setItem("swap26_notifs", String(next));
    toast.success(next ? "Notificações ligadas!" : "Notificações desligadas", { icon: next ? "🔔" : "🔕" });
  }

  function togglePublicProfile() {
    const next = !publicProfile;
    setPublicProfile(next);
    localStorage.setItem("swap26_public", String(next));
    toast.success(next ? "Perfil agora é público!" : "Perfil agora é privado!", { icon: next ? "🌍" : "🔒" });
  }

  function handleComingSoon(feature: string) {
    toast(`A página de ${feature} estará disponível na próxima atualização!`, { icon: "🚧" });
  }

  function handleInstallApp() {
    toast.success("Instruções de instalação PWA abertas (Simulação)", { icon: "📱" });
  }

  function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
    return (
      <button
        onClick={onChange}
        style={{
          width: 46, height: 26, borderRadius: 13, border: "none",
          background: value ? "var(--primary)" : "var(--input-bg)",
          position: "relative", cursor: "pointer", transition: "background 0.25s ease",
          flexShrink: 0
        }}
        aria-checked={value}
        role="switch"
      >
        <div style={{
          width: 20, height: 20, borderRadius: 10,
          background: "white", position: "absolute", top: 3,
          left: value ? 23 : 3,
          transition: "left 0.2s ease",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)"
        }} />
      </button>
    );
  }

  function Row({
    icon: Icon, label, desc, right, iconColor = "var(--text-sec)", iconBg = "var(--input-bg)", onClick
  }: {
    icon: any; label: string; desc: string;
    right: React.ReactNode;
    iconColor?: string; iconBg?: string;
    onClick?: () => void;
  }) {
    return (
      <div 
        onClick={onClick}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", gap: 16, cursor: onClick ? "pointer" : "default"
        }}
        className={onClick ? "hover-row" : ""}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: iconBg, display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <Icon size={18} style={{ color: iconColor }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)", marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>{desc}</p>
          </div>
        </div>
        {right}
      </div>
    );
  }

  function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div>
        <p style={{
          fontSize: 10, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: 10, paddingLeft: 4
        }}>
          {title}
        </p>
        <div style={{
          background: "var(--card-bg)", borderRadius: 20,
          border: "1px solid var(--border-color)", overflow: "hidden"
        }}>
          {children}
        </div>
      </div>
    );
  }

  const Divider = () => <div style={{ height: 1, background: "var(--border-color)", margin: "0 20px" }} />;

  // Prevent hydration mismatch on theme
  if (!mounted) return null;
  const isDark = theme === "dark";

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px", paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 8 }}>
          Configuração
        </p>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.03em" }}>
          Definições
        </h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ─── Conta ─── */}
        <SectionCard title="Conta">
          <Link href="/profile" style={{ textDecoration: "none" }}>
            <Row
              icon={Users}
              label="O Meu Perfil"
              desc="Editar nome, foto, cidade e bio"
              iconColor="var(--primary)"
              iconBg="var(--primary-light)"
              right={
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)" }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Editar</span>
                  <ChevronRight size={16} />
                </div>
              }
            />
          </Link>
          <Divider />
          <Row
            icon={Globe}
            label="Perfil Público"
            desc="Outros colecionadores podem ver o teu perfil"
            right={<Toggle value={publicProfile} onChange={togglePublicProfile} />}
          />
          <Divider />
          <Row
            icon={Bell}
            label="Notificações"
            desc="Alertas de chat, matches e novidades"
            right={<Toggle value={notifications} onChange={toggleNotifications} />}
          />
        </SectionCard>

        {/* ─── Aparência ─── */}
        <SectionCard title="Aparência">
          <Row
            icon={isDark ? Moon : Sun}
            label="Tema"
            desc={isDark ? "Modo escuro ativo — Clica para mudar para claro" : "Modo claro ativo — Clica para mudar para escuro"}
            iconColor={isDark ? "#8b5cf6" : "var(--warning)"}
            iconBg={isDark ? "rgba(139,92,246,0.12)" : "var(--warning-light)"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            right={
              <button
                style={{
                  background: "var(--input-bg)", border: "1px solid var(--border-color)",
                  borderRadius: 10, padding: "6px 14px", cursor: "pointer", pointerEvents: "none",
                  fontSize: 13, fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 6
                }}
              >
                {isDark ? <><Sun size={14} /> Claro</> : <><Moon size={14} /> Escuro</>}
              </button>
            }
          />
        </SectionCard>

        {/* ─── Privacidade ─── */}
        <SectionCard title="Privacidade e Segurança">
          <Row
            icon={Lock}
            label="Privacidade"
            desc="Controla quem pode ver a tua localização"
            onClick={() => handleComingSoon("Privacidade")}
            right={<ChevronRight size={16} style={{ color: "var(--text-muted)" }} />}
          />
          <Divider />
          <Row
            icon={Shield}
            label="Segurança"
            desc="Gerir palavra-passe e sessões ativas"
            onClick={() => handleComingSoon("Segurança")}
            right={<ChevronRight size={16} style={{ color: "var(--text-muted)" }} />}
          />
        </SectionCard>

        {/* ─── App ─── */}
        <SectionCard title="Aplicação">
          <Row
            icon={Smartphone}
            label="Instalar App"
            desc="Adicionar ao ecrã principal do dispositivo"
            onClick={handleInstallApp}
            right={
              <span style={{
                fontSize: 10, fontWeight: 800, color: "var(--primary)",
                background: "var(--primary-light)", padding: "4px 10px",
                borderRadius: 8, textTransform: "uppercase", whiteSpace: "nowrap"
              }}>
                PWA
              </span>
            }
          />
        </SectionCard>

        {/* ─── Terminar Sessão ─── */}
        <button
          onClick={handleLogout}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: "15px", borderRadius: 16,
            background: "transparent", border: "1px solid rgba(238,50,78,0.25)",
            color: "var(--danger)", fontWeight: 700, fontSize: 14,
            cursor: "pointer", transition: "all 0.2s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(238,50,78,0.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut size={18} />
          Terminar Sessão
        </button>

        {/* Version */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Swap26 — Copa do Mundo 2026 · v1.2.0</p>
        </div>

      </div>
    </div>
  );
}
