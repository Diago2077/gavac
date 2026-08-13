"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TableRowLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);

  return (
    <tr
      onClick={() => {
        setPressed(true);
        router.push(href);
      }}
      className={`cursor-pointer transition-colors duration-150 hover:bg-neutral-50 active:bg-emerald-100 dark:hover:bg-neutral-800 dark:active:bg-emerald-900 ${
        pressed ? "bg-emerald-100 dark:bg-emerald-900" : ""
      }`}
    >
      {children}
    </tr>
  );
}
