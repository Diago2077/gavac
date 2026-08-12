export function ListSkeleton() {
  return (
    <div className="flex flex-1 flex-col animate-pulse">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950/95">
        <div className="mx-auto h-7 w-32 max-w-3xl rounded bg-neutral-200 dark:bg-neutral-800" />
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 space-y-6">
        <div className="flex gap-2">
          <div className="h-10 flex-1 rounded-md bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-10 w-10 shrink-0 rounded-md bg-neutral-200 dark:bg-neutral-800" />
        </div>
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-700 dark:bg-neutral-900">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="px-4 py-3">
              <div className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800" />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
