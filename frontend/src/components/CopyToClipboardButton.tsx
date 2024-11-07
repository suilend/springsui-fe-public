import { Copy } from "lucide-react";
import { MouseEvent } from "react";

import { errorToast, infoToast } from "@/lib/toasts";

interface CopyToClipboardButtonProps {
  value: string;
}

export default function CopyToClipboardButton({
  value,
}: CopyToClipboardButtonProps) {
  const copyToClipboard = async (e: MouseEvent) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(value.toString());
      infoToast("Copied to clipboard", {
        icon: <Copy className="text-navy-600" />,
        description: value,
      });
    } catch (err) {
      errorToast(`Failed to copy to clipboard`, err as Error);
      console.error(err);
    }
  };

  return (
    <button
      className="group flex h-5 w-5 flex-row items-center justify-center"
      onClick={copyToClipboard}
    >
      <Copy className="h-4 w-4 text-navy-500 transition-colors group-hover:text-foreground" />
    </button>
  );
}
