import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const PROTECTED_PATHS = ["/api/admin", "/(app)"];
const PUBLIC_AUTH_PATHS = ["/login", "/register", "/auth", "/termos", "/privacidade", "/banned"];

/**
 * MIDDLEWARE DE AUTENTICAÇÃO GLOBAL
 * 
 * Proteções implementadas:
 * - Valida autenticação em rotas protegidas
 * - Impõe session timeout (30 min inatividade)
 * - Valida permissões admin antes de aceder a /api/admin
 * - Refresh token rotation automática
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. PATHS PÚBLICOS — sem autenticação necessária
  if (PUBLIC_AUTH_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2. PATHS PROTEGIDOS — requerem autenticação
  if (PROTECTED_PATHS.some(p => pathname.startsWith(p))) {
    try {
      const cookieStore = await cookies();
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            },
          },
        }
      );

      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        // Sem autenticação — redirecionar para login
        return NextResponse.redirect(new URL("/login", request.url));
      }

      // 3. VALIDAR SESSION TIMEOUT (30 min inatividade)
      const lastActivityStr = cookieStore.get("x-last-activity")?.value;
      if (lastActivityStr) {
        const lastActivity = parseInt(lastActivityStr);
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivity;

        if (timeSinceLastActivity > 30 * 60 * 1000) {
          // Session expirada por inatividade
          await supabase.auth.signOut();
          return NextResponse.redirect(new URL("/login?expired=true", request.url));
        }
      }

      // 4. PARA ROTAS ADMIN — validar permissões
      if (pathname.startsWith("/api/admin")) {
        const adminResponse = await validateAdminAccess(session.user.id, request);
        if (adminResponse) {
          return adminResponse; // Erro de permissão
        }
      }

      // 5. ATUALIZAR TIMESTAMP DE ATIVIDADE
      const response = NextResponse.next();
      response.cookies.set("x-last-activity", Date.now().toString(), {
        httpOnly: true,
        maxAge: 30 * 60, // 30 min
        path: "/",
      });

      return response;
    } catch (err) {
      console.error("[Middleware] Erro ao validar autenticação:", err);
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

/**
 * Validar que utilizador é admin antes de aceder a /api/admin/*
 */
async function validateAdminAccess(userId: string, request: NextRequest): Promise<NextResponse | null> {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: "Forbidden — Admin access required" },
        { status: 403 }
      );
    }

    return null; // OK, é admin
  } catch (err) {
    console.error("[Middleware] Erro ao validar admin:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public|flags).*)",
  ],
};
