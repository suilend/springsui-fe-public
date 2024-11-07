import { ClassValue } from "clsx";
import { Loader2 } from "lucide-react";
import { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

interface ButtonProps extends PropsWithChildren {
  className?: ClassValue;
  onClick: () => void;
  isDisabled?: boolean;
  isSubmitting?: boolean;
}

export default function Button({
  className,
  onClick,
  isDisabled,
  isSubmitting,
  children,
}: ButtonProps) {
  return (
    <button
      className={cn(
        "relative flex h-10 w-max flex-row items-center justify-center gap-2 rounded-sm bg-navy-800 px-3 text-white disabled:opacity-50",
        className,
      )}
      onClick={onClick}
      disabled={isDisabled}
    >
      <div
        className={cn(
          "absolute inset-0 z-[2] flex flex-row items-center justify-center transition-opacity ",
          isSubmitting ? "opacity-100" : "opacity-0",
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>

      <p
        className={cn(
          "relative z-[1] text-p2 transition-opacity",
          isSubmitting && "opacity-0",
        )}
      >
        {children ?? "Submit"}
      </p>
    </button>
  );
}
