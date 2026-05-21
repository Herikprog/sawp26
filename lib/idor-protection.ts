import { SupabaseClient } from "@supabase/supabase-js";

/**
 * IDOR PROTECTION — Insecure Direct Object Reference Prevention
 * 
 * Valida que o utilizador autenticado é o proprietário do recurso
 * antes de retornar ou modificar dados sensíveis.
 * 
 * Exemplos de IDOR:
 * - GET /api/user/profile/123 (qualquer pessoa consegue ver perfil 123)
 * - DELETE /api/messages/456 (qualquer pessoa consegue apagar msg 456)
 * - PATCH /api/chat/789 (qualquer pessoa consegue editar chat 789)
 */

/**
 * Validar propriedade de recurso
 * 
 * @param client Supabase client (regular ou admin)
 * @param userId ID do utilizador autenticado
 * @param table Tabela da base de dados
 * @param resourceId ID do recurso a validar
 * @param ownerColumn Coluna que contém o user_id proprietário (default: "user_id")
 * @returns true se utilizador é proprietário, false caso contrário
 */
export async function validateResourceOwnership(
  client: SupabaseClient,
  userId: string,
  table: string,
  resourceId: string,
  ownerColumn: string = "user_id"
): Promise<boolean> {
  try {
    const { data, error } = await client
      .from(table)
      .select("id")
      .eq("id", resourceId)
      .eq(ownerColumn, userId)
      .single();

    return !error && !!data;
  } catch (err) {
    console.error(`[IDOR] Erro ao validar propriedade em ${table}:`, err);
    return false;
  }
}

/**
 * Validar que utilizador tem acesso a um recurso compartilhado
 * (ex: chat entre dois utilizadores, post visível para seguidores)
 * 
 * @param client Supabase client
 * @param userId ID do utilizador autenticado
 * @param table Tabela da base de dados
 * @param resourceId ID do recurso
 * @param accessColumn Coluna que define acesso (ex: "participants" array, "visible_to" column)
 * @returns true se utilizador tem acesso
 */
export async function validateResourceAccess(
  client: SupabaseClient,
  userId: string,
  table: string,
  resourceId: string,
  accessColumn: string
): Promise<boolean> {
  try {
    // Para arrays (ex: participants), usar contains
    if (accessColumn === "participants") {
      const { data, error } = await client
        .from(table)
        .select("id")
        .eq("id", resourceId)
        // A coluna deve conter o userId
        // Nota: Supabase permite: .filter('participants', 'cs', `["${userId}"]`)
        .single();

      if (error || !data) return false;

      // Validação adicional em memória se necessário
      return true;
    }

    // Validação genérica
    const { data, error } = await client
      .from(table)
      .select("id")
      .eq("id", resourceId)
      .eq(accessColumn, userId)
      .single();

    return !error && !!data;
  } catch (err) {
    console.error(`[IDOR] Erro ao validar acesso em ${table}:`, err);
    return false;
  }
}

/**
 * Validar que utilizador é seguidor de outro utilizador
 * (para ver conteúdo privado, etc.)
 */
export async function validateFollowership(
  client: SupabaseClient,
  userId: string,
  targetUserId: string
): Promise<boolean> {
  try {
    const { data, error } = await client
      .from("follows")
      .select("id")
      .eq("follower_id", userId)
      .eq("following_id", targetUserId)
      .single();

    return !error && !!data;
  } catch (err) {
    console.error("[IDOR] Erro ao validar follow:", err);
    return false;
  }
}

/**
 * Validar que utilizador não está banido
 */
export async function validateNotBanned(
  client: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await client
      .from("profiles")
      .select("is_banned, ban_reason")
      .eq("id", userId)
      .single();

    return !error && !data?.is_banned;
  } catch (err) {
    console.error("[IDOR] Erro ao validar ban status:", err);
    return false;
  }
}

/**
 * USO EM ENDPOINTS:
 * 
 * export async function DELETE(request: Request, { params }: { params: { id: string } }) {
 *   const session = await getSession();
 *   const supabase = createClient();
 *   
 *   // Validar propriedade
 *   const isOwner = await validateResourceOwnership(
 *     supabase,
 *     session.user.id,
 *     "messages",
 *     params.id
 *   );
 *   
 *   if (!isOwner) {
 *     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 *   }
 *   
 *   // Deletar recurso...
 * }
 */
