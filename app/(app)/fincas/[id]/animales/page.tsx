import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { SearchBox } from "@/components/SearchBox";
import { createClient } from "@/lib/supabase/server";
import { CreateAnimalForm } from "./CreateAnimalForm";
import { TableRowLink } from "@/components/TableRowLink";
import type { Animal, Conteo, Finca } from "@/lib/types";

export default async function AnimalesPage(
  props: PageProps<"/fincas/[id]/animales">,
) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";

  const supabase = await createClient();

  const { data: finca } = await supabase
    .from("fincas")
    .select("*")
    .eq("id", id)
    .maybeSingle<Finca>();

  if (!finca) {
    notFound();
  }

  let query = supabase
    .from("animales")
    .select("*")
    .eq("finca_id", id)
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("caravana", `%${q}%`);
  }

  const { data: animales } = await query.returns<Animal[]>();

  const animalIds = animales?.map((a) => a.id) ?? [];
  const { data: conteos } = animalIds.length
    ? await supabase
        .from("conteos")
        .select("animal_id, count_total")
        .in("animal_id", animalIds)
        .returns<Pick<Conteo, "animal_id" | "count_total">[]>()
    : { data: [] as Pick<Conteo, "animal_id" | "count_total">[] };

  const totalPorAnimal = new Map<string, number>();
  for (const c of conteos ?? []) {
    totalPorAnimal.set(
      c.animal_id,
      (totalPorAnimal.get(c.animal_id) ?? 0) + c.count_total,
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header
        title={finca.nombre}
        backHref="/fincas"
        qr={{
          value: `gavac:finca:${finca.id}`,
          label: "QR de esta finca",
        }}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 space-y-6">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {finca.propietario ?? "Sin propietario registrado"}
        </p>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Suspense fallback={null}>
              <SearchBox
                placeholder="Buscar por número de caravana..."
                paramName="q"
              />
            </Suspense>
            <CreateAnimalForm fincaId={finca.id} />
          </div>

          {(!animales || animales.length === 0) && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {q
                ? "No se encontraron animales con esa búsqueda."
                : "Todavía no hay animales cargados en esta finca."}
            </p>
          )}

          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Caravana</th>
                  <th className="px-4 py-2 font-medium">Total</th>
                  <th className="px-4 py-2 font-medium">Creado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                {animales?.map((animal) => (
                  <TableRowLink
                    key={animal.id}
                    href={`/animales/${animal.id}/conteo`}
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                      {animal.caravana}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                      {totalPorAnimal.get(animal.id) ?? 0}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                      {new Date(animal.created_at).toLocaleDateString(
                        "es-AR",
                      )}
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
