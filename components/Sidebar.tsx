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
  onNavigate,
}: {
  userEmail: string | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { checking, checkForUpdate } = useAppUpdate();

  return (
    <nav className="flex h-full w-64 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
        <span className="text-lg font-bold text-emerald-800 dark:text-emerald-400">
          GAVAC
        </span>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Conteo de garrapatas
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

      <div className="border-t border-neutral-200 px-3 py-3 dark:border-neutral-800">
        {userEmail && (
          <p
            className="truncate text-xs text-neutral-500 dark:text-neutral-400"
            title={userEmail}
          >
            {userEmail}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            v{APP_VERSION}
          </span>
          <button
            type="button"
            onClick={checkForUpdate}
            disabled={checking}
            className="rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 dark:text-emerald-400 dark:hover:bg-emerald-950"
          >
            {checking ? "Buscando..." : "Actualizar"}
          </button>
        </div>
      </div>

      <form
        action={signOut}
        className="border-t border-neutral-200 p-2 dark:border-neutral-800"
      >
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
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
            <path d="M20 12H9" strokeLinecap="round" strokeLinejoin="round" />
            <path
              d="M9 20.5H4.5v-17H9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Salir
        </button>
      </form>
    </nav>
  );
}
