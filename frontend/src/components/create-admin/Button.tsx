import { PropsWithChildren } from "react";

import { ClassValue } from "clsx";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface ButtonProps extends PropsWithChildren {
  className?: ClassValue;
  onClick: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
}

export default function Button({
  className,
  onClick,
  isLoading,
  isDisabled,
  children,
}: ButtonProps) {
  return (
    <button
      className={cn(
        "relative flex h-10 w-max flex-row items-center justify-center gap-2 rounded-sm bg-navy-800 px-3 text-white transition-opacity disabled:opacity-50",
        className,
      )}
      disabled={isLoading || isDisabled}
      onClick={onClick}
    >
      <div
        className={cn(
          "absolute inset-0 z-[2] flex flex-row items-center justify-center transition-opacity",
          !isLoading && "opacity-0",
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>

      <p
        className={cn(
          "relative z-[1] text-p2 transition-opacity",
          isLoading && "opacity-0",
        )}
      >
        {children ?? "Submit"}
      </p>
    </button>
  );
}
