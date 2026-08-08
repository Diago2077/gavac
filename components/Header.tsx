import Link from "next/link";

export function Header({
  title,
  backHref,
}: {
  title: string;
  backHref?: string;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 min-w-0">
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
    </header>
  );
}
