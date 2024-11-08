import Link from "next/link";

import { ExternalLink } from "lucide-react";
import { ExternalToast } from "sonner";

import { showSuccessToast } from "@suilend/frontend-sui";

export const showSuccessTxnToast = (
  title: string,
  txUrl: string,
  data?: Omit<ExternalToast, "action" | "duration">,
) =>
  showSuccessToast(title, {
    ...(data ?? {}),
    action: (
      <Link
        className="actionButton block flex flex-col justify-center text-navy-600 transition-colors hover:text-foreground"
        href={txUrl}
        target="_blank"
      >
        <ExternalLink className="h-5 w-5" />
      </Link>
    ),
  });
