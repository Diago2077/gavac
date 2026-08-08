"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const SCANNER_ELEMENT_ID = "gavac-qr-scanner";

export function QRScanner({
  onResult,
}: {
  onResult: (decodedText: string) => void;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onResult(decodedText);
        },
        () => {
          // errores de frame individual (sin QR visible) - se ignoran
        },
      )
      .then(() => {
        if (!cancelled) setStarting(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "No se pudo acceder a la cámara. Revisá los permisos del navegador.",
          );
          setStarting(false);
        }
      });

    return () => {
      cancelled = true;
      const current = scannerRef.current;
      if (current) {
        current
          .stop()
          .then(() => current.clear())
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      <div
        id={SCANNER_ELEMENT_ID}
        className="mx-auto w-full max-w-sm overflow-hidden rounded-lg bg-black"
      />
      {starting && (
        <p className="text-center text-sm text-neutral-500">
          Iniciando cámara...
        </p>
      )}
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
