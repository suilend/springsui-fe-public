import { ReactElement, cloneElement } from "react";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type SubmitButtonState = {
  icon?: ReactElement;
  title?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
};

interface SubmitButtonProps {
  state: SubmitButtonState;
  submit: () => Promise<void>;
}

export default function SubmitButton({ state, submit }: SubmitButtonProps) {
  const { icon, title, isLoading, isDisabled, onClick } = state;

  return (
    <button
      className={cn(
        "flex h-[60px] w-full flex-row items-center justify-center gap-2.5 rounded-md px-4",
        !isDisabled || isLoading
          ? "bg-navy-800 text-white"
          : "bg-navy-200 text-navy-500",
      )}
      disabled={isDisabled}
      onClick={onClick ?? submit}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <>
          {icon &&
            cloneElement(icon, {
              className: "h-5 w-5",
            })}
          <p>{title}</p>
        </>
      )}
    </button>
  );
}
