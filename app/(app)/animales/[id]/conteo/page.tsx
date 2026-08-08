import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { ConteoFlow } from "./ConteoFlow";
import type { Animal, Conteo, Finca } from "@/lib/types";

export default async function ConteoPage(
  props: PageProps<"/animales/[id]/conteo">,
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: animal } = await supabase
    .from("animales")
    .select("*")
    .eq("id", id)
    .maybeSingle<Animal>();

  if (!animal) {
    notFound();
  }

  const { data: finca } = await supabase
    .from("fincas")
    .select("*")
    .eq("id", animal.finca_id)
    .maybeSingle<Finca>();

  const { data: conteosPrevios } = await supabase
    .from("conteos")
    .select("*")
    .eq("animal_id", animal.id)
    .order("created_at", { ascending: false })
    .limit(5)
    .returns<Conteo[]>();

  return (
    <div className="flex flex-1 flex-col">
      <Header
        title={`Caravana ${animal.caravana}`}
        backHref={finca ? `/fincas/${finca.id}/animales` : "/fincas"}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <ConteoFlow
          animalId={animal.id}
          fincaNombre={finca?.nombre ?? ""}
          conteosPrevios={conteosPrevios ?? []}
        />
      </main>
    </div>
  );
}
