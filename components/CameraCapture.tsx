"use client";

import { useEffect, useRef, useState } from "react";

export function CameraCapture({
  onCapture,
  disabled,
}: {
  onCapture: (file: File, previewUrl: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo después
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Elegí una foto (no un PDF ni otro tipo de archivo).");
      return;
    }

    setError(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onCapture(file, url);
  }

  return (
    <div className="space-y-3">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Foto capturada"
          className="w-full rounded-lg border border-neutral-200 object-contain max-h-96 dark:border-neutral-700"
        />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-500">
          Sin foto todavía
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        // Incluimos application/pdf a propósito (aunque no lo aceptamos:
        // ver handleChange) porque en Android, cuando el accept sólo
        // tiene tipos de imagen, Chrome abre directo su "selector de
        // fotos" simplificado salteando la cámara. Con un tipo no-imagen
        // en la lista, Chrome usa el selector genérico del sistema
        // ("Cámara" / "Archivos"), que es lo que necesitamos.
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-md bg-emerald-700 px-4 py-2.5 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {previewUrl ? "Tomar otra foto" : "Tomar / subir foto"}
      </button>
    </div>
  );
}
