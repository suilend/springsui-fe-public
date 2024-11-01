import { PropsWithChildren } from "react";

import { ClassValue } from "clsx";
import { Loader2 } from "lucide-react";

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
      {isSubmitting && (
        <div className="absolute inset-0">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      <p className={cn("text-p2", isSubmitting && "hidden")}>
        {children ?? "Submit"}
      </p>
    </button>
  );
}
