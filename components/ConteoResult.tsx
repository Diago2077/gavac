"use client";

import { useEffect, useRef } from "react";
import type { Deteccion } from "@/lib/types";

export function ConteoResult({
  imageUrl,
  countTotal,
  detecciones,
  observaciones,
}: {
  imageUrl: string;
  countTotal: number;
  detecciones: Deteccion[];
  observaciones?: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    function draw() {
      if (!canvas || !img) return;
      const width = img.clientWidth;
      const height = img.clientHeight;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 2;
      ctx.fillStyle = "#dc2626";

      detecciones.forEach((d, i) => {
        const x = d.x * width;
        const y = d.y * height;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = "10px sans-serif";
        ctx.fillText(String(i + 1), x + 12, y - 8);
      });
    }

    if (img.complete) {
      draw();
    } else {
      img.addEventListener("load", draw);
    }
    window.addEventListener("resize", draw);
    return () => {
      img.removeEventListener("load", draw);
      window.removeEventListener("resize", draw);
    };
  }, [detecciones]);

  return (
    <div className="space-y-3">
      <div className="relative w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Foto analizada"
          className="w-full rounded-lg border border-neutral-200 object-contain max-h-96"
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      </div>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
        <p className="text-3xl font-bold text-emerald-800">{countTotal}</p>
        <p className="text-sm text-emerald-700">garrapatas detectadas</p>
      </div>

      {observaciones && (
        <p className="text-sm text-neutral-600 italic">
          Observación de la IA: {observaciones}
        </p>
      )}
    </div>
  );
}
