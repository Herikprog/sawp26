"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function AuthSessionPage() {
  const [status, setStatus] = useState("A autenticar e a iniciar sessão segura...");
  const supabase = createClient();

  useEffect(() => {
    // Escutar a alteração de estado para apanhar o token do fragmento hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (session) {
        setStatus("Autenticação efetuada com sucesso! A redirecionar...");
        window.location.href = "/dashboard";
      }
    });

    // Timeout de segurança caso o evento demore ou precise de verificação manual
    const timeout = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setStatus("Sessão ativa confirmada! A redirecionar...");
        window.location.href = "/dashboard";
      } else {
        setStatus("Erro ao processar login. Por favor tente novamente.");
        setTimeout(() => {
          window.location.href = "/login?error=auth_error";
        }, 1500);
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
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
      <p style={{ fontSize: 14, color: "var(--text-sec)" }}>{status}</p>
    </div>
  );
}
