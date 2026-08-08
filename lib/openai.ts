import OpenAI from "openai";
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

// Probamos forzar un JSON estructurado con coordenadas (x,y) por garrapata y
// el modelo contaba mucho peor que en una conversación libre de ChatGPT con
// la misma foto: forzarlo a la vez a localizar cada garrapata con precisión
// y a contar degradaba el conteo (tanto sub como sobre-estimando). Dejamos
// que razone en texto libre -- igual que en un chat normal -- y extraemos
// el número final. A cambio, ya no podemos marcar cada garrapata en la foto
// con un círculo (por eso "detecciones" queda vacío): priorizamos que el
// número sea confiable por sobre el overlay visual.
const PROMPT = `Sos un veterinario experto en identificar garrapatas (teleóginas de
Rhipicephalus microplus) en fotos de bovinos tomadas en el campo.

Mirá la foto con atención y contá cuántas garrapatas tiene el animal, incluyendo
las que están en racimos densos, parcialmente superpuestas, o parcialmente
tapadas por el pelo. Razoná paso a paso si te sirve, recorriendo la imagen por
zonas para no perderte ninguna.

Al final de tu respuesta, en su propia línea, escribí exactamente:
TOTAL: <número>`;

function extractTotal(text: string): number | null {
  // Formato pedido: "TOTAL: <número>", pero toleramos variaciones de
  // formato que suele agregar el modelo (negrita markdown, dos puntos
  // pegados, etc.) buscando "total" seguido en algún punto por un número.
  const strict = text.match(/TOTAL:\s*(\d+)/i);
  if (strict) return parseInt(strict[1], 10);

  const loose = text.match(/total[^\d]{0,10}(\d+)/i);
  if (loose) return parseInt(loose[1], 10);

  // Último recurso: el último número que aparece en la respuesta suele ser
  // el total (el razonamiento previo tiende a mencionar números parciales
  // antes del cierre).
  const allNumbers = text.match(/\d+/g);
  if (allNumbers && allNumbers.length > 0) {
    return parseInt(allNumbers[allNumbers.length - 1], 10);
  }

  return null;
}

export async function countTicks(imageUrl: string): Promise<ConteoIA> {
  const completion = await getClient().chat.completions.create({
    model: VISION_MODEL,
    max_completion_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: PROMPT },
          {
            type: "image_url",
            image_url: { url: imageUrl, detail: "high" },
          },
        ],
      },
    ],
  });

  const choice = completion.choices[0];
  const refusal = choice?.message?.refusal;
  const text = choice?.message.content ?? "";
  const count_total = extractTotal(text);

  if (count_total === null) {
    const detalle = `finish_reason=${choice?.finish_reason ?? "?"} refusal=${
      refusal ?? "ninguno"
    } texto="${text}"`;
    console.error("No se pudo extraer el total.", detalle);
    throw new Error(`La IA no devolvió un total interpretable. (${detalle})`);
  }

  return {
    count_total,
    detecciones: [],
    observaciones: text.replace(/TOTAL:\s*\d+/i, "").trim() || null,
  };
}
