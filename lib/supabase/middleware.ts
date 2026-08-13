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
  } = await supabase.auth.getUser();

  const isPublicRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/manifest.json") ||
    request.nextUrl.pathname.startsWith("/icons") ||
    request.nextUrl.pathname.startsWith("/sw.js");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Cuentas creadas por auto-registro quedan sin acceso hasta que un
  // administrador las apruebe manualmente en el dashboard de Supabase
  // (Authentication > Users > editar > User Metadata > "approved": true).
  const isPendingRoute = request.nextUrl.pathname.startsWith(
    "/cuenta-pendiente",
  );
  if (user && user.user_metadata?.approved !== true) {
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
