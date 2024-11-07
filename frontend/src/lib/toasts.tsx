import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { ExternalToast, toast } from "sonner";

import { TOAST_DURATION_MS, TX_TOAST_DURATION_MS } from "@/lib/constants";

const onDismiss = (callback: () => void) => {
  for (let i = 0; i < 10; i++) toast.dismiss();
  setTimeout(() => {
    callback();
  }, 250);
};

export const infoToast = (title: string, data?: ExternalToast) => {
  onDismiss(() => toast.info(title, data));
};

export const successToast = (
  title: string,
  description?: string,
  txUrl?: string,
) => {
  onDismiss(() =>
    toast.success(title, {
      description,
      action: txUrl ? (
        <Link
          className="actionButton block flex flex-col justify-center text-navy-600 transition-colors hover:text-foreground"
          href={txUrl}
          target="_blank"
        >
          <ExternalLink className="h-5 w-5" />
        </Link>
      ) : undefined,
      duration: txUrl ? TX_TOAST_DURATION_MS : TOAST_DURATION_MS,
    }),
  );
};

export const errorToast = (
  title: string,
  err: Error,
  isTransaction?: boolean,
) => {
  let description = (err?.message as string) || "An unknown error occurred";
  if (description[0].toLowerCase() === description[0])
    description = `${description[0].toUpperCase()}${description.slice(1)}`;

  onDismiss(() =>
    toast.error(title, {
      description,
      duration: isTransaction ? TX_TOAST_DURATION_MS : TOAST_DURATION_MS,
    }),
  );
};
