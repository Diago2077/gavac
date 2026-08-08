"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateAnimalState = { error: string | null };

export async function createAnimal(
  fincaId: string,
  _prevState: CreateAnimalState,
  formData: FormData,
): Promise<CreateAnimalState> {
  const caravana = String(formData.get("caravana") ?? "").trim();

  if (!caravana) {
    return { error: "El número de caravana es obligatorio." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("animales").insert({
    finca_id: fincaId,
    caravana,
    created_by: user?.id ?? null,
  });

  if (error) {
    const duplicado = error.code === "23505";
    return {
      error: duplicado
        ? "Ya existe un animal con esa caravana en esta finca."
        : "No se pudo crear el animal. Intentá de nuevo.",
    };
  }

  revalidatePath(`/fincas/${fincaId}/animales`);
  return { error: null };
}
