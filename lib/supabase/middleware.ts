import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refresca la sesión de Supabase en cada request y protege las rutas privadas.
// Se invoca desde proxy.ts (el "middleware" de Next.js 16).
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const isPublicRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/manifest.json") ||
    request.nextUrl.pathname.startsWith("/icons") ||
    request.nextUrl.pathname.startsWith("/sw.js");

  // Si hay cookie de sesión pero getUser() falló, puede ser un error de
  // red transitorio (ej. la PWA recién reconecta a internet al volver de
  // segundo plano) y no una sesión realmente expirada. En ese caso no
  // expulsamos al login: dejamos pasar el request para que no se sienta
  // como un cierre de sesión espontáneo.
  const hasSessionCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

  if (!user && !isPublicRoute) {
    if (hasSessionCookie && userError) {
      return response;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Cuentas nuevas quedan sin acceso hasta que un administrador las
  // apruebe tildando la columna "approved" en la tabla "perfiles"
  // (Table Editor de Supabase).
  const isPendingRoute = request.nextUrl.pathname.startsWith(
    "/cuenta-pendiente",
  );
  let approved = false;
  if (user) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("approved")
      .eq("id", user.id)
      .maybeSingle();
    approved = perfil?.approved === true;
  }
  if (user && !approved) {
    if (!isPendingRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/cuenta-pendiente";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (user && isPendingRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/fincas";
    return NextResponse.redirect(url);
  }

  return response;
}
