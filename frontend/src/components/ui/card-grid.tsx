import { cn } from "cnfast";
import { Children, isValidElement, type ReactNode } from "react";

interface CardGridFrameProps {
  children: ReactNode;
  className?: string;
}

interface CardGridProps {
  children: ReactNode;
  /** Overrides the default grid-cols-1 md:grid-cols-2. */
  className?: string;
}

export function CardGridFrame({ children, className }: CardGridFrameProps) {
  return <div className={cn("mx-auto w-full", className)}>{children}</div>;
}

export function CardGrid({ children, className }: CardGridProps) {
  const items = Children.toArray(children);

  return (
    <CardGridFrame
      className={cn("grid grid-cols-1 gap-3 md:grid-cols-2", className)}
    >
      {items.map((child, index) => {
        const key =
          isValidElement(child) && child.key != null ? child.key : index;
        return (
          <div
            key={key}
            className="mx-auto w-full min-w-0 max-w-[480px] shrink-0"
          >
            {child}
          </div>
        );
      })}
    </CardGridFrame>
  );
}
