import * as React from "react";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ClassValue } from "clsx";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

// Overlay
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Close asChild>
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 backdrop-blur-[10px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  </DialogPrimitive.Close>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// Content
export type DialogContentProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
>;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, ...props }, ref) => (
  <DialogPortal
    container={
      typeof document === "undefined"
        ? undefined
        : document.getElementById("__app_main")
    }
  >
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-8 z-50 flex flex-col items-center justify-center data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

// Header
export interface DialogHeaderProps {
  className?: ClassValue;
  title: React.ReactNode;
  titleEndContent?: React.ReactNode;
  showCloseButton?: boolean;
  description?: React.ReactNode;
}

const DialogHeader = ({
  className,
  title,
  titleEndContent,
  showCloseButton = true,
  description,
}: DialogHeaderProps) => {
  return (
    <div className="flex w-full flex-col gap-1 p-4">
      {/* Title */}
      <div
        className={cn(
          "flex h-6 w-full flex-row items-center justify-between gap-4",
          className,
        )}
      >
        <p className="flex flex-row items-center gap-2 text-h3">{title}</p>

        {(titleEndContent || showCloseButton) && (
          <div className="flex flex-row items-center">
            {titleEndContent}
            {showCloseButton && (
              <DialogPrimitive.Close asChild>
                <button className="group">
                  <X className="h-5 w-5 text-navy-600 transition-colors group-hover:text-foreground" />
                </button>
              </DialogPrimitive.Close>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {description && <p className="text-p2 text-navy-600">{description}</p>}
    </div>
  );
};

// Footer
export interface DialogFooterProps extends React.PropsWithChildren {
  className?: ClassValue;
}

const DialogFooter = ({ className, children, ...props }: DialogFooterProps) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);
DialogFooter.displayName = "DialogFooter";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
};
