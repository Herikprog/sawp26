/**
 * RATE LIMITING — Proteção contra Brute Force, DDoS, Spam
 * 
 * Implementa Token Bucket Algorithm com fallback em memória (dev)
 * Em produção, usar Redis para compartilhar limites entre servidores
 * 
 * Limites:
 * - 100 req/min por IP para endpoints públicos
 * - 10 tentativas de autenticação/min por email
 * - 1000 ações de admin/dia por utilizador
 */

// ============================================================
// IN-MEMORY STORE (Development fallback)
// ============================================================

interface RateLimitBucket {
  tokens: number;
  last_refill: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

/**
 * Token Bucket Algorithm
 * 
 * @param key Identificador único (IP, email, userId)
 * @param capacity Número máximo de tokens
 * @param refillRate Tokens adicionados por segundo
 * @returns { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
  key: string,
  capacity: number,
  refillRate: number
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  let bucket = rateLimitStore.get(key);

  if (!bucket) {
    // Primeira requisição — criar novo bucket cheio
    bucket = {
      tokens: capacity,
      last_refill: now,
    };
    rateLimitStore.set(key, bucket);
  }

  // Calcular quantos tokens adicionar desde última requisição
  const timePassed = (now - bucket.last_refill) / 1000; // em segundos
  const tokensToAdd = timePassed * refillRate;
  bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
  bucket.last_refill = now;

  // Verificar se temos tokens disponíveis
  const allowed = bucket.tokens >= 1;
  if (allowed) {
    bucket.tokens -= 1;
  }

  // Tempo até próxima requisição ficar permitida (segundos)
  const resetIn = allowed ? 0 : (1 - bucket.tokens) / refillRate;

  return {
    allowed,
    remaining: Math.floor(bucket.tokens),
    resetIn: Math.ceil(resetIn),
  };
}

/**
 * Limpar buckets antigos a cada 1 hora para evitar memory leak
 */
setInterval(() => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hora

  for (const [key, bucket] of rateLimitStore) {
    if (now - bucket.last_refill > maxAge) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Executar a cada 5 minutos

// ============================================================
// EXTRACTORES DE CHAVE (identificar o cliente)
// ============================================================

/**
 * Extrair IP do cliente a partir de headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : request.headers.get("x-real-ip") || "127.0.0.1";

  return ip;
}

// ============================================================
// VERIFICADORES DE RATE LIMIT
// ============================================================

export function checkPublicEndpointRateLimit(request: Request) {
  const ip = getClientIp(request);
  return checkRateLimit(`public:${ip}`, 100, 100 / 60); // 100 req/min
}

export function checkAuthEndpointRateLimit(email: string) {
  return checkRateLimit(`auth:${email}`, 10, 10 / 60); // 10 tentativas/min
}

export function checkAdminActionRateLimit(userId: string) {
  return checkRateLimit(`admin:${userId}`, 1000, 1000 / (24 * 60 * 60)); // 1000/dia
}

export function checkPushNotificationRateLimit(request: Request) {
  const ip = getClientIp(request);
  return checkRateLimit(`push:${ip}`, 100, 100 / 60); // 100 notificações/min
}

export function checkConsentRateLimit(userId: string, consentType: string) {
  // Máximo 5 mudanças de consentimento por tipo por dia
  return checkRateLimit(`consent:${userId}:${consentType}`, 5, 5 / (24 * 60 * 60));
}

// ============================================================
// HELPER — Gerar respostas de rate limit
// ============================================================

export function createRateLimitHeaders(limit: ReturnType<typeof checkRateLimit>) {
  return {
    "X-RateLimit-Limit": "100",
    "X-RateLimit-Remaining": Math.max(0, limit.remaining).toString(),
    "X-RateLimit-Reset": (Date.now() + limit.resetIn * 1000).toString(),
    "Retry-After": limit.resetIn.toString(),
  };
}

/**
 * USO EM ENDPOINTS:
 * 
 * export async function POST(request: Request) {
 *   // Verificar rate limit
 *   const limit = checkPublicEndpointRateLimit(request);
 *   if (!limit.allowed) {
 *     return NextResponse.json(
 *       { error: "Too many requests" },
 *       {
 *         status: 429,
 *         headers: createRateLimitHeaders(limit),
 *       }
 *     );
 *   }
 *   
 *   // resto do código...
 * }
 */
