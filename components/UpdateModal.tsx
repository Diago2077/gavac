"use client";

import { useAppUpdate } from "@/lib/app-update-context";

export function UpdateModal() {
  const { updateAvailable, applyUpdate } = useAppUpdate();

  if (!updateAvailable) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl dark:bg-neutral-900">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Nueva versión disponible
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Hay una actualización de GAVAC lista para instalar.
        </p>
        <button
          type="button"
          onClick={applyUpdate}
          className="mt-4 w-full rounded-md bg-emerald-700 px-4 py-2.5 font-medium text-white hover:bg-emerald-800"
        >
          Actualizar
        </button>
      </div>
    </div>
  );
}
