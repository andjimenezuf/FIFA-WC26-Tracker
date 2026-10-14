"use client";

import { cn } from "cnfast";
import { ChevronRight } from "lucide-react";
import { type ReactNode, useId, useState } from "react";

import { CardGridFrame } from "@/components/ui/card-grid";

interface SectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Overrides the default text-muted-foreground on the title text. */
  titleClassName?: string;
  /** Overrides the default bg-border on the two flanking rule lines. */
  lineClassName?: string;
}

/** A titled, collapsible section with a sticky header. Generic layout — it knows
 *  nothing about what it wraps. */
export function Section({
  title,
  children,
  defaultOpen = true,
  titleClassName,
  lineClassName,
}: SectionProps) {
  const contentId = useId();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="space-y-2">
      <CardGridFrame className="sticky top-0 z-20">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((current) => !current)}
          className="relative grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3 bg-background/90 pb-2 pt-3 text-xs font-medium tracking-widest text-muted-foreground uppercase backdrop-blur transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className={cn("h-px bg-border", lineClassName)} />
          <span className={cn("rounded-sm px-2", titleClassName)}>{title}</span>
          <span className={cn("mr-8 h-px bg-border", lineClassName)} />
          <ChevronRight
            aria-hidden
            className={cn(
              "absolute right-1 size-3 transition-transform",
              open && "rotate-90",
            )}
          />
        </button>
      </CardGridFrame>
      {open && <div id={contentId}>{children}</div>}
    </section>
  );
}
