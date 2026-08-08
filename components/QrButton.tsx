"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { QRCodeDisplay } from "./QRCodeDisplay";

export function QrButton({ value, label }: { value: string; label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ver código QR"
        className="shrink-0 text-neutral-500 hover:text-emerald-700 dark:text-neutral-400 dark:hover:text-emerald-400"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="h-5 w-5"
        >
          <rect x="3.5" y="3.5" width="6" height="6" rx="1" />
          <rect x="14.5" y="3.5" width="6" height="6" rx="1" />
          <rect x="3.5" y="14.5" width="6" height="6" rx="1" />
          <path
            d="M14.5 14.5h3v3h-3zM20.5 14.5v3M17.5 20.5h3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <Modal onClose={() => setOpen(false)}>
          <div className="flex flex-col items-center gap-4">
            <QRCodeDisplay value={value} size={220} label={label} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
