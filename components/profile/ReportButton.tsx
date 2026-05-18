"use client";

import toast from "react-hot-toast";
import { Shield } from "lucide-react";

export default function ReportButton() {
  return (
    <button 
      onClick={() => toast.success("Denúncia registada e em análise pela equipa de moderação.")}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        background: "var(--danger-light)", color: "var(--danger)", fontWeight: 600, fontSize: 14,
        padding: "14px 24px", borderRadius: 16, border: "1px solid rgba(255,77,106,0.2)",
        cursor: "pointer", transition: "all 0.2s ease"
      }}
      className="hover:bg-[var(--danger)] hover:text-white"
    >
      <Shield size={16} /> Denunciar
    </button>
  );
}
