import { PropsWithChildren, ReactNode } from "react";

import {
  PopoverContentProps,
  PopoverProps as PopoverRootProps,
} from "@radix-ui/react-popover";

import {
  PopoverContent,
  Popover as PopoverRoot,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fontClassNames } from "@/lib/fonts";
import { cn } from "@/lib/utils";

interface PopoverProps extends PropsWithChildren {
  rootProps?: PopoverRootProps;
  trigger?: ReactNode;
  contentProps?: PopoverContentProps & {
    maxWidth?: number;
    maxHeight?: number;
  };
}

export default function Popover({
  rootProps,
  trigger,
  contentProps,
  children,
}: PopoverProps) {
  const {
    className: contentClassName,
    style: contentStyle,
    maxWidth: contentMaxWidth,
    maxHeight: contentMaxHeight,
    ...restContentProps
  } = contentProps || {};

  return (
    <PopoverRoot {...rootProps}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className={cn(fontClassNames, contentClassName)}
        collisionPadding={16}
        sideOffset={2}
        align="start"
        style={{
          maxWidth: `min(${contentMaxWidth ?? 9999}px, var(--radix-popover-content-available-width))`,
          maxHeight: `min(${contentMaxHeight ?? 9999}px, var(--radix-popper-available-height))`,
          ...contentStyle,
        }}
        {...restContentProps}
      >
        {children}
      </PopoverContent>
    </PopoverRoot>
  );
}
