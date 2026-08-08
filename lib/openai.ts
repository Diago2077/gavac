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

const DeteccionSchema = z.object({
  x: z
    .number()
    .describe(
      "Posición horizontal relativa de la garrapata en la imagen, de 0 (borde izquierdo) a 1 (borde derecho).",
    ),
  y: z
    .number()
    .describe(
      "Posición vertical relativa de la garrapata en la imagen, de 0 (borde superior) a 1 (borde inferior).",
    ),
  tamano_mm_estimado: z
    .number()
    .nullable()
    .describe("Tamaño estimado en milímetros, o null si no se puede estimar."),
});

const ConteoSchema = z.object({
  count_total: z
    .number()
    .int()
    .describe(
      "Cantidad total de garrapatas (teleóginas) visibles en la imagen con tamaño estimado mayor o igual a 4.5mm.",
    ),
  detecciones: z.array(DeteccionSchema),
  observaciones: z
    .string()
    .nullable()
    .describe(
      "Notas breves sobre la calidad de la foto o dificultades para el conteo, o null si no hay nada relevante.",
    ),
});

export type ConteoIA = {
  count_total: number;
  detecciones: Deteccion[];
  observaciones: string | null;
};

const SYSTEM_PROMPT = `Sos un asistente veterinario especializado en identificar y contar garrapatas
(teleóginas de Rhipicephalus microplus) en fotografías de bovinos tomadas en el campo.

Las fotos suelen mostrar decenas de garrapatas juntas, superpuestas o en racimos densos.
Es un error muy común subestimar el conteo por no revisar la imagen con suficiente
cuidado. Seguí este método antes de responder:

1. Dividí mentalmente la imagen en una grilla de 3x3 (izquierda/centro/derecha,
   arriba/medio/abajo).
2. Recorré cada una de las 9 celdas por separado y contá ahí TODOS los bultos
   redondeados, grisáceos/perlados o marrones adheridos a la piel que parezcan
   garrapatas — incluidas las que están parcialmente tapadas por otras, en el
   borde de un racimo denso, o muy juntas entre sí. Cada bulto individual cuenta
   por separado, incluso dentro de un racimo grande.
3. Sumá los 9 subtotales para el conteo final. No redondees para abajo ni asumas
   que un racimo denso "ya está representado" por las garrapatas que ves más claras:
   contá cada bulto que puedas distinguir.
4. Para cada garrapata contada, generá una entrada en "detecciones" con su posición
   aproximada (x, y). En racimos muy densos podés agrupar varias garrapatas muy
   próximas en una sola entrada de "detecciones" si no podés separar sus centros
   con precisión, pero el número reportado en "count_total" debe reflejar tu
   conteo real recorriendo la grilla, no solo la cantidad de entradas en "detecciones".

Criterio de tamaño:
- Contá garrapatas con un tamaño estimado igual o mayor a 4,5 mm (teleóginas adultas),
  el criterio sanitario estándar usado por GAVAC. En una foto de cerca, la gran mayoría
  de los bultos adultos visibles suelen cumplir este criterio — no descartes bultos
  grandes o medianos por duda de tamaño, solo excluí los claramente diminutos
  (puntos oscuros del tamaño de una semilla de sésamo o menores).

Otras reglas:
- Si la imagen no tiene calidad suficiente (desenfocada, muy oscura, muy lejos del
  animal) para contar con confianza, indicalo en "observaciones" y hacé la mejor
  estimación posible igualmente.
- No inventes garrapatas que no estén en la imagen, pero tampoco subestimes por
  cautela excesiva: tu prioridad es un conteo completo y sistemático.
- Respondé exclusivamente en el formato estructurado solicitado.`;

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

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error("La IA no devolvió un resultado interpretable.");
  }

  return parsed;
}
