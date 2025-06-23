import { ReactNode, useState } from "react";

import DOMPurify from "dompurify";
import { ChevronDown, ChevronUp } from "lucide-react";

import Popover from "@/components/Popover";
import { cn } from "@/lib/utils";

interface SelectPopoverProps {
  maxWidth?: number;
  placeholder?: string;
  options: {
    id: string;
    iconUrl?: string;
    name: string;
    endDecorator?: ReactNode;
  }[];
  highlightedOptionIds?: string[];
  value: string;
  onChange: (id: string) => void;
}

export default function SelectPopover({
  maxWidth,
  placeholder,
  options,
  highlightedOptionIds,
  value,
  onChange,
}: SelectPopoverProps) {
  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const Chevron = isOpen ? ChevronUp : ChevronDown;

  const selectedOption = options.find((option) => option.id === value);

  return (
    <Popover
      rootProps={{ open: isOpen, onOpenChange: setIsOpen }}
      contentProps={{
        align: "end",
        maxWidth: maxWidth ?? 280,
      }}
      trigger={
        <button className="group flex h-10 w-full flex-row items-center justify-between gap-4 rounded-sm bg-white pl-4 pr-3">
          {selectedOption ? (
            <div className="flex min-w-0 flex-1 flex-row items-center justify-between gap-4">
              <div className="flex min-w-0 flex-row items-center gap-2">
                {selectedOption.iconUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="h-4 w-4 min-w-4 shrink-0"
                    src={DOMPurify.sanitize(selectedOption.iconUrl)}
                    alt={selectedOption.name}
                    width={16}
                    height={16}
                  />
                )}

                <p className="overflow-hidden text-ellipsis text-nowrap !text-p2 text-foreground">
                  {selectedOption.name}
                </p>
              </div>

              {selectedOption.endDecorator}
            </div>
          ) : (
            <p className="overflow-hidden text-ellipsis text-nowrap text-p1 text-navy-500">
              {placeholder ?? "Select option"}
            </p>
          )}

          <Chevron
            className={cn(
              "-ml-0.5 h-4 w-4 shrink-0 transition-colors",
              isOpen
                ? "text-foreground"
                : "text-navy-600 group-hover:text-foreground",
            )}
          />
        </button>
      }
    >
      <div className="flex w-full flex-col gap-1">
        {options.map((option, index) => (
          <button
            key={option.id}
            className={cn(
              "group flex h-10 w-full flex-row items-center justify-between gap-4 rounded-sm px-3 transition-colors",
              option.id === value
                ? "border-light-blue bg-light-blue"
                : "bg-navy-100/50",
              highlightedOptionIds?.includes(option.id) &&
                cn(
                  index !== 0 && "mt-2",
                  index !== options.length - 1 && "mb-2",
                ),
            )}
            onClick={() => {
              onChange(option.id);
              setIsOpen(false);
            }}
          >
            <div className="flex min-w-0 flex-1 flex-row items-center gap-2">
              {option.iconUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="h-4 w-4 min-w-4 shrink-0"
                  src={DOMPurify.sanitize(option.iconUrl)}
                  alt={option.name}
                  width={16}
                  height={16}
                />
              )}

              <p
                className={cn(
                  "overflow-hidden text-ellipsis text-nowrap !text-p2 transition-colors",
                  option.id === value
                    ? "text-foreground"
                    : "text-navy-600 transition-colors group-hover:text-foreground",
                )}
              >
                {option.name}
              </p>
            </div>

            {option.endDecorator}
          </button>
        ))}
      </div>
    </Popover>
  );
}
