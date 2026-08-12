"use client";

import { useRouter } from "next/navigation";

export function TableRowLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(href)}
      className="cursor-pointer select-none hover:bg-neutral-50 dark:hover:bg-neutral-800 [-webkit-touch-callout:none]"
    >
      {children}
    </tr>
  );
}
