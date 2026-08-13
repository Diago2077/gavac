import { signOut } from "@/app/login/actions";

export default function CuentaPendientePage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-400">
            GAVAC
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Biologik
          </p>
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          Tu cuenta fue creada correctamente, pero todavía no tiene acceso
          habilitado. Un administrador la va a activar en breve.
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Salir
          </button>
        </form>
      </div>
    </div>
  );
}
