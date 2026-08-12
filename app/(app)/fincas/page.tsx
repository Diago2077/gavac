import { Suspense } from "react";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { CreateFincaForm } from "./CreateFincaForm";
import { SearchBox } from "@/components/SearchBox";
import { TableRowLink } from "@/components/TableRowLink";
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
        <div className="space-y-3">
          <div className="flex gap-2">
            <Suspense fallback={null}>
              <SearchBox
                placeholder="Buscar por nombre o propietario..."
                paramName="q"
              />
            </Suspense>
            <CreateFincaForm />
          </div>

          {(!fincas || fincas.length === 0) && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {q
                ? "No se encontraron fincas con esa búsqueda."
                : "Todavía no hay fincas cargadas. Creá la primera arriba."}
            </p>
          )}

          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Nombre</th>
                  <th className="px-4 py-2 font-medium">Propietario</th>
                  <th className="px-4 py-2 font-medium">Creada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                {fincas?.map((finca) => (
                  <TableRowLink
                    key={finca.id}
                    href={`/fincas/${finca.id}/animales`}
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                      {finca.nombre}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                      {finca.propietario ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                      {new Date(finca.created_at).toLocaleDateString("es-AR")}
                    </td>
                  </TableRowLink>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
