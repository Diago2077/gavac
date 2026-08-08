"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Header } from "@/components/Header";
import { QRScanner } from "@/components/QRScanner";

export default function ScanPage() {
  const router = useRouter();
  const handled = useRef(false);
  const [notFound, setNotFound] = useState<string | null>(null);

  function handleResult(decodedText: string) {
    if (handled.current) return;

    // Los QR generados por la propia app codifican "gavac:finca:<id>" o "gavac:animal:<id>".
    const match = decodedText.match(/^gavac:(finca|animal):(.+)$/);
    if (!match) {
      setNotFound("Este código QR no pertenece a GAVAC.");
      return;
    }

    handled.current = true;
    const [, tipo, id] = match;
    if (tipo === "finca") {
      router.push(`/fincas/${id}/animales`);
    } else {
      router.push(`/animales/${id}/conteo`);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Escanear QR" backHref="/fincas" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 space-y-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Apuntá la cámara al código QR de la finca o del animal.
        </p>
        <QRScanner onResult={handleResult} />
        {notFound && (
          <p className="text-center text-sm text-red-600">{notFound}</p>
        )}
      </main>
    </div>
  );
}
