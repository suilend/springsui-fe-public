import { useState } from "react";

import { ChartBar } from "lucide-react";

import Popover from "@/components/Popover";
import { AppData, useAppContext } from "@/contexts/AppContext";
import useBreakpoint from "@/hooks/useBreakpoint";
import { NORMALIZED_SUI_COINTYPE } from "@/lib/coinType";
import { formatToken } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function StatsPopover() {
  const appContext = useAppContext();
  const appData = appContext.appData as AppData;

  const { md } = useBreakpoint();

  const suiToken = appData.coinMetadataMap[NORMALIZED_SUI_COINTYPE];

  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Stats
  const stats = [
    {
      label: `Total value locked (TVL)`,
      value: `${formatToken(appData.liquidStakingInfo.totalSuiSupply)} ${suiToken.symbol}`,
    },
  ];

  return (
    <Popover
      rootProps={{ open: isOpen, onOpenChange: setIsOpen }}
      trigger={
        <button className="group flex h-10 w-8 flex-row items-center justify-center gap-2 md:h-12 md:w-auto md:rounded-md md:bg-white md:px-4 md:shadow-sm">
          <ChartBar
            size={20}
            className={cn(
              isOpen
                ? "text-foreground"
                : "text-navy-600 transition-colors group-hover:text-foreground",
            )}
          />

          {/* WIDTH >= md */}
          <p
            className={cn(
              "!text-p2 max-md:hidden",
              isOpen
                ? "text-foreground"
                : "text-navy-600 transition-colors group-hover:text-foreground",
            )}
          >
            Stats
          </p>
        </button>
      }
      contentProps={{
        align: md ? "start" : "center",
        maxWidth: 280,
      }}
    >
      <div className="flex w-full flex-col gap-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="flex w-full flex-row items-center justify-between"
          >
            <p className="text-p2 text-navy-600">{stat.label}</p>
            <p className="text-p2">{stat.value}</p>
          </div>
        ))}
      </div>
    </Popover>
  );
}
