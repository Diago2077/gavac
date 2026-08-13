"use client";

import { useMemo, useState } from "react";
import { CameraCapture } from "@/components/CameraCapture";
import { ConteoResult } from "@/components/ConteoResult";
import { Modal } from "@/components/Modal";
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
  conteosPrevios,
}: {
  animalId: string;
  conteosPrevios: Conteo[];
}) {
  const [open, setOpen] = useState(false);
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
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  function ladoLabel(valor: LadoCuerpo | string) {
    return LADOS_CUERPO.find((l) => l.value === valor)?.label ?? valor;
  }

  const total = useMemo(
    () => historial.reduce((sum, c) => sum + c.count_total, 0),
    [historial],
  );

  async function handleEliminar(conteo: Conteo) {
    const confirmado = window.confirm(
      `¿Eliminar el conteo de "${ladoLabel(conteo.lado_cuerpo)}" (${conteo.count_total} garrapatas)? Esta acción no se puede deshacer.`,
    );
    if (!confirmado) return;

    setEliminandoId(conteo.id);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("conteos")
      .delete()
      .eq("id", conteo.id);
    setEliminandoId(null);

    if (deleteError) {
      window.alert("No se pudo eliminar el conteo. Intentá de nuevo.");
      return;
    }

    setHistorial((prev) => prev.filter((c) => c.id !== conteo.id));
  }

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
      setHistorial((prev) => [inserted, ...prev]);
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

  function cerrarModal() {
    setOpen(false);
    reiniciar();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
            Total garrapatas
          </p>
          <p className="text-2xl font-semibold text-emerald-800 dark:text-emerald-400">
            {total}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Nuevo conteo"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-dashed border-emerald-400 text-xl font-medium leading-none text-emerald-700 hover:bg-emerald-50 dark:border-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-950"
        >
          +
        </button>
      </div>

      {historial.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Todavía no hay conteos registrados para este animal.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-2 font-medium">Lado</th>
                <th className="px-4 py-2 font-medium">Total</th>
                <th className="px-4 py-2 font-medium">Fecha</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
              {historial.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">
                    {ladoLabel(c.lado_cuerpo)}
                  </td>
                  <td className="px-4 py-2 font-medium text-neutral-900 dark:text-neutral-100">
                    {c.count_total}
                  </td>
                  <td className="px-4 py-2 text-neutral-500 dark:text-neutral-400">
                    {new Date(c.created_at).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleEliminar(c)}
                      disabled={eliminandoId === c.id}
                      aria-label="Eliminar conteo"
                      className="rounded-md p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-neutral-500 dark:hover:bg-red-950 dark:hover:text-red-400"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        className="h-4.5 w-4.5"
                      >
                        <path
                          d="M5 7h14M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m2 0-.7 12.1a1.5 1.5 0 0 1-1.5 1.4H9.2a1.5 1.5 0 0 1-1.5-1.4L7 7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <Modal onClose={cerrarModal}>
          <div className="space-y-4">
            {step === "elegir_lado" && (
              <div className="space-y-3">
                <h2 className="font-medium text-neutral-800 dark:text-neutral-100">
                  1. Elegí el lado del cuerpo a fotografiar
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {LADOS_CUERPO.map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => {
                        setLado(l.value);
                        setStep("capturar");
                      }}
                      className="rounded-md border border-neutral-300 px-3 py-3 text-sm font-medium text-neutral-700 hover:border-emerald-600 hover:bg-emerald-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-emerald-500 dark:hover:bg-emerald-950"
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="text-sm text-neutral-500 hover:underline dark:text-neutral-400"
                >
                  Cancelar
                </button>
              </div>
            )}

            {step === "capturar" && lado && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium text-neutral-800 dark:text-neutral-100">
                    2. Foto — {ladoLabel(lado)}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setStep("elegir_lado")}
                    className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
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
                <h2 className="font-medium text-neutral-800 dark:text-neutral-100">
                  Resultado
                </h2>
                <ConteoResult
                  imageUrl={fotoUrlFinal}
                  countTotal={resultado.count_total}
                  detecciones={resultado.detecciones}
                  observaciones={resultado.observaciones}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={reiniciar}
                    className="flex-1 rounded-md bg-emerald-700 px-4 py-2.5 font-medium text-white hover:bg-emerald-800"
                  >
                    Registrar otra foto
                  </button>
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="rounded-md px-4 py-2.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  >
                    Listo
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
