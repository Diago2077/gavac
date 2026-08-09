import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { Deteccion } from "@/lib/types";

// Modelo con capacidad de visión. Configurable por variable de entorno para
// poder subir de versión sin tocar código.
const VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o";

// Factor de calibración aplicado al conteo crudo del modelo. Con temperature:0
// el modelo es consistente foto a foto, pero tiene un sesgo sistemático (ver
// historial de intentos más abajo) -- en vez de seguir puliendo el texto del
// prompt a ciegas (lo cual ya demostró voltear el resultado para cualquier
// lado de forma impredecible entre intentos), corregimos ese sesgo con un
// multiplicador medido contra conteos manuales reales. Ajustable sin
// redeploy vía variable de entorno en Vercel a medida que se comparen más
// fotos reales.
const CALIBRATION_FACTOR = Number(process.env.TICK_COUNT_CALIBRATION) || 1.38;

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
// 3. JSON estructurado sin coordenadas, solo el total directo: combina lo
//    que funcionó de los dos anteriores. Resultado aceptado por el
//    usuario: ~97-112 vs ~83 real (sobreestimación moderada pero
//    consistente). Ver tag de git "checkpoint-conteo-v1.1.0" para volver
//    a este estado exacto si hace falta.
// 4. Este enfoque: igual al 3, pero agregando un campo "analisis" ANTES
//    de count_total en el schema. Los Structured Outputs de OpenAI generan
//    los campos en el orden del schema, así que un campo de texto libre
//    antes del número final funciona como "chain of thought" forzado (el
//    modelo razona en texto antes de comprometerse con un número), sin
//    caer en el problema del intento con grilla explícita (que hacía que
//    el modelo alucinara un patrón de grilla que no existía en la foto).
//    NO le pedimos que invente una grilla ni que recorte la imagen -- solo
//    que describa lo que ve, por zonas reales del cuerpo del animal.
//    Resultado: muy consistente (5/5 intentos con el mismo valor en la
//    misma foto), pero con sesgo hacia abajo (60 vs 83 real) -- el propio
//    razonamiento explícito por zonas parece volverlo más conservador.
//    Ver tag "checkpoint-conteo-v1.2.0". Como ahora el resultado es
//    predecible, en vez de seguir ajustando el texto del prompt (que
//    hasta acá cambió de dirección del sesgo sin previo aviso cada vez
//    que se tocó) corregimos el sesgo con CALIBRATION_FACTOR arriba.
const ConteoSchema = z.object({
  analisis: z
    .string()
    .describe(
      "Antes de dar el número final: describí en 2-4 frases cómo recorriste la foto para contar (ej. por zonas reales del cuerpo del animal que se ven en la imagen: cuello, paleta, entrepierna, etc, de arriba a abajo), cuántas garrapatas contás aproximadamente en cada zona densa, y qué dificultades hubo (pelo, superposición, foco). No inventes una grilla ni líneas que no estén en la foto -- describí solo lo que realmente se ve.",
    ),
  count_total: z
    .number()
    .int()
    .describe(
      "Cantidad total de garrapatas (teleóginas) visibles en la foto: la suma de lo descrito en 'analisis', contada con cuidado incluyendo racimos densos y superposiciones.",
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
parcialmente tapadas por el pelo.

El error más común y comprobado en este tipo de conteo es SUBESTIMAR en las
zonas con muchas garrapatas juntas: cuando hay un racimo denso es fácil verlo
como "una mancha" y contarlo como pocas unidades en vez de contar cada
garrapata individual que lo compone. Prestá especial atención a esas zonas
densas: mirá cada una despacio y contá garrapata por garrapata, no a ojo.

Recorré la foto por zonas reales del cuerpo del animal (cuello, paleta, lomo,
entrepierna, cola, etc, según lo que se vea) y contá cada zona por separado
antes de sumar el total -- explicá ese recorrido en el campo "analisis".
Respondé exclusivamente en el formato estructurado solicitado.`;

export async function countTicks(imageUrl: string): Promise<ConteoIA> {
  const completion = await getClient().chat.completions.parse({
    model: VISION_MODEL,
    // Menos variación entre llamadas para la misma foto (por defecto el
    // modelo es bastante "creativo", lo que en una tarea de conteo se
    // traduce en resultados muy distintos de una vez a otra).
    temperature: 0,
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

  const countCalibrado = Math.round(parsed.count_total * CALIBRATION_FACTOR);

  // Log del razonamiento por zonas + valores crudo/calibrado para poder
  // seguir ajustando CALIBRATION_FACTOR comparando contra conteos manuales
  // reales (no se guarda en la base ni se muestra en la UI).
  console.log(
    "[countTicks] análisis:",
    parsed.analisis,
    "| crudo:",
    parsed.count_total,
    "| calibrado:",
    countCalibrado,
    `(x${CALIBRATION_FACTOR})`,
  );

  return {
    count_total: countCalibrado,
    detecciones: [],
    observaciones: parsed.observaciones,
  };
}
