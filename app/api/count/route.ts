import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { countTicks } from "@/lib/openai";

const BodySchema = z.object({
  imageUrl: z.url(),
});

export async function POST(request: Request) {
  // Solo usuarios autenticados pueden pedir un conteo (evita abuso de la API de OpenAI).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsedBody = BodySchema.safeParse(json);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Falta o es inválida la URL de la imagen." },
      { status: 400 },
    );
  }

  try {
    const resultado = await countTicks(parsedBody.data.imageUrl);
    return NextResponse.json(resultado);
  } catch (err) {
    console.error("Error contando garrapatas con IA:", err);
    return NextResponse.json(
      { error: "No se pudo procesar la imagen con IA. Intentá de nuevo." },
      { status: 502 },
    );
  }
}
