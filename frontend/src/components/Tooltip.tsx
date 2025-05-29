import {
  Dispatch,
  ElementRef,
  PropsWithChildren,
  ReactNode,
  SetStateAction,
  createContext,
  forwardRef,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  TooltipContentProps,
  TooltipPortal,
  TooltipProps as TooltipRootProps,
  TooltipTriggerProps,
} from "@radix-ui/react-tooltip";
import { merge } from "lodash";

import useIsTouchscreen from "@suilend/sui-fe-next/hooks/useIsTouchscreen";

import {
  TooltipContent,
  Tooltip as TooltipRoot,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TooltipTriggerContext {
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

const TooltipTriggerContext = createContext<TooltipTriggerContext>({
  isOpen: false,
  onOpenChange: () => {
    throw Error("TooltipTriggerContextProvider not initialized");
  },
});

function CustomTooltipRoot({
  delayDuration,
  children,
  ...props
}: TooltipRootProps) {
  const isTouchscreen = useIsTouchscreen();
  const [isOpen, setIsOpen] = useState<boolean>(props.defaultOpen ?? false);

  const contextValue: TooltipTriggerContext = useMemo(
    () => ({
      isOpen,
      onOpenChange: setIsOpen,
    }),
    [isOpen],
  );

  return (
    <TooltipRoot
      open={props.open || isOpen}
      onOpenChange={setIsOpen}
      delayDuration={isTouchscreen ? 0 : (delayDuration ?? 0)}
      {...props}
    >
      <TooltipTriggerContext.Provider value={contextValue}>
        {children}
      </TooltipTriggerContext.Provider>
    </TooltipRoot>
  );
}

const CustomTooltipTrigger = forwardRef<
  ElementRef<typeof TooltipTrigger>,
  TooltipTriggerProps
>(({ children, ...props }, ref) => {
  const isTouchscreen = useIsTouchscreen();
  const { isOpen, onOpenChange } = useContext(TooltipTriggerContext);

  return (
    <TooltipTrigger
      ref={ref}
      onClick={(e) => {
        if (!isTouchscreen) return;
        if (!isOpen) {
          e.preventDefault();
          e.stopPropagation();

          onOpenChange((_isOpen) => !_isOpen);
        }
      }}
      {...props}
    >
      {children}
    </TooltipTrigger>
  );
});
CustomTooltipTrigger.displayName = "CustomTooltipTrigger";

export interface TooltipProps extends PropsWithChildren {
  rootProps?: TooltipRootProps;
  contentProps?: TooltipContentProps;
  title?: string | ReactNode;
  content?: ReactNode;
}

export default function Tooltip({
  rootProps,
  contentProps,
  title,
  content,
  children,
}: TooltipProps) {
  const {
    className: contentClassName,
    style: contentStyle,
    ...restContentProps
  } = contentProps || {};

  if (title === undefined && content === undefined) return children;
  return (
    <CustomTooltipRoot delayDuration={250} {...rootProps}>
      <CustomTooltipTrigger asChild>{children}</CustomTooltipTrigger>

      <TooltipPortal
        container={
          typeof document === "undefined"
            ? undefined
            : document.getElementById("__app_main")
        }
      >
        <TooltipContent
          className={cn("z-[100] break-words", contentClassName)}
          collisionPadding={4}
          style={merge(
            {
              maxWidth:
                "min(var(--radix-tooltip-content-available-width), 300px)",
            },
            contentStyle,
          )}
          onClick={(e) => e.stopPropagation()}
          {...restContentProps}
        >
          {content || <p className="text-p2 text-navy-600">{title}</p>}
        </TooltipContent>
      </TooltipPortal>
    </CustomTooltipRoot>
  );
}
