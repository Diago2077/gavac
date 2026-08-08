"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateFincaState = { error: string | null };

export async function createFinca(
  _prevState: CreateFincaState,
  formData: FormData,
): Promise<CreateFincaState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const propietario = String(formData.get("propietario") ?? "").trim();

  if (!nombre) {
    return { error: "El nombre de la finca es obligatorio." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("fincas").insert({
    nombre,
    propietario: propietario || null,
    created_by: user?.id ?? null,
  });

  if (error) {
    return { error: "No se pudo crear la finca. Intentá de nuevo." };
  }

  revalidatePath("/fincas");
  return { error: null };
}
