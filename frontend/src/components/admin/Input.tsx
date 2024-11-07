import { ClassValue } from "clsx";
import { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface InputProps {
  className?: ClassValue;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
  value: string;
  onChange?: (value: string) => void;
}

export default function Input({
  className,
  type,
  value,
  onChange,
}: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "h-10 w-full rounded-sm bg-white px-4 font-sans text-p1 text-foreground placeholder:text-navy-500 focus-within:shadow-[inset_0_0_0_1px_hsl(var(--blue))] focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        className,
      )}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      readOnly={!onChange}
      onWheel={(e) => e.currentTarget.blur()}
    />
  );
}
