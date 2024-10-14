import { PropsWithChildren } from "react";

import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

interface CardProps extends PropsWithChildren {
  className?: ClassValue;
}

export default function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        "w-full rounded-lg border border-white/75 bg-white/20 shadow-[0_1px_1px_0px_hsla(var(--navy-800)/10%)] backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
  );
}
