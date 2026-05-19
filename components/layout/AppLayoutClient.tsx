"use client";

import { usePathname } from "next/navigation";

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChatRoom = pathname.startsWith("/chat/") && pathname !== "/chat";

  return (
    <div style={{
      width: "100%", height: "100%",
      overflowY: isChatRoom ? "hidden" : "auto", 
      overflowX: "hidden",
      position: "relative", zIndex: 1,
    }}>
      {/* Top spacer for mobile top-nav */}
      {!isChatRoom && <div className="md:hidden" style={{ height: 64 }} />}
      {children}
    </div>
  );
}
