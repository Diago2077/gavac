"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export function QRCodeDisplay({
  value,
  size = 160,
  label,
}: {
  value: string;
  size?: number;
  label?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: "#064e3b", light: "#ffffff" },
    }).catch(() => {
      // si falla el render del QR, no bloqueamos el resto de la UI
    });
  }, [value, size]);

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <canvas ref={canvasRef} width={size} height={size} />
      {label && (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {label}
        </span>
      )}
    </div>
  );
}
