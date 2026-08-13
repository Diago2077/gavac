"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { useAppUpdate } from "@/lib/app-update-context";
import { APP_VERSION } from "@/lib/version";

const NAV_ITEMS = [
  {
    href: "/fincas",
    label: "Fincas",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="h-5 w-5 shrink-0"
      >
        <path
          d="M3 10.5 12 4l9 6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 9.5V20h14V9.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M10 20v-6h4v6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/scan",
    label: "Escanear QR",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="h-5 w-5 shrink-0"
      >
        <rect x="3.5" y="3.5" width="6" height="6" rx="1" />
        <rect x="14.5" y="3.5" width="6" height="6" rx="1" />
        <rect x="3.5" y="14.5" width="6" height="6" rx="1" />
        <path
          d="M14.5 14.5h3v3h-3zM20.5 14.5v3M17.5 20.5h3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function Sidebar({
  userEmail,
  userNombre,
  onNavigate,
  onClose,
}: {
  userEmail: string | null;
  userNombre?: string | null;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { checking, checkForUpdate } = useAppUpdate();
  const nombre = userNombre || userEmail?.split("@")[0] || "Usuario";
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <nav className="flex h-full w-64 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="relative bg-emerald-800 px-4 py-5 text-white dark:bg-emerald-900">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-4 w-4"
            >
              <path
                d="M6 6l12 12M18 6 6 18"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/15 text-lg font-bold">
          {inicial}
        </div>
        <p className="mt-3 truncate text-base font-bold uppercase leading-tight">
          {nombre}
        </p>
        <p className="truncate text-xs text-emerald-100" title={userEmail ?? undefined}>
          {userEmail ?? "Biologik"}
        </p>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                active
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="border-t border-neutral-200 py-2 dark:border-neutral-800">
        <button
          type="button"
          onClick={checkForUpdate}
          disabled={checking}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-60 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="h-5 w-5 shrink-0"
          >
            <path
              d="M4 12a8 8 0 0 1 13.66-5.66M20 12a8 8 0 0 1-13.66 5.66"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17.5 3v4h-4M6.5 21v-4h4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {checking ? "Buscando..." : "Actualizar app"}
        </button>

        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-5 w-5 shrink-0"
            >
              <path
                d="M15 17.5 20.5 12 15 6.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 12H9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 20.5H4.5v-17H9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Cerrar sesión
          </button>
        </form>
      </div>

      <div className="border-t border-neutral-200 py-2 text-center dark:border-neutral-800">
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          v{APP_VERSION}
        </span>
      </div>
    </nav>
  );
}
