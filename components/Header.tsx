import Link from "next/link";
import { signOut } from "@/app/login/actions";

export function Header({
  title,
  backHref,
}: {
  title: string;
  backHref?: string;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 shrink-0"
              aria-label="Volver"
            >
              ←
            </Link>
          )}
          <h1 className="truncate text-lg font-semibold text-emerald-800 dark:text-emerald-400">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/scan"
            className="rounded-md border border-emerald-700 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950"
          >
            Escanear QR
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
