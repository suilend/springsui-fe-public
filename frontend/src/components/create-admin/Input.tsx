import { InputHTMLAttributes } from "react";

import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

interface InputProps {
  className?: ClassValue;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
  placeholder?: string;
  value: string;
  onChange?: (value: string) => void;
}

export default function Input({
  className,
  type,
  placeholder,
  value,
  onChange,
}: InputProps) {
  const isReadOnly = !onChange;

  return (
    <input
      type={type}
      className={cn(
        "h-10 w-full rounded-sm bg-white px-4 font-sans text-p1 text-foreground placeholder:text-navy-500 focus-within:shadow-[inset_0_0_0_1px_hsl(var(--blue))] focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        isReadOnly && "focus-within:shadow-none bg-white/50",
        className,
      )}
      placeholder={placeholder}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      readOnly={isReadOnly}
      onWheel={(e) => e.currentTarget.blur()}
    />
  );
}
