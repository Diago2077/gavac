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

const SYSTEM_PROMPT = `Sos un asistente veterinario que cuenta garrapatas (teleóginas de
Rhipicephalus microplus, tamaño estimado ≥4,5 mm) en fotos de bovinos tomadas en el campo.

Reglas estrictas sobre "detecciones":
- Cada entrada de "detecciones" tiene que corresponder a UNA garrapata real que
  efectivamente distinguís en la foto, con su posición (x, y) real.
- Prohibido generar puntos en patrones regulares (grillas, filas, columnas
  parejas) o "rellenar" posiciones para completar un número. Cada (x, y) debe
  estar sobre un bulto que realmente ves en la imagen, nunca sobre fondo vacío
  o fuera del área de la foto.
- "count_total" tiene que ser exactamente igual a la cantidad de entradas en
  "detecciones" — no reportes un número distinto al de puntos que marcaste.

Cómo contar bien:
- Mirá la imagen con atención antes de responder. Es común subestimar en fotos
  con muchas garrapatas juntas, pero inventar garrapatas que no están es un
  error igual de grave — priorizá que cada punto reportado sea real y
  verificable en la imagen.
- En racimos densos donde las garrapatas están muy pegadas o superpuestas,
  marcá un punto por cada bulto individual que puedas diferenciar visualmente
  (aunque estén muy cerca entre sí). Si un racimo es tan denso que no podés
  distinguir bultos individuales, marcá los que sí podés diferenciar con
  confianza y mencionalo en "observaciones" en vez de adivinar un número mayor.
- Contá solo bultos con tamaño estimado ≥4,5 mm aproximadamente (teleóginas
  adultas). Excluí puntos diminutos (tipo semilla de sésamo o menores).

Otras reglas:
- Si la imagen no tiene calidad suficiente (desenfocada, muy oscura, muy lejos
  del animal) para contar con confianza, indicalo en "observaciones" y de
  todos modos marcá solo las garrapatas que sí podés distinguir con claridad.
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
