import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "www.fifa.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  // ============================================================
  // SECURITY HEADERS — Implementar Defense in Depth
  // ============================================================
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevent MIME-type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Enable XSS protection (legacy, mas ainda útil)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Disable framing (prevents clickjacking)
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Referrer policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions policy (ex-Feature-Policy)
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), microphone=(), camera=(), payment=()",
          },
          // HSTS — Force HTTPS (ativar após confirmar HTTPS funciona)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
      // CSP — Content Security Policy
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net", // unsafe-eval para Next.js dev, remover em prod
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "media-src 'self' blob:",
              "connect-src 'self' https://flagcdn.com https://upload.wikimedia.org https://www.fifa.com https://*.supabase.co wss://*.supabase.co",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      // Disable FLoC (Google's tracking)
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "interest-cohort=()",
          },
        ],
      },
    ];
  },

  // ============================================================
  // REDIRECT — Desabilitar debug endpoint
  // ============================================================
  async redirects() {
    return [
      // Bloquear acesso ao endpoint debug de push
      {
        source: "/api/push/debug",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
