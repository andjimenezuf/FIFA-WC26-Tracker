import { cn } from "cnfast";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Inline alert banner with an icon and a color tone. */
export function Notice({
  icon: Icon,
  tone,
  children,
}: {
  icon: LucideIcon;
  tone: "amber" | "red";
  children: ReactNode;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "animate-fade-up mx-auto mb-3 flex max-w-md items-center gap-2.5 rounded-xl border-2 px-3.5 py-2.5 text-sm leading-snug",
        tone === "amber"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-900"
          : "border-red-500/30 bg-red-500/10 text-red-900",
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          tone === "amber" ? "text-amber-600" : "text-red-600",
        )}
      />
      <span>{children}</span>
    </div>
  );
}
