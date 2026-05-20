import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Rotas que não precisam de sessão nem de assinatura
const PUBLIC_ROUTES = ["/login", "/register", "/auth"];

// Rotas que precisam de sessão mas NÃO precisam de assinatura ativa
const SESSION_ONLY_ROUTES = ["/premium", "/api", "/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Deixar passar rotas públicas, assets e webhooks públicos
  if (
    (PUBLIC_ROUTES.some((r) => pathname.startsWith(r)) && !pathname.startsWith("/banned")) ||
    pathname.startsWith("/api/stripe/webhook") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/flags") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Criar resposta mutável para poder escrever cookies de sessão
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Sem sessão → se for /banned, deixar ver. Se for outra rota, vai para login.
  if (!user) {
    if (pathname.startsWith("/banned")) {
      return response;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Verificar estado do perfil
  const { data: profile } = await supabase
    .from("profiles")
    .select("plano, is_banned, suspended_until, ban_reason, suspend_reason")
    .eq("id", user.id)
    .single();

  const isBanned = profile?.is_banned;
  const isSuspended = profile?.suspended_until && new Date(profile.suspended_until) > new Date();

  // Se o utilizador aceder a /banned mas não estiver banido nem suspenso -> mandar para /dashboard
  if (pathname.startsWith("/banned")) {
    if (!isBanned && !isSuspended) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Se estiver noutra rota e estiver banido -> mandar para /banned
  if (isBanned) {
    const url = request.nextUrl.clone();
    url.pathname = "/banned";
    if (profile?.ban_reason) {
      url.searchParams.set("reason", profile.ban_reason);
    }
    return NextResponse.redirect(url);
  }

  // Se estiver noutra rota e estiver suspenso -> mandar para /banned com ?until=
  if (isSuspended) {
    const url = request.nextUrl.clone();
    url.pathname = "/banned";
    url.searchParams.set("until", profile.suspended_until);
    if (profile?.suspend_reason) {
      url.searchParams.set("reason", profile.suspend_reason);
    }
    return NextResponse.redirect(url);
  }

  // Rotas que só precisam de sessão (admin, api, premium) — sem verificar assinatura
  if (SESSION_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    return response;
  }

  // Allow free users to access the page (contents will be obfuscated at the component level)

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css)).*)",
  ],
};
