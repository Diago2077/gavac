import type { NextConfig } from "next";
import withPWAInit, {
  runtimeCaching as defaultRuntimeCaching,
} from "@ducanh2912/next-pwa";

// Las estrategias NetworkFirst para navegación de páginas ("pages",
// "pages-rsc", "pages-rsc-prefetch") vienen por defecto SIN
// networkTimeoutSeconds -- eso significa que si el celular vuelve de estar
// en segundo plano/inactivo con la red en un estado raro, el service worker
// espera indefinidamente la respuesta de red antes de recurrir al caché, y
// la app queda "colgada" sin responder a ningún click. Le agregamos un
// timeout para que, pasados 10s sin respuesta, caiga al contenido cacheado
// en vez de trabarse para siempre.
const NETWORK_TIMEOUT_CACHE_NAMES = new Set([
  "pages",
  "pages-rsc",
  "pages-rsc-prefetch",
]);

const runtimeCaching = defaultRuntimeCaching.map((entry) => {
  const cacheName = entry.options?.cacheName;
  if (cacheName && NETWORK_TIMEOUT_CACHE_NAMES.has(cacheName)) {
    return {
      ...entry,
      options: { ...entry.options, networkTimeoutSeconds: 10 },
    };
  }
  return entry;
});

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  // Registramos el service worker nosotros mismos (ver lib/app-update-context.tsx)
  // para poder detectar cuándo hay una versión nueva esperando y mostrar el
  // modal de actualización, en vez de que el plugin la aplique en silencio.
  register: false,
  // La entrada especial "start-url" (para "/") tampoco tiene timeout y no
  // se puede sobreescribir vía runtimeCaching -- la desactivamos, así "/"
  // queda cubierto por la estrategia genérica "pages" de arriba (con
  // timeout).
  dynamicStartUrl: false,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching,
  },
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);
