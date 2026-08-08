"use client";

import { useState } from "react";
import { CameraCapture } from "@/components/CameraCapture";
import { ConteoResult } from "@/components/ConteoResult";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { createClient } from "@/lib/supabase/client";
import { LADOS_CUERPO, type Conteo, type LadoCuerpo } from "@/lib/types";

type Step = "elegir_lado" | "capturar" | "resultado";

type ResultadoIA = {
  count_total: number;
  detecciones: { x: number; y: number; tamano_mm_estimado: number | null }[];
  observaciones: string | null;
};

export function ConteoFlow({
  animalId,
  fincaNombre,
  conteosPrevios,
}: {
  animalId: string;
  fincaNombre: string;
  conteosPrevios: Conteo[];
}) {
  const [step, setStep] = useState<Step>("elegir_lado");
  const [lado, setLado] = useState<LadoCuerpo | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "subiendo" | "contando">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoIA | null>(null);
  const [fotoUrlFinal, setFotoUrlFinal] = useState<string | null>(null);
  const [historial, setHistorial] = useState(conteosPrevios);

  async function handleAnalizar() {
    if (!file || !lado) return;
    setError(null);

    try {
      setStatus("subiendo");
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${animalId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("fotos-garrapatas")
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        throw new Error("No se pudo subir la foto. Intentá de nuevo.");
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("fotos-garrapatas").getPublicUrl(path);

      setStatus("contando");
      const res = await fetch("/api/count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: publicUrl }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "No se pudo contar la foto con IA.");
      }

      const data: ResultadoIA = await res.json();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: inserted, error: insertError } = await supabase
        .from("conteos")
        .insert({
          animal_id: animalId,
          foto_url: publicUrl,
          lado_cuerpo: lado,
          count_total: data.count_total,
          detecciones: data.detecciones,
          creado_por: user?.id ?? null,
        })
        .select("*")
        .single<Conteo>();

      if (insertError) {
        throw new Error("El conteo se calculó pero no se pudo guardar.");
      }

      setResultado(data);
      setFotoUrlFinal(publicUrl);
      setHistorial((prev) => [inserted, ...prev].slice(0, 5));
      setStep("resultado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
    } finally {
      setStatus("idle");
    }
  }

  function reiniciar() {
    setStep("elegir_lado");
    setLado("");
    setFile(null);
    setResultado(null);
    setFotoUrlFinal(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      {fincaNombre && (
        <p className="text-sm text-neutral-500">Finca: {fincaNombre}</p>
      )}

      {step !== "resultado" && (
        <div className="flex justify-center">
          <QRCodeDisplay
            value={`gavac:animal:${animalId}`}
            size={96}
            label="QR de este animal"
          />
        </div>
      )}

      {step === "elegir_lado" && (
        <div className="space-y-3">
          <h2 className="font-medium text-neutral-800">
            1. Elegí el lado del cuerpo a fotografiar
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {LADOS_CUERPO.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => {
                  setLado(l.value);
                  setStep("capturar");
                }}
                className="rounded-md border border-neutral-300 px-3 py-3 text-sm font-medium text-neutral-700 hover:border-emerald-600 hover:bg-emerald-50"
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "capturar" && lado && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-neutral-800">
              2. Foto —{" "}
              {LADOS_CUERPO.find((l) => l.value === lado)?.label}
            </h2>
            <button
              type="button"
              onClick={() => setStep("elegir_lado")}
              className="text-sm text-emerald-700 hover:underline"
            >
              cambiar lado
            </button>
          </div>

          <CameraCapture
            disabled={status !== "idle"}
            onCapture={(f) => setFile(f)}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="button"
            disabled={!file || status !== "idle"}
            onClick={handleAnalizar}
            className="w-full rounded-md bg-amber-600 px-4 py-2.5 font-medium text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {status === "subiendo" && "Subiendo foto..."}
            {status === "contando" && "Contando garrapatas con IA..."}
            {status === "idle" && "Analizar foto"}
          </button>
        </div>
      )}

      {step === "resultado" && resultado && fotoUrlFinal && (
        <div className="space-y-4">
          <h2 className="font-medium text-neutral-800">Resultado</h2>
          <ConteoResult
            imageUrl={fotoUrlFinal}
            countTotal={resultado.count_total}
            detecciones={resultado.detecciones}
            observaciones={resultado.observaciones}
          />
          <button
            type="button"
            onClick={reiniciar}
            className="w-full rounded-md bg-emerald-700 px-4 py-2.5 font-medium text-white hover:bg-emerald-800"
          >
            Registrar otra foto
          </button>
        </div>
      )}

      {historial.length > 0 && (
        <div className="space-y-2 border-t border-neutral-200 pt-4">
          <h3 className="text-sm font-medium text-neutral-600">
            Últimos conteos registrados
          </h3>
          <ul className="space-y-1 text-sm text-neutral-500">
            {historial.map((c) => (
              <li key={c.id} className="flex justify-between">
                <span>
                  {LADOS_CUERPO.find((l) => l.value === c.lado_cuerpo)
                    ?.label ?? c.lado_cuerpo}
                </span>
                <span>
                  {c.count_total} garrapatas ·{" "}
                  {new Date(c.created_at).toLocaleDateString("es-AR")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
