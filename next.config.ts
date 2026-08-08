import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

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
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);
