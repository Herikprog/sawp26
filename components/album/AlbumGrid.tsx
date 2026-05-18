"use client";

import { useState, useMemo, useEffect } from "react";
import type { Sticker } from "@/types";
import StickerCard from "./StickerCard";
import ProgressBar from "./ProgressBar";
import { Search, Edit3, Check, X, ArrowLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Props {
  stickers: Sticker[];
  userStickers: Record<string, number>;
  readOnly?: boolean;
}

const getFlagByCountry = (name: string) => {
  const n = name.trim().toLowerCase();
  
  // LOCAL LOGOS (public/flags/...)
  if (n.includes("fifa")) return "/flags/fifa.png";
  if (n.includes("coca")) return "/flags/coca-cola.jfif";

  const map: Record<string, string> = {
    "brasil": "br", "portugal": "pt", "argentina": "ar", "frança": "fr", 
    "espanha": "es", "alemanha": "de", "inglaterra": "gb", "itália": "it",
    "méxico": "mx", "canadá": "ca", "estados unidos": "us", "eua": "us", "japão": "jp",
    "uruguai": "uy", "holanda": "nl", "bélgica": "be", "croácia": "hr",
    "marrocos": "ma", "suíça": "ch", "sérvia": "rs", "polónia": "pl",
    "dinamarca": "dk", "senegal": "sn", "coreia do sul": "kr", "gana": "gh",
    "camarões": "cm", "austrália": "au", "tunísia": "tn", "arábia saudita": "sa",
    "irã": "ir", "irão": "ir", "iraque": "iq", "costa rica": "cr", "equador": "ec", "catar": "qa",
    "colômbia": "co", "chile": "cl", "peru": "pe", "nigéria": "ng", "egito": "eg",
    "áfrica do sul": "za", "república tcheca": "cz", "bósnia": "ba", "haiti": "ht",
    "escócia": "gb", "paraguai": "py", "turquia": "tr", "curaçao": "cw",
    "costa do marfim": "ci", "suécia": "se", "suecia": "se", "nova zelândia": "nz", "cabo verde": "cv",
    "uzbequistão": "uz", "panamá": "pa", "panama": "pa", "noruega": "no", "jordânia": "jo", "jordania": "jo",
    "rd congo": "cd", "áustria": "at", "austria": "at", "argélia": "dz", "argelia": "dz"
  };
  
  const code = map[n];
  if (!code) return "https://flagcdn.com/w160/un.png";
  return `https://flagcdn.com/w160/${code}.png`;
};

export default function AlbumGrid({ stickers, userStickers, readOnly }: Props) {
  const [search, setSearch] = useState("");
  const [stickerMap, setStickerMap] = useState(userStickers);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"Todas" | "Faltantes" | "Repetidas">("Todas");

  useEffect(() => {
    setStickerMap(userStickers);
  }, [userStickers]);

  const categories = useMemo(() => {
    const groups: Record<string, Sticker[]> = {};
    (stickers || []).forEach(s => {
      const cat = s.selecao || "Outros";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return groups;
  }, [stickers]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; obtained: number; pct: number }> = {};
    Object.entries(categories).forEach(([name, list]) => {
      const total = list.length;
      const obtained = list.filter(s => (stickerMap[s.id] ?? 0) >= 1).length;
      stats[name] = { total, obtained, pct: Math.round((obtained / total) * 100) };
    });
    return stats;
  }, [categories, stickerMap]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return Object.keys(categories);
    
    return Object.keys(categories).filter(cat => cat.toLowerCase().includes(q));
  }, [categories, search]);

  const globalSearchStickers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || selectedCategory) return [];
    
    let list = (stickers || []).filter(s => 
      s.nome.toLowerCase().includes(q) || 
      s.codigo.toLowerCase().includes(q) || 
      (s.selecao && s.selecao.toLowerCase().includes(q))
    );

    if (activeFilter === "Faltantes") {
      list = list.filter(s => (stickerMap[s.id] ?? 0) === 0);
    } else if (activeFilter === "Repetidas") {
      list = list.filter(s => (stickerMap[s.id] ?? 0) > 1);
    }

    return list;
  }, [stickers, search, selectedCategory, activeFilter, stickerMap]);

  const detailedStickers = useMemo(() => {
    if (!selectedCategory) return [];
    let list = categories[selectedCategory] || [];
    
    // Apply status filter
    if (activeFilter === "Faltantes") {
      list = list.filter(s => (stickerMap[s.id] ?? 0) === 0);
    } else if (activeFilter === "Repetidas") {
      list = list.filter(s => (stickerMap[s.id] ?? 0) > 1);
    }
    
    // Apply text search
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(s => 
      s.nome.toLowerCase().includes(q) || s.codigo.toLowerCase().includes(q)
    );
  }, [categories, selectedCategory, search, activeFilter, stickerMap]);

  const handleUpdate = (id: string, newQty: number) => {
    setStickerMap(prev => ({ ...prev, [id]: newQty }));
  };

  const globalStats = useMemo(() => {
    const total = stickers.length;
    const obtained = stickers.filter(s => (stickerMap[s.id] ?? 0) >= 1).length;
    const duplicates = Object.values(stickerMap).reduce((acc, qty) => acc + (qty > 1 ? qty - 1 : 0), 0);
    const pct = total > 0 ? Number(((obtained / total) * 100).toFixed(1)) : 0;
    
    return {
      total_stickers: total,
      obtained,
      duplicates,
      completion_pct: pct
    };
  }, [stickers, stickerMap]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      
      {/* ─── Global Progress ─── */}
      <ProgressBar stats={globalStats as any} />
      
      {/* ─── Header & Search ─── */}
      <div style={{
        background: "var(--glass-bg)", borderRadius: 22, border: "1px solid var(--glass-border)",
        padding: "20px 24px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center",
        position: "sticky", top: 16, zIndex: 50,
        backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)",
        boxShadow: "var(--shadow-lg)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 260 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
            {selectedCategory && (
              <button 
                onClick={() => setSelectedCategory(null)}
                style={{
                  background: "var(--bg-hover-strong)", border: "1px solid var(--border-color)",
                  color: "var(--text-main)", padding: 10, borderRadius: 10, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar por jogador, seleção ou código..."
                style={{
                  width: "100%", background: "var(--input-bg)", border: "1px solid var(--border-color)",
                  borderRadius: 12, padding: "12px 40px 12px 42px", color: "var(--text-main)", fontSize: 13, outline: "none",
                  transition: "all 0.25s ease",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "var(--bg-hover-strong)", border: "none", color: "var(--text-muted)", cursor: "pointer",
                    padding: 4, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          {(selectedCategory || search.trim() !== "") && (
            <div style={{ display: "flex", gap: 6, marginTop: 10, width: "100%", overflowX: "auto", paddingBottom: 2 }}>
              {["Todas", "Faltantes", "Repetidas"].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter as any)}
                  style={{
                    padding: "6px 14px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                    background: activeFilter === filter ? "var(--gradient-primary)" : "var(--bg-hover-strong)",
                    color: activeFilter === filter ? "#fff" : "var(--text-muted)",
                    border: activeFilter === filter ? "none" : "1px solid var(--border-light)",
                    cursor: "pointer", transition: "all 0.2s ease", whiteSpace: "nowrap",
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {!readOnly && (
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12,
              background: isEditMode ? "var(--gradient-success)" : "var(--bg-hover-strong)",
              color: isEditMode ? "#fff" : "var(--text-main)",
              border: isEditMode ? "none" : "1px solid var(--border-color)",
              fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.25s ease",
              alignSelf: "flex-start",
              boxShadow: isEditMode ? "0 6px 16px rgba(0,214,143,0.2)" : "none",
            }}
          >
            {isEditMode ? <Check size={14} /> : <Edit3 size={14} />}
            {isEditMode ? "Guardar" : "Edição Rápida"}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!selectedCategory && search.trim() !== "" ? (
          <motion.div key="global-search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-main)" }}>
                Resultados para "{search}"
              </h2>
              <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
                {globalSearchStickers.length} figurinhas
              </span>
            </div>
            
            {globalSearchStickers.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 24 }}>
                {globalSearchStickers.map(s => (
                  <StickerCard key={s.id} sticker={s} quantity={stickerMap[s.id] ?? 0} onUpdate={handleUpdate} isEditMode={isEditMode} readOnly={readOnly} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-muted)" }}>
                Nenhuma figurinha ou seleção encontrada para "{search}".
              </div>
            )}
          </motion.div>
        ) : !selectedCategory ? (
          <motion.div key="cat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {filteredCategories.map(cat => {
              const stats = categoryStats[cat];
              const isSpecial = cat.toLowerCase().includes("fifa") || cat.toLowerCase().includes("coca");
              const progressColor = stats.pct === 100 ? "var(--gradient-gold)" : stats.pct >= 50 ? "var(--gradient-success)" : "var(--gradient-primary)";
              
              return (
                <div
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="dashboard-action-card"
                  style={{
                    background: "var(--card-bg)", borderRadius: 22, padding: "22px",
                    cursor: "pointer", border: "1px solid var(--border-color)",
                    boxShadow: "var(--shadow-sm)", position: "relative", overflow: "hidden",
                  }}
                >
                  {stats.pct === 100 && (
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0, height: 3,
                      background: "var(--gradient-gold)",
                    }} />
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                    <div style={{
                      width: 52, height: 36, borderRadius: 8, overflow: "hidden",
                      position: "relative", background: isSpecial ? "var(--text-main)" : "var(--input-bg)",
                      border: "1px solid var(--border-light)", flexShrink: 0,
                    }}>
                      <Image src={getFlagByCountry(cat)} alt={cat} fill sizes="100px" style={{ objectFit: isSpecial ? "contain" : "cover", padding: isSpecial ? 4 : 0 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cat}</h3>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{stats.obtained}/{stats.total}</span>
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: 800, color: stats.pct === 100 ? "var(--warning)" : "var(--primary)",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}>{stats.pct}%</span>
                  </div>
                  <div style={{ height: 5, background: "var(--input-bg)", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", background: progressColor,
                      width: `${stats.pct}%`, borderRadius: 10,
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div key="det" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(125px, 1fr))", gap: 18 }}>
              {detailedStickers.map(s => <StickerCard key={s.id} sticker={s} quantity={stickerMap[s.id] ?? 0} onUpdate={handleUpdate} isEditMode={isEditMode} readOnly={readOnly} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
