import { z } from "zod";

/**
 * SCHEMAS DE VALIDAÇÃO COM ZOD
 * 
 * Reutilizáveis em todos os endpoints da API para validar input
 * Previne: SQL injection, XSS, type coercion attacks, etc.
 */

// ============================================================
// ADMIN ACTIONS
// ============================================================

export const adminUserActionSchema = z.object({
  action: z.enum([
    "ban",
    "unban",
    "suspend",
    "set_premium",
    "set_free",
    "set_admin",
    "remove_admin",
    "update_permissions",
    "delete",
    "impersonate",
  ]),
  userId: z.string().uuid("ID de utilizador inválido"),
  days: z.number().int().positive().optional().default(7),
  reason: z.string().max(500).optional(),
  permissions: z
    .object({
      perm_ban: z.boolean().optional(),
      perm_suspend: z.boolean().optional(),
      perm_delete_user: z.boolean().optional(),
      perm_grant_admin: z.boolean().optional(),
      perm_grant_premium: z.boolean().optional(),
      perm_impersonate: z.boolean().optional(),
      perm_tickets: z.boolean().optional(),
    })
    .optional(),
});

export const adminAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  type: z.enum(["info", "warning", "error", "success"]).optional().default("info"),
  expires_at: z.string().datetime().optional(),
  id: z.string().uuid().optional(), // Para PATCH/DELETE
  active: z.boolean().optional(),
});

// ============================================================
// STRIPE
// ============================================================

export const stripeCheckoutSchema = z.object({
  // Body vazio é OK — tudo vem de session autenticada
});

export const stripeWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
});

// ============================================================
// PUSH NOTIFICATIONS
// ============================================================

export const pushNotificationPayloadSchema = z.object({
  title: z.string().max(200),
  body: z.string().max(500),
  url: z.string().url().optional(),
  icon: z.string().url().optional(),
});

// ============================================================
// CONSENT & PRIVACY
// ============================================================

export const consentLogSchema = z.object({
  consent_type: z.enum(["cookies", "privacy", "terms", "marketing"]),
  consented: z.boolean(),
  terms_version: z.string(),
  userId: z.string().uuid().optional(), // Opcional — pode ser anónimo
});

// ============================================================
// POSTS & REPORTS
// ============================================================

export const postReportSchema = z.object({
  postId: z.string().uuid("ID de post inválido"),
  reason: z.enum([
    "spam",
    "offensive",
    "inappropriate",
    "harassment",
    "misinformation",
    "other",
  ]),
  details: z.string().max(500).optional(),
});

export const supportTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(2000),
  category: z.enum(["bug", "feature", "payment", "account", "other"]).optional(),
});

// ============================================================
// TRADES
// ============================================================

export const tradeOfferSchema = z.object({
  codigo: z.string(),
  quantity: z.number().int().positive(),
});

export const executeTradeSchema = z.object({
  conversation_id: z.string().uuid(),
  user_a_offers: z.array(tradeOfferSchema),
  user_b_offers: z.array(tradeOfferSchema),
});

// ============================================================
// USER ACTIONS
// ============================================================

export const userReportSchema = z.object({
  reported_id: z.string().uuid("ID do utilizador a denunciar inválido"),
  reason: z.enum(["harassment", "spam", "scam", "inappropriate", "other"]),
  details: z.string().max(500).optional(),
});

// ============================================================
// HELPER FUNCTION — Validar e retornar erro se inválido
// ============================================================

export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return { data: validated as T, error: null };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.issues.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
      return { data: null, error: `Validação falhou: ${messages}` };
    }
    return { data: null, error: "Erro ao validar request" };
  }
}

/**
 * USO EM ENDPOINTS:
 * 
 * export async function POST(request: Request) {
 *   const { data, error } = await validateRequest(request, postReportSchema);
 *   if (error) {
 *     return NextResponse.json({ error }, { status: 400 });
 *   }
 *   
 *   // Usar data com type safety
 *   const { postId, reason, details } = data;
 *   // resto do código...
 * }
 */
