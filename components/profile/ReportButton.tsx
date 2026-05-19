"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import ReportModal from "./ReportModal";

interface ReportButtonProps {
  reportedId: string;
  reportedName: string;
}

export default function ReportButton({ reportedId, reportedName }: ReportButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setModalOpen(true)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          background: "var(--danger-light)", color: "var(--danger)", fontWeight: 600, fontSize: 14,
          padding: "14px 24px", borderRadius: 16, border: "1px solid rgba(255,77,106,0.2)",
          cursor: "pointer", transition: "all 0.2s ease", width: "100%"
        }}
        className="hover:bg-[var(--danger)] hover:text-white"
      >
        <Shield size={16} /> Denunciar
      </button>

      <ReportModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        reportedId={reportedId}
        reportedName={reportedName}
      />
    </>
  );
}
