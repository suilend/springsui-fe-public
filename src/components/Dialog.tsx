import { PropsWithChildren, ReactNode } from "react";

import { DialogProps as DialogRootProps } from "@radix-ui/react-dialog";

import {
  DialogContent,
  Dialog as DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DialogProps extends PropsWithChildren {
  rootProps?: DialogRootProps;
  trigger?: ReactNode;
}

export default function Dialog({ rootProps, trigger, children }: DialogProps) {
  return (
    <DialogRoot {...rootProps}>
      {trigger && (
        <DialogTrigger asChild className="appearance-none">
          {trigger}
        </DialogTrigger>
      )}

      <DialogContent
        className="shadow-none bg-transparent max-w-[396px] px-2 py-0 md:max-w-[380px] md:px-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {children}
      </DialogContent>
    </DialogRoot>
  );
}
