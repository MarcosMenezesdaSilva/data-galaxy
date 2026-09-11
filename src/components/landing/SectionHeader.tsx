import type { ReactNode } from "react";

import { Eyebrow } from "@/components/Brand";
import { cn } from "@/lib/utils";

/**
 * Cabeçalho compartilhado pelas seções da landing.
 *
 * O `id` vem do <section> que envolve o header, não daqui — quem ancora é a
 * seção. Aqui fica só a tríade eyebrow / título / descrição, sempre como h2,
 * porque o h1 da página é a headline do hero.
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  align?: "center" | "start";
  className?: string;
}) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "dg-stagger flex flex-col gap-5",
        centered ? "items-center text-center" : "items-start",
        className,
      )}
    >
      <Eyebrow>{eyebrow}</Eyebrow>

      <h2 className="t-h1 text-balance text-foreground">{title}</h2>

      {description && (
        <p
          className={cn(
            "t-body-lg text-pretty text-muted-foreground",
            centered ? "max-w-2xl" : "max-w-xl",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
