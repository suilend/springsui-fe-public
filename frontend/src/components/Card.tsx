import { ClassValue } from "clsx";
import { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

interface CardProps extends PropsWithChildren {
  className?: ClassValue;
}

export default function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        "w-full rounded-lg border border-white/75 bg-white/20 shadow-sm backdrop-blur-[10px] md:rounded-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
