import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { SearchBox } from "@/components/SearchBox";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { createClient } from "@/lib/supabase/server";
import { CreateAnimalForm } from "./CreateAnimalForm";
import type { Animal, Finca } from "@/lib/types";

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

  return (
    <div className="flex flex-1 flex-col">
      <Header title={finca.nombre} backHref="/fincas" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 space-y-6">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {finca.propietario ?? "Sin propietario registrado"}
            </p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Escaneá este QR para volver directo a esta finca.
            </p>
          </div>
          <QRCodeDisplay value={`gavac:finca:${finca.id}`} size={96} />
        </div>

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

          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-700 dark:bg-neutral-900">
            {animales?.map((animal) => (
              <li key={animal.id}>
                <Link
                  href={`/animales/${animal.id}/conteo`}
                  className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    Caravana {animal.caravana}
                  </span>
                  <span className="text-neutral-400 dark:text-neutral-500">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
