"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createFinca, type CreateFincaState } from "./actions";
import { Modal } from "@/components/Modal";

const initialState: CreateFincaState = { error: null };

export function CreateFincaForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createFinca,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state.error === null) {
      formRef.current?.reset();
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Nueva finca"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-dashed border-emerald-400 text-xl font-medium leading-none text-emerald-700 hover:bg-emerald-50 dark:border-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-950"
      >
        +
      </button>

      {open && (
        <Modal onClose={() => setOpen(false)}>
          <form ref={formRef} action={formAction} className="space-y-3">
            <h2 className="font-medium text-neutral-800 dark:text-neutral-100">
              Nueva finca
            </h2>
            <div>
              <label className="block text-sm text-neutral-600 mb-1 dark:text-neutral-300">
                Nombre
              </label>
              <input
                name="nombre"
                required
                autoFocus
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1 dark:text-neutral-300">
                Propietario
              </label>
              <input
                name="propietario"
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            {state.error && (
              <p className="text-sm text-red-600">{state.error}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {pending ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
