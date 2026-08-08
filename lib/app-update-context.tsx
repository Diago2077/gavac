"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Workbox } from "workbox-window";

declare global {
  interface Window {
    // Inyectado por @ducanh2912/next-pwa cuando register:false (ver next.config.ts).
    workbox?: Workbox;
  }
}

type AppUpdateContextValue = {
  updateAvailable: boolean;
  checking: boolean;
  applyUpdate: () => void;
  checkForUpdate: () => void;
};

const AppUpdateContext = createContext<AppUpdateContextValue | null>(null);

export function AppUpdateProvider({ children }: { children: ReactNode }) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const updateAvailableRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;
    let attempts = 0;

    function setup(wb: Workbox) {
      wb.addEventListener("waiting", () => {
        updateAvailableRef.current = true;
        setUpdateAvailable(true);
      });
      wb.addEventListener("controlling", () => {
        window.location.reload();
      });
      wb.register();
    }

    // El plugin PWA inyecta window.workbox de forma asincrónica en un script
    // aparte; reintentamos un rato por si nuestro efecto corre primero.
    function tryInit() {
      if (cancelled) return;
      if (window.workbox) {
        setup(window.workbox);
        return;
      }
      if (attempts++ < 20) setTimeout(tryInit, 250);
    }
    tryInit();

    return () => {
      cancelled = true;
    };
  }, []);

  function applyUpdate() {
    window.workbox?.messageSkipWaiting();
  }

  function checkForUpdate() {
    setChecking(true);
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.update())
      .catch(() => {})
      .finally(() => {
        // Le damos un instante a que, si encontró un service worker nuevo,
        // dispare el evento "waiting" (updateAvailableRef).
        setTimeout(() => {
          if (updateAvailableRef.current) {
            applyUpdate();
          } else {
            // No había una versión nueva del service worker -- igual
            // recargamos, ya que nuestras páginas son server-rendered y
            // podría haber contenido más nuevo del lado del servidor.
            window.location.reload();
          }
          setChecking(false);
        }, 1000);
      });
  }

  return (
    <AppUpdateContext.Provider
      value={{ updateAvailable, checking, applyUpdate, checkForUpdate }}
    >
      {children}
    </AppUpdateContext.Provider>
  );
}

export function useAppUpdate() {
  const ctx = useContext(AppUpdateContext);
  if (!ctx) {
    throw new Error("useAppUpdate debe usarse dentro de <AppUpdateProvider>");
  }
  return ctx;
}
