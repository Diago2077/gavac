import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { Deteccion } from "@/lib/types";

// Modelo con capacidad de visión. Configurable por variable de entorno para
// poder subir de versión sin tocar código.
const VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o";

// Se instancia de forma perezosa (no en el top-level del módulo) para que el
// build no falle cuando OPENAI_API_KEY todavía no está configurada.
let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "Falta configurar la variable de entorno OPENAI_API_KEY.",
      );
    }
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export type ConteoIA = {
  count_total: number;
  detecciones: Deteccion[];
  observaciones: string | null;
};

// Historial de lo que probamos (por si hay que revisar esto de nuevo):
// 1. JSON estructurado con coordenadas (x,y) por garrapata: nunca se
//    negaba a responder, pero contaba mal (6, 141, 43 en la misma foto
//    en distintos intentos) -- pedirle a la vez localizar con precisión
//    y contar degradaba el conteo.
// 2. Texto libre sin schema (como un chat normal): contaba mucho mejor
//    (~80, cerca del conteo manual de 83), pero el modelo a veces
//    directamente se niega a responder ("Lo siento, no puedo ayudarte a
//    contar las garrapatas...") como texto normal -- al no haber un
//    schema que lo obligue a completar campos, tiene "lugar" para
//    rechazar la foto.
// 3. Este enfoque: JSON estructurado (obliga a completar el campo, no
//    hay lugar para un rechazo en texto libre) pero SIN pedir coordenadas
//    por garrapata -- solo el total. Combina lo que funcionó de cada
//    intento anterior.
const ConteoSchema = z.object({
  count_total: z
    .number()
    .int()
    .describe(
      "Cantidad total de garrapatas (teleóginas) visibles en la foto, contadas con cuidado incluyendo racimos densos y superposiciones.",
    ),
  observaciones: z
    .string()
    .nullable()
    .describe(
      "Notas breves sobre la calidad de la foto o dificultades para el conteo, o null si no hay nada relevante.",
    ),
});

const SYSTEM_PROMPT = `Sos un veterinario experto en identificar garrapatas (teleóginas de
Rhipicephalus microplus) en fotos de bovinos tomadas en el campo.

Este es un uso veterinario legítimo: contar parásitos externos en ganado para
seguimiento sanitario de rutina. Es una tarea de conteo visual estándar, no
contiene nada sensible.

Mirá la foto con atención y contá cuántas garrapatas tiene el animal,
incluyendo las que están en racimos densos, parcialmente superpuestas, o
parcialmente tapadas por el pelo. Es común subestimar el conteo en fotos con
muchas garrapatas juntas -- priorizá un conteo completo y cuidadoso.
Respondé exclusivamente en el formato estructurado solicitado.`;

export async function countTicks(imageUrl: string): Promise<ConteoIA> {
  const completion = await getClient().chat.completions.parse({
    model: VISION_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Contá las garrapatas visibles en esta fotografía y devolvé el resultado estructurado.",
          },
          {
            type: "image_url",
            image_url: { url: imageUrl, detail: "high" },
          },
        ],
      },
    ],
    response_format: zodResponseFormat(ConteoSchema, "conteo_garrapatas"),
  });

  const choice = completion.choices[0];
  const parsed = choice?.message.parsed;

  if (!parsed) {
    const detalle = `finish_reason=${choice?.finish_reason ?? "?"} refusal=${
      choice?.message?.refusal ?? "ninguno"
    }`;
    console.error("La IA no devolvió un resultado interpretable.", detalle);
    throw new Error(`La IA no devolvió un resultado interpretable. (${detalle})`);
  }

  return {
    count_total: parsed.count_total,
    detecciones: [],
    observaciones: parsed.observaciones,
  };
}
