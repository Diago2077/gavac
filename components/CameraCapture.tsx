"use client";

import { useEffect, useRef, useState } from "react";

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-6 w-6"
    >
      <path
        d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.2" strokeLinecap="round" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-6 w-6"
    >
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path
        d="m4 16.5 4.5-4.5 3 3 4-4L20.5 15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ACCEPT_IMAGENES = "image/jpeg,image/png,image/webp";

export function CameraCapture({
  onCapture,
  disabled,
}: {
  onCapture: (file: File, previewUrl: string) => void;
  disabled?: boolean;
}) {
  const camaraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
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

      {/* El atributo capture fuerza a que este input abra directo la
          cámara. El otro input no lo tiene, así que abre directo el
          selector de fotos del celular (galería), sin pasar por la
          cámara. */}
      <input
        ref={camaraRef}
        type="file"
        accept={ACCEPT_IMAGENES}
        capture="environment"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />
      <input
        ref={galeriaRef}
        type="file"
        accept={ACCEPT_IMAGENES}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />

      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => camaraRef.current?.click()}
          aria-label="Tomar foto con la cámara"
          className="flex flex-1 items-center justify-center rounded-md bg-emerald-700 py-2.5 text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          <CameraIcon />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => galeriaRef.current?.click()}
          aria-label="Elegir foto de la galería"
          className="flex flex-1 items-center justify-center rounded-md bg-emerald-700 py-2.5 text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          <GalleryIcon />
        </button>
      </div>
    </div>
  );
}
