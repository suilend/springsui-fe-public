import { ReactNode, useState } from "react";

import { intervalToDuration } from "date-fns";
import { ChartBar } from "lucide-react";

import Popover from "@/components/Popover";
import { AppData, useAppContext } from "@/contexts/AppContext";
import useBreakpoint from "@/hooks/useBreakpoint";
import { NORMALIZED_SUI_COINTYPE } from "@/lib/coinType";
import { formatToken, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StatsContent() {
  const appContext = useAppContext();
  const appData = appContext.appData as AppData;

  const suiToken = appData.tokenMap[NORMALIZED_SUI_COINTYPE];

  const currentEpochEndsDuration = intervalToDuration({
    start: new Date(),
    end: new Date(appData.currentEpochEndMs),
  });

  const stats: {
    label: string;
    children?: ReactNode;
    value?: string;
    subValue?: string;
  }[] = [
    {
      label: "Total value locked (TVL)",
      value: `${formatToken(appData.liquidStakingInfo.totalSuiSupply)} ${suiToken.symbol}`,
      subValue: formatUsd(
        appData.liquidStakingInfo.totalSuiSupply.times(appData.suiPrice),
      ),
    },
    {
      label: "Current epoch",
      children: (
        <div className="flex flex-row items-center gap-2">
          <p className="text-p2">{appData.currentEpoch}</p>
          <div className="h-2 w-[80px] overflow-hidden rounded-[4px] bg-white/75 md:bg-navy-100">
            <div
              className="h-full w-[80px] rounded-[4px] bg-navy-600 transition-transform"
              style={{
                transform: `translateX(${-(100 - appData.currentEpochProgressPercent)}%)`,
              }}
            />
          </div>
        </div>
      ),
      subValue: `Ends in ${currentEpochEndsDuration.hours ?? 0}h ${currentEpochEndsDuration.minutes ?? 0}m`,
    },
  ];

  return stats.map((stat, index) => (
    <div key={index} className="flex w-full flex-row justify-between">
      <p className="text-p2 text-navy-600">{stat.label}</p>
      <div className="flex flex-col items-end">
        {stat.children ?? <p className="text-p2">{stat.value}</p>}
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
