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
  overline,
  title,
  description,
  align = "center",
  className,
}: {
  /** Opcional: o título já contextualiza a seção, e a pill acrescentava um
      degrau de hierarquia sem informação. */
  eyebrow?: string;
  /** Texto corrido em caixa alta com tracking largo, sem pill. É o token
      Overline do DS — outro papel que o eyebrow: contextualiza sem virar
      componente. */
  overline?: string;
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
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}

      {overline && <span className="t-overline text-muted-foreground">{overline}</span>}

      <h2 className="t-display-lg text-balance text-foreground">{title}</h2>

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
