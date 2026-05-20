"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, MapPin, Star, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { useSearchParams } from "next/navigation";

import { Suspense } from "react";

import PremiumPaywallOverlay from "@/components/PremiumPaywallOverlay";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function searchUsers() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, nome, username, avatar_url, cidade, reputacao, total_trocas, is_online")
        .or(`nome.ilike.%${debouncedQuery}%,username.ilike.%${debouncedQuery}%`)
        .limit(20);
        
      if (data) setResults(data);
      setLoading(false);
    }
    
    searchUsers();
  }, [debouncedQuery]);

  return (
    <PremiumPaywallOverlay
      pageName="Pesquisa de Colecionadores"
      explanation="Pesquisa por outros colecionadores em qualquer parte do país para encontrar figurinhas em falta e propor trocas diretas!"
      benefits={[
        "Pesquisa avançada por nome, username ou cidade",
        "Visualização de estatísticas de reputação e trocas dos utilizadores",
        "Acesso direto ao perfil público dos colecionadores",
        "Filtragem instantânea e atualizações em tempo real"
      ]}
    >
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 100px" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 800, color: "var(--text-main)", marginBottom: 8 }}>
            Pesquisa
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 15 }}>Encontra outros colecionadores para trocares figurinhas.</p>
        </div>

        <div style={{ position: "relative", marginBottom: 32 }}>
          <div style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Pesquisar por nome ou @username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%", height: 60, padding: "0 24px 0 54px", fontSize: 16,
              background: "var(--card-bg)", color: "var(--text-main)",
              border: "1px solid var(--border-color)", borderRadius: 24,
              outline: "none", boxShadow: "0 8px 24px -8px rgba(0,0,0,0.2)",
              transition: "all 0.2s ease"
            }}
            className="focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(0,174,239,0.1)]"
          />
          {loading && (
            <div style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", color: "var(--primary)" }}>
              <span className="animate-spin inline-block w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {results.length > 0 ? (
            results.map((user) => (
              <Link key={user.id} href={`/profile/${user.id}`} style={{
                display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
                background: "var(--card-bg)", borderRadius: 20, border: "1px solid var(--border-color)",
                textDecoration: "none", transition: "all 0.2s ease"
              }} className="hover:scale-[1.02] hover:border-[var(--primary-light)]">
                <div style={{ position: "relative" }}>
                  {user.avatar_url ? (
                    <Image src={user.avatar_url} alt={user.nome} width={56} height={56} style={{ borderRadius: 16, objectFit: "cover" }} />
                  ) : (
                    <div style={{
                      width: 56, height: 56, borderRadius: 16, background: "var(--input-bg)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, fontWeight: 700, color: "var(--primary)"
                    }}>
                      {user.nome[0]?.toUpperCase()}
                    </div>
                  )}
                  {user.is_online && (
                    <div style={{ position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: "50%", background: "var(--success)", border: "3px solid var(--card-bg)" }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8 }}>
                    {user.nome} <span style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 500 }}>@{user.username || "user"}</span>
                  </p>
                  <div style={{ display: "flex", gap: 16, marginTop: 4, color: "var(--text-muted)", fontSize: 13 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {user.cidade || "Oculto"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--warning)" }}><Star size={12} /> {user.reputacao.toFixed(1)}</span>
                  </div>
                </div>
              </Link>
            ))
          ) : query.trim() && !loading ? (
            <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-muted)" }}>
              <User size={48} style={{ margin: "0 auto 16px", opacity: 0.2 }} />
              <p style={{ fontSize: 16, fontWeight: 600 }}>Nenhum utilizador encontrado com "{query}"</p>
            </div>
          ) : null}
        </div>
      </div>
    </PremiumPaywallOverlay>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>A carregar pesquisa...</div>}>
      <SearchContent />
    </Suspense>
  );
}
