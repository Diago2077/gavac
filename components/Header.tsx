import Link from "next/link";
import { QrButton } from "./QrButton";

export function Header({
  title,
  subtitle,
  backHref,
  qr,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  qr?: { value: string; label?: string };
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="flex shrink-0 items-center justify-center text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
            aria-label="Volver"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-7 w-7"
            >
              <path
                d="M15 5 8 12l7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        )}
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <h1 className="truncate text-lg font-semibold leading-tight text-emerald-800 dark:text-emerald-400">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
              {subtitle}
            </p>
          )}
        </div>
        {qr && <QrButton value={qr.value} label={qr.label} />}
      </div>
    </header>
  );
}
