import Link from "next/link";
import { useRouter } from "next/router";
import { cloneElement } from "react";

import { NAV_ITEMS } from "@/components/Nav";
import { cn } from "@/lib/utils";

export const BOTTOM_NAV_BOTTOM_HEIGHT = 78; // px

export default function BottomNav() {
  const router = useRouter();

  return (
    <>
      {/* WIDTH < md */}
      <div
        className="fixed inset-x-0 bottom-0 z-[2] flex flex-col rounded-t-lg bg-white outline outline-navy-200/25 md:hidden"
        style={{ height: BOTTOM_NAV_BOTTOM_HEIGHT }}
      >
        <div className="flex w-full flex-row items-center px-6 py-4">
          {NAV_ITEMS.map((item) => {
            const isSelected = router.pathname === item.url;
            const isDisabled = !item.url;
            const Component = !isDisabled ? Link : "div";

            return (
              <Component
                href={item.url as string}
                key={item.title}
                className="group flex flex-1 flex-col items-center gap-1.5"
              >
                {item.icon &&
                  cloneElement(item.icon, {
                    className: cn(
                      "h-5 w-5",
                      isSelected
                        ? "text-foreground"
                        : !isDisabled
                          ? "text-navy-600 transition-colors group-hover:text-foreground"
                          : "text-navy-400",
                    ),
                  })}

                <p
                  className={cn(
                    "!text-p2",
                    isSelected
                      ? "text-foreground"
                      : !isDisabled
                        ? "text-navy-600 transition-colors group-hover:text-foreground"
                        : "text-navy-400",
                  )}
                >
                  {item.title}
                </p>
              </Component>
            );
          })}
        </div>
      </div>

      {/* WIDTH < md */}
      <div
        className="relative z-[1] w-full shrink-0 md:hidden"
        style={{ height: BOTTOM_NAV_BOTTOM_HEIGHT }}
      />
    </>
  );
}
