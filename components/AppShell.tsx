"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { UpdateModal } from "./UpdateModal";
import { AppUpdateProvider } from "@/lib/app-update-context";

export function AppShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AppUpdateProvider>
      <div className="flex h-dvh overflow-hidden">
        {/* Barra superior solo en mobile: hamburguesa para abrir el menú */}
        <div className="fixed inset-x-0 top-0 z-20 flex items-center gap-3 border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden dark:border-neutral-800 dark:bg-neutral-950/95">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="text-neutral-700 dark:text-neutral-200"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-6 w-6"
            >
              <path
                d="M4 6h16M4 12h16M4 18h16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span className="font-semibold text-emerald-800 dark:text-emerald-400">
            GAVAC
          </span>
        </div>

        {/* Fondo oscuro al abrir el menú en mobile */}
        {open && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar: drawer deslizable en mobile, fijo y siempre visible en desktop.
            Usamos la propiedad transform (arbitraria, [transform:...]) en vez
            de las utilidades translate-x-* de Tailwind, que compilan a la
            propiedad CSS `translate` en vez de `transform`. */}
        <div
          className={`fixed inset-y-0 left-0 z-40 transition-transform duration-200 md:static md:!transform-none ${
            open ? "" : "[transform:translateX(-100%)]"
          }`}
        >
          <Sidebar
            userEmail={userEmail}
            onNavigate={() => setOpen(false)}
            onClose={() => setOpen(false)}
          />
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto pt-14 md:pt-0">
          {children}
        </div>
      </div>

      <UpdateModal />
    </AppUpdateProvider>
  );
}
