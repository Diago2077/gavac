export default function Loading() {
  return (
    <div className="flex flex-1 flex-col animate-pulse">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950/95">
        <div className="mx-auto h-7 w-40 max-w-3xl rounded bg-neutral-200 dark:bg-neutral-800" />
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 space-y-4">
        <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-56 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
