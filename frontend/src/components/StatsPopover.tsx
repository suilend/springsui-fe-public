import { useState } from "react";

import { ChartBar } from "lucide-react";

import Popover from "@/components/Popover";
import { AppData, useAppDataContext } from "@/contexts/AppDataContext";
import useBreakpoint from "@/hooks/useBreakpoint";
import { NORMALIZED_SUI_COINTYPE } from "@/lib/coinType";
import { formatToken, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StatsContent() {
  const appDataContext = useAppDataContext();
  const appData = appDataContext.appData as AppData;

  const suiToken = appData.tokenMap[NORMALIZED_SUI_COINTYPE];

  const stats: {
    label: string;
    value: string;
    subValue?: string;
  }[] = [
    {
      label: "Total value locked (TVL)",
      value: `${formatToken(appData.liquidStakingInfo.totalSuiSupply)} ${suiToken.symbol}`,
      subValue: formatUsd(
        appData.liquidStakingInfo.totalSuiSupply.times(appData.suiPrice),
      ),
    },
  ];

  return stats.map((stat, index) => (
    <div key={index} className="flex w-full flex-row justify-between">
      <p className="text-p2 text-navy-600">{stat.label}</p>
      <div className="flex flex-col items-end">
        <p className="text-p2">{stat.value}</p>
        {stat.subValue && (
          <p className="text-p2 text-navy-500">{stat.subValue}</p>
        )}
      </div>
    </div>
  ));
}
export default function StatsPopover() {
  const { md } = useBreakpoint();

  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <Popover
      rootProps={{ open: isOpen, onOpenChange: setIsOpen }}
      trigger={
        <button className="group flex h-12 flex-row items-center justify-center rounded-md bg-white px-4 shadow-sm">
          <div className="flex flex-row items-center gap-2">
            <ChartBar
              size={20}
              className={cn(
                isOpen
                  ? "text-foreground"
                  : "text-navy-600 transition-colors group-hover:text-foreground",
              )}
            />
            <p
              className={cn(
                "!text-p2",
                isOpen
                  ? "text-foreground"
                  : "text-navy-600 transition-colors group-hover:text-foreground",
              )}
            >
              Stats
            </p>
          </div>
        </button>
      }
      contentProps={{
        align: md ? "start" : "center",
        maxWidth: 320,
      }}
    >
      <div className="flex w-full flex-col gap-3">
        <StatsContent />
      </div>
    </Popover>
  );
}
