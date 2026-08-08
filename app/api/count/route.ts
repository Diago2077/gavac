import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { countTicksInQuadrants } from "@/lib/openai";

const BodySchema = z.object({
  quadrants: z.array(z.string().startsWith("data:image/")).length(4),
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
      { error: "Faltan o son inválidos los cuadrantes de la imagen." },
      { status: 400 },
    );
  }

  try {
    const resultado = await countTicksInQuadrants(parsedBody.data.quadrants);
    return NextResponse.json(resultado);
  } catch (err) {
    console.error("Error contando garrapatas con IA:", err);
    return NextResponse.json(
      { error: "No se pudo procesar la imagen con IA. Intentá de nuevo." },
      { status: 502 },
    );
  }
}
