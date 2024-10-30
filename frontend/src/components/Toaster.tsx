import { CSSProperties } from "react";

import { AlertTriangle, Check, Info } from "lucide-react";

import { BOTTOM_NAV_BOTTOM_HEIGHT } from "@/components/BottomNav";
import { FOOTER_MD_HEIGHT } from "@/components/Footer";
import styles from "@/components/Toaster.module.scss";
import { Toaster as ToasterComponent } from "@/components/ui/sonner";
import useBreakpoint from "@/hooks/useBreakpoint";
import { TOAST_DURATION_MS } from "@/lib/constants";
import { fontClassNames } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export default function Toaster() {
  const { md } = useBreakpoint();

  return (
    <ToasterComponent
      theme="light"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: cn(
            "bg-white text-foreground border-none outline outline-navy-200/25 shadow-sm gap-1 p-4 flex flex-col items-start justify-start rounded-md",
            fontClassNames,
            styles.toast,
          ),
          content: "gap-1.5",
          icon: cn("absolute top-4 left-4 w-5 h-6 m-0", styles.icon),
          title: "px-7 text-foreground text-p1 font-sans font-medium",
          description: "text-navy-600 text-p2 font-sans font-medium",
          // closeButton: cn(
          //   "absolute top-0 right-0 text-foreground border-none transition-colors w-11 h-12 !bg-transparent pt-4 pr-4 pb-2 pl-2",
          //   styles.closeButton,
          // ),
        },
        style: {
          "--toast-close-button-start": "auto",
          "--toast-close-button-transform": "none",
        } as CSSProperties,
      }}
      gap={2 * 4}
      icons={{
        success: <Check className="text-success" />,
        info: <Info className="text-navy-600" />,
        error: <AlertTriangle className="text-error" />,
      }}
      duration={TOAST_DURATION_MS}
      style={{
        right: md ? 8 + 24 : 16,
        bottom: md ? FOOTER_MD_HEIGHT + 24 : BOTTOM_NAV_BOTTOM_HEIGHT + 16,
      }}
    />
  );
}
