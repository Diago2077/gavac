import Link from "next/link";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { CreateFincaForm } from "./CreateFincaForm";
import { SearchBox } from "@/components/SearchBox";
import type { Finca } from "@/lib/types";

export default async function FincasPage(props: PageProps<"/fincas">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";

  const supabase = await createClient();
  let query = supabase
    .from("fincas")
    .select("*")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`nombre.ilike.%${q}%,propietario.ilike.%${q}%`);
  }

  const { data: fincas } = await query.returns<Finca[]>();

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Fincas" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 space-y-6">
        <CreateFincaForm />

        <div className="space-y-3">
          <Suspense fallback={null}>
            <SearchBox
              placeholder="Buscar por nombre o propietario..."
              paramName="q"
            />
          </Suspense>

          {(!fincas || fincas.length === 0) && (
            <p className="text-sm text-neutral-500">
              {q
                ? "No se encontraron fincas con esa búsqueda."
                : "Todavía no hay fincas cargadas. Creá la primera arriba."}
            </p>
          )}

          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {fincas?.map((finca) => (
              <li key={finca.id}>
                <Link
                  href={`/fincas/${finca.id}/animales`}
                  className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-neutral-50"
                >
                  <span>
                    <span className="block font-medium text-neutral-900">
                      {finca.nombre}
                    </span>
                    {finca.propietario && (
                      <span className="block text-sm text-neutral-500">
                        {finca.propietario}
                      </span>
                    )}
                  </span>
                  <span className="text-neutral-400">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
