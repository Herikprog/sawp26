import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CookieBanner } from "@/components/CookieBanner";

export const metadata: Metadata = {
  title: "Troca Stickers — Troca de Figurinhas da Copa do Mundo 2026",
  description:
    "O marketplace social de figurinhas da Copa do Mundo 2026. Encontra trocadores perto de ti, faz match automático e completa o teu álbum!",
  keywords: "figurinhas, copa do mundo, 2026, troca, álbum, panini, troca stickers",
  openGraph: {
    title: "Troca Stickers — Figurinhas da Copa 2026",
    description: "Marketplace social de figurinhas com geolocalização e match automático.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased selection:bg-[#00AEEF] selection:text-white">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "var(--card-bg)",
                color: "var(--text-main)",
                border: "1px solid var(--border-color)",
                borderRadius: "20px",
                fontSize: "14px",
                padding: "16px 24px",
              },
            }}
          />
          <CookieBanner />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
