import { ReactNode, useMemo, useState } from "react";

import { intervalToDuration } from "date-fns";
import { ChartBar } from "lucide-react";

import { formatToken, formatUsd } from "@suilend/frontend-sui";

import Popover from "@/components/Popover";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useLoadedLstContext } from "@/contexts/LstContext";
import useBreakpoint from "@/hooks/useBreakpoint";
import { cn } from "@/lib/utils";

export function StatsContent() {
  const { appData } = useLoadedAppContext();
  const { lstCoinTypes } = useLoadedLstContext();

  type Stat = {
    labelStartDecorator?: ReactNode;
    label: string;
    labelEndDecorator?: ReactNode;
    valueStartDecorator?: ReactNode;
    children?: ReactNode;
    value?: string;
    valueEndDecorator?: ReactNode;
    subValue?: string;
  };

  const stats = useMemo(() => {
    const lstDatas = lstCoinTypes.map(
      (coinType) => appData.lstDataMap[coinType],
    );

    const currentEpochEndsDuration = intervalToDuration({
      start: new Date(),
      end: new Date(appData.currentEpochEndMs),
    });

    const result: Stat[] = [
      ...lstDatas.reduce(
        (acc, lstData) => [
          ...acc,
          {
            label: `${lstData.token.symbol} TVL`,
            value: `${formatToken(lstData.totalSuiSupply)} ${appData.suiToken.symbol}`,
            subValue: formatUsd(lstData.totalSuiSupply.times(appData.suiPrice)),
          },
        ],
        [] as Stat[],
      ),
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

    return result;
  }, [
    appData.currentEpochEndMs,
    lstCoinTypes,
    appData.lstDataMap,
    appData.suiToken.symbol,
    appData.suiPrice,
    appData.currentEpoch,
    appData.currentEpochProgressPercent,
  ]);

  return stats.map((stat, index) => (
    <div key={index} className="flex w-full flex-row justify-between">
      <div className="flex h-max flex-row items-center gap-1.5">
        {stat.labelStartDecorator}
        <p className="text-p2 text-navy-600">{stat.label}</p>
        {stat.labelEndDecorator}
      </div>

      <div className="flex flex-col items-end">
        <div className="flex flex-row items-center gap-1.5">
          {stat.valueStartDecorator}
          {stat.children ?? <p className="text-p2">{stat.value}</p>}
          {stat.valueEndDecorator}
        </div>
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
