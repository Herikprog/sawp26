"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthSessionPage() {
  const [status, setStatus] = useState("A processar início de sessão seguro...");
  const supabase = createClient();

  useEffect(() => {
    async function processHash() {
      try {
        const hash = window.location.hash;
        if (!hash) {
          // Se não há hash, tenta verificar se já existe sessão ativa
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            setStatus("Sessão ativa confirmada! A redirecionar...");
            window.location.href = "/dashboard";
          } else {
            setStatus("Sem credenciais de login. A redirecionar para login...");
            window.location.href = "/login";
          }
          return;
        }

        // Parse do fragmento hash (#access_token=...&refresh_token=...)
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (!accessToken || !refreshToken) {
          setStatus("Credenciais inválidas no link. A redirecionar...");
          window.location.href = "/login?error=auth_error";
          return;
        }

        setStatus("A estabelecer nova sessão de moderação...");
        
        // Limpar qualquer cookie/sessão anterior para evitar misturar contas
        await supabase.auth.signOut().catch(() => {});

        // Estabelecer a nova sessão do utilizador impersonado
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) throw error;

        if (data.session) {
          setStatus("Autenticado com sucesso! A entrar no painel do utilizador...");
          // Forçar recarga completa para garantir que todas as instâncias do Supabase e middleware leiam os novos cookies
          window.location.href = "/dashboard";
        } else {
          throw new Error("Sessão não pôde ser criada.");
        }
      } catch (err: any) {
        console.error("Erro no processamento da impersonação:", err);
        setStatus(`Erro ao iniciar sessão: ${err.message || "Erro desconhecido"}`);
        setTimeout(() => {
          window.location.href = "/login?error=auth_error";
        }, 2000);
      }
    }

    processHash();
  }, [supabase]);

  return (
    <div style={{
      minHeight: "100vh", background: "#080b14",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', sans-serif", color: "#fff", gap: 16
    }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        border: "3px solid rgba(0, 174, 239, 0.1)",
        borderTopColor: "var(--primary)",
      }} className="spin" />
      <p style={{ fontSize: 14, color: "#9ca3af" }}>{status}</p>
    </div>
  );
}
