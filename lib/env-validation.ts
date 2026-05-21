/**
 * ENV VALIDATION — Verificar que todos os secrets estão configurados
 * Chamado no startup da aplicação para fail-fast
 */

export function validateEnvironment(): void {
  const requiredEnvVars = {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: "URL do Supabase",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "Chave pública do Supabase",
    SUPABASE_SERVICE_ROLE_KEY: "Chave de admin do Supabase (apenas servidor)",

    // Stripe
    NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID: "ID do preço Premium no Stripe",
    STRIPE_SECRET_KEY: "Chave secreta do Stripe (apenas servidor)",
    STRIPE_WEBHOOK_SECRET: "Secret do webhook Stripe (apenas servidor)",

    // Push Notifications
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: "Chave pública VAPID para push",
    VAPID_PRIVATE_KEY: "Chave privada VAPID (apenas servidor)",

    // App
    NEXT_PUBLIC_APP_URL: "URL da aplicação em produção",
  };

  const missing: string[] = [];

  for (const [key, description] of Object.entries(requiredEnvVars)) {
    const value = process.env[key];
    
    if (!value || value.includes("your_")) {
      missing.push(`${key} — ${description}`);
    }

    // Validações adicionais
    if (key === "SUPABASE_SERVICE_ROLE_KEY" && value && value.length < 50) {
      throw new Error(`❌ ${key} parece inválida (muito curta). Verifica a configuração.`);
    }

    if (key === "STRIPE_SECRET_KEY" && value && !value.startsWith("sk_")) {
      throw new Error(`❌ ${key} deve começar com "sk_". Verifica a configuração.`);
    }

    if (key === "VAPID_PRIVATE_KEY" && value && value.length < 50) {
      throw new Error(`❌ ${key} parece inválida (muito curta). Verifica a configuração.`);
    }
  }

  if (missing.length > 0) {
    const message = `
❌ ERRO DE CONFIGURAÇÃO: As seguintes variáveis de ambiente estão ausentes ou inválidas:

${missing.map(m => `  • ${m}`).join("\n")}

Verifica o ficheiro .env.local ou a configuração da Vercel/Netlify.
Consulta o ficheiro .env.example para o formato correto.
    `;
    throw new Error(message);
  }

  console.log("✅ Todas as variáveis de ambiente estão configuradas corretamente.");
}

/**
 * Validar que aplicação está em HTTPS em produção
 */
export function validateHttps(): void {
  if (process.env.NODE_ENV === "production") {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    if (appUrl && !appUrl.startsWith("https://")) {
      console.warn(
        "⚠️ AVISO: NEXT_PUBLIC_APP_URL não usa HTTPS. " +
        "Isto pode causar problemas de segurança em produção."
      );
    }
  }
}
