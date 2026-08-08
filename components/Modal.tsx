"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function Modal({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Se renderiza con un portal directo a <body> a propósito: si el botón
  // que abre el modal vive dentro de un ancestro con backdrop-filter (como
  // el header, que usa backdrop-blur), un modal "fixed" anidado ahí adentro
  // queda posicionado relativo a ese ancestro en vez de a toda la pantalla
  // (backdrop-filter -- igual que transform/filter -- crea un containing
  // block nuevo para los hijos fixed). El portal evita ese problema.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
