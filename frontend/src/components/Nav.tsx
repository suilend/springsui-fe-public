import Link from "next/link";
import { useRouter } from "next/router";
import { cloneElement } from "react";

import { Coins } from "lucide-react";

import ConnectWalletButton from "@/components/ConnectWalletButton";
import FaqPopover from "@/components/FaqPopover";
import SpringSuiIcon from "@/components/icons/SpringSuiIcon";
import StakeIcon from "@/components/icons/StakeIcon";
import StatsPopover from "@/components/StatsPopover";
import { DEFI_URL, ROOT_URL } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export const NAV_HEIGHT = 72; // px

export default function Nav() {
  const router = useRouter();

  return (
    <>
      <div
        className="fixed inset-x-0 top-0 z-[2] flex w-full flex-row items-center justify-between px-4 py-2.5 md:justify-start md:gap-6 md:bg-white md:px-10 md:py-4"
        style={{ height: NAV_HEIGHT }}
      >
        <div className="flex flex-row items-center gap-1.5 md:w-40 md:justify-start">
          <SpringSuiIcon />
          <p className="text-h3 max-md:hidden">SpringSui</p>
        </div>

        <div className="flex flex-1 flex-row justify-center gap-10 max-md:hidden">
          {[
            { url: ROOT_URL, icon: <StakeIcon />, title: "Stake" },
            { url: DEFI_URL, icon: <Coins />, title: "DeFi" },
            {
              icon: <SpringSuiIcon />,
              title: "SpringSui Standard",
              endDecorator: "Soon",
            },
          ].map((item) => {
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

                {item.endDecorator && (
                  <p className="rounded-[4px] bg-navy-100 px-1 py-0.5 text-p3 text-navy-600">
                    {item.endDecorator}
                  </p>
                )}
              </Component>
            );
          })}
        </div>

        <div className="flex flex-row items-center gap-3 md:w-40 md:justify-end">
          <div className="flex flex-row items-center gap-1 md:hidden">
            <StatsPopover />
            <FaqPopover />
          </div>

          <ConnectWalletButton />
        </div>
      </div>
      <div className="relative z-[1] w-full" style={{ height: NAV_HEIGHT }} />
    </>
  );
}
