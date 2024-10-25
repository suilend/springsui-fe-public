import Link from "next/link";
import { useRouter } from "next/router";
import { cloneElement } from "react";

import { GitCompare } from "lucide-react";

import ConnectWalletButton from "@/components/ConnectWalletButton";
import FaqPopover from "@/components/FaqPopover";
import SpringSuiIcon from "@/components/icons/SpringSuiIcon";
import StakeIcon from "@/components/icons/StakeIcon";
import StatsPopover from "@/components/StatsPopover";
import useBreakpoint from "@/hooks/useBreakpoint";
import { DEFI_URL, ROOT_URL } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const SM_NAV_HEIGHT = 60; // px
export const MD_NAV_HEIGHT = 72; // px

export const NAV_ITEMS = [
  { url: ROOT_URL, icon: <StakeIcon />, title: "Stake" },
  { url: DEFI_URL, icon: <GitCompare />, title: "DeFi" },
  // { icon: <SpringSuiIcon />, title: "SpringSui Standard" },
];

export default function Nav() {
  const router = useRouter();

  const { md } = useBreakpoint();

  return (
    <>
      <div
        className="fixed inset-x-0 top-0 z-[2] flex w-full flex-row items-center justify-between px-4 py-2.5 max-md:bg-[#DFEAFA]/25 max-md:backdrop-blur-[10px] md:justify-start md:bg-white md:px-10 md:py-4"
        style={{ height: md ? MD_NAV_HEIGHT : SM_NAV_HEIGHT }}
      >
        {/* Logo */}
        <div className="flex flex-row items-center gap-1.5 md:w-40">
          <SpringSuiIcon />

          {/* WIDTH >= md */}
          <p className="text-h3 max-md:hidden">SpringSui</p>
        </div>

        {/* Items, WIDTH >= md */}
        <div className="flex flex-1 flex-row justify-center gap-10 max-md:hidden">
          {NAV_ITEMS.map((item) => {
            const isSelected = router.pathname === item.url;
            const isDisabled = !item.url;
            const Component = !isDisabled ? Link : "div";

            return (
              <Component
                href={item.url as string}
                key={item.title}
                className="group flex h-10 flex-row items-center gap-2"
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

        {/* Stats, FAQ, and wallet */}
        <div className="flex flex-row items-center gap-3 md:w-40 md:justify-end">
          {/* Stats and FAQ, WIDTH < md */}
          <div className="flex flex-row items-center gap-1 md:hidden">
            <StatsPopover />
            <FaqPopover />
          </div>

          <ConnectWalletButton />
        </div>
      </div>

      <div
        className="relative z-[1] w-full shrink-0"
        style={{ height: md ? MD_NAV_HEIGHT : SM_NAV_HEIGHT }}
      />
    </>
  );
}
