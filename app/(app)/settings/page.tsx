"use client";

import { useState, useEffect } from "react";
import { Bell, Lock, Moon, Sun, Smartphone, ChevronRight, LogOut, Users, Shield, Globe, Settings as SettingsIcon, MapPin, Download, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import Link from "next/link";
import toast from "react-hot-toast";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function SettingsPage() {
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const { subscribeToPushNotifications, unsubscribeFromPushNotifications } = usePushNotifications();
  
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [locationConsent, setLocationConsent] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load simulated preferences from localStorage
    const savedNotifs = localStorage.getItem("trocastickers_notifs");
    const savedPublic = localStorage.getItem("trocastickers_public");
    const savedLocation = localStorage.getItem("trocastickers_location_consent");
    
    if (savedNotifs !== null) setNotifications(savedNotifs === "true");
    if (savedPublic !== null) setPublicProfile(savedPublic === "true");
    if (savedLocation !== null) setLocationConsent(savedLocation === "true");
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function toggleNotifications() {
    const next = !notifications;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (next) {
        const success = await subscribeToPushNotifications(user.id);
        if (!success) {
          toast.error("Não foi possível ativar as notificações no browser.");
          return;
        }
      } else {
        await unsubscribeFromPushNotifications(user.id);
      }
    }

    setNotifications(next);
    localStorage.setItem("trocastickers_notifs", String(next));
    toast.success(next ? "Notificações ligadas!" : "Notificações desligadas", { icon: next ? "🔔" : "🔕" });
  }

  function togglePublicProfile() {
    const next = !publicProfile;
    setPublicProfile(next);
    localStorage.setItem("trocastickers_public", String(next));
    toast.success(next ? "Perfil agora é público!" : "Perfil agora é privado!", { icon: next ? "🌍" : "🔒" });
  }

  function handleComingSoon(feature: string) {
    toast(`A página de ${feature} estará disponível na próxima atualização!`, { icon: "🚧" });
  }

  function handleInstallApp() {
    toast.success("Instruções de instalação PWA abertas (Simulação)", { icon: "📱" });
  }

  async function toggleLocationConsent() {
    const next = !locationConsent;
    setLocationConsent(next);
    localStorage.setItem("trocastickers_location_consent", String(next));
    toast.success(next ? "Geolocalização ativada!" : "Geolocalização desativada!", { icon: next ? "📍" : "🚫" });
  }

  async function handleExportData() {
    try {
      setExporting(true);
      toast.loading("A preparar a exportação dos teus dados...", { id: "export" });
      const res = await fetch("/api/user/export-data");
      
      if (!res.ok) {
        throw new Error("Falha ao exportar os dados.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const disposition = res.headers.get('Content-Disposition');
      let filename = "dados_pessoais.json";
      if (disposition && disposition.indexOf('filename=') !== -1) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
          if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Dados exportados com sucesso!", { id: "export" });
    } catch (err: any) {
      toast.error(err.message, { id: "export" });
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm("⚠️ ATENÇÃO: Esta ação é irreversível. Todos os teus dados, figurinhas e mensagens serão eliminados permanentemente. Queres mesmo apagar a tua conta?")) {
      return;
    }

    try {
      setDeleting(true);
      toast.loading("A apagar a conta...", { id: "delete" });
      const res = await fetch("/api/user/delete-account", { method: "POST" });
      
      if (!res.ok) {
        throw new Error("Falha ao apagar conta.");
      }

      toast.success("Conta eliminada com sucesso.", { id: "delete" });
      await supabase.auth.signOut();
      window.location.href = "/register";
    } catch (err: any) {
      toast.error(err.message, { id: "delete" });
      setDeleting(false);
    }
  }

  function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
    return (
      <button
        onClick={onChange}
        style={{
          width: 46, height: 26, borderRadius: 13, border: "none",
          background: value ? "var(--gradient-primary)" : "var(--input-bg)",
          position: "relative", cursor: "pointer", transition: "background 0.3s ease",
          flexShrink: 0, boxShadow: value ? "0 4px 12px rgba(0,153,255,0.2)" : "none",
        }}
        aria-checked={value}
        role="switch"
      >
        <div style={{
          width: 20, height: 20, borderRadius: 10,
          background: "white", position: "absolute", top: 3,
          left: value ? 23 : 3,
          transition: "left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
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
          padding: "16px 20px", gap: 14, cursor: onClick ? "pointer" : "default",
          transition: "background 0.2s ease",
        }}
        className={onClick ? "hover-row" : ""}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: iconBg, display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon size={17} style={{ color: iconColor }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)", marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{desc}</p>
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
          letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: 10, paddingLeft: 4,
        }}>
          {title}
        </p>
        <div style={{
          background: "var(--card-bg)", borderRadius: 20,
          border: "1px solid var(--border-color)", overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
        }}>
          {children}
        </div>
      </div>
    );
  }

  const Divider = () => <div style={{ height: 1, background: "var(--border-light)", margin: "0 20px" }} />;

  // Prevent hydration mismatch on theme
  if (!mounted) return null;
  const isDark = theme === "dark";

  return (
    <div className="pattern-bg" style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px", paddingBottom: 100, position: "relative" }}>
      {/* Ambient */}
      <div className="orb" style={{ top: -100, left: -60, width: 300, height: 300, background: "var(--secondary)", opacity: 0.03 }} />

      {/* Header */}
      <div style={{ marginBottom: 36, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <SettingsIcon size={14} style={{ color: "var(--text-muted)" }} />
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)" }}>
            Configuração
          </p>
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.03em" }}>
          Definições
        </h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22, position: "relative", zIndex: 1 }}>

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
                  <span style={{ fontSize: 11, fontWeight: 600 }}>Editar</span>
                  <ChevronRight size={14} />
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
            desc={isDark ? "Modo escuro ativo — Clica para mudar" : "Modo claro ativo — Clica para mudar"}
            iconColor={isDark ? "#8B7BF7" : "var(--warning)"}
            iconBg={isDark ? "rgba(139,123,247,0.12)" : "var(--warning-light)"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            right={
              <button
                style={{
                  background: "var(--input-bg)", border: "1px solid var(--border-color)",
                  borderRadius: 10, padding: "6px 14px", cursor: "pointer", pointerEvents: "none",
                  fontSize: 12, fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {isDark ? <><Sun size={13} /> Claro</> : <><Moon size={13} /> Escuro</>}
              </button>
            }
          />
        </SectionCard>

        {/* ─── Privacidade e Segurança (Conformidade GDPR / LGPD) ─── */}
        <SectionCard title="Privacidade e Dados">
          <Row
            icon={MapPin}
            label="Geolocalização"
            desc="Permitir acesso à localização para encontros"
            right={<Toggle value={locationConsent} onChange={toggleLocationConsent} />}
          />
          <Divider />
          <Row
            icon={Download}
            label="Exportar os meus dados"
            desc="Receber uma cópia JSON de todos os dados"
            onClick={exporting ? undefined : handleExportData}
            right={
              <span style={{ fontSize: 13, color: "var(--primary)", fontWeight: 700 }}>
                {exporting ? "A processar..." : "Descarregar"}
              </span>
            }
          />
          <Divider />
          <Row
            icon={Trash2}
            label="Apagar conta"
            desc="Eliminação permanente e irreversível"
            iconColor="var(--danger)"
            iconBg="var(--danger-light)"
            onClick={deleting ? undefined : handleDeleteAccount}
            right={
              <span style={{ fontSize: 13, color: "var(--danger)", fontWeight: 700 }}>
                {deleting ? "A apagar..." : "Apagar"}
              </span>
            }
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
                fontSize: 9, fontWeight: 800, color: "var(--primary)",
                background: "var(--primary-light)", padding: "4px 10px",
                borderRadius: 8, textTransform: "uppercase", whiteSpace: "nowrap",
                border: "1px solid var(--primary-light-strong)",
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
            background: "var(--danger-light)", border: "1px solid rgba(255,77,106,0.15)",
            color: "var(--danger)", fontWeight: 700, fontSize: 14,
            cursor: "pointer", transition: "all 0.25s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,77,106,0.12)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--danger-light)"; }}
        >
          <LogOut size={16} />
          Terminar Sessão
        </button>

        {/* Version */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Troca Stickers — Copa do Mundo 2026 · v2.0.0
          </p>
        </div>

      </div>
    </div>
  );
}
