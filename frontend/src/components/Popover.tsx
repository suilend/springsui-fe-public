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
  contentProps?: PopoverContentProps;
}

export default function Popover({
  rootProps,
  trigger,
  contentProps,
  children,
}: PopoverProps) {
  const { className: contentClassName, ...restContentProps } =
    contentProps || {};

  return (
    <PopoverRoot {...rootProps}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      {/* Set fonts on popover as using PopoverPortal with container set to the app container (see Tooltip) doesn't work */}
      <PopoverContent
        className={cn(fontClassNames, contentClassName)}
        collisionPadding={12}
        sideOffset={12}
        align="start"
        style={{
          maxWidth: "var(--radix-popover-content-available-width)",
        }}
        {...restContentProps}
      >
        {children}
      </PopoverContent>
    </PopoverRoot>
  );
}
