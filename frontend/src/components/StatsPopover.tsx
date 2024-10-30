import { useState } from "react";

import { ChartBar } from "lucide-react";

import Popover from "@/components/Popover";
import { AppData, useAppContext } from "@/contexts/AppContext";
import useBreakpoint from "@/hooks/useBreakpoint";
import {
  NORMALIZED_LST_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
} from "@/lib/coinType";
import { formatToken } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StatsTitleProps {
  isOpen?: boolean;
}

export function StatsTitle({ isOpen }: StatsTitleProps) {
  return (
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
  );
}

export function StatsContent() {
  const appContext = useAppContext();
  const appData = appContext.appData as AppData;

  const suiToken = appData.tokenMap[NORMALIZED_SUI_COINTYPE];
  const lstToken = appData.tokenMap[NORMALIZED_LST_COINTYPE];

  const stats = [
    {
      label: `Total value locked (TVL)`,
      value: `${formatToken(appData.liquidStakingInfo.totalSuiSupply)} ${suiToken.symbol}`,
    },
  ];

  return stats.map((stat, index) => (
    <div
      key={index}
      className="flex w-full flex-row items-center justify-between"
    >
      <p className="text-p2 text-navy-600">{stat.label}</p>
      <p className="text-p2">{stat.value}</p>
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
          <StatsTitle isOpen={isOpen} />
        </button>
      }
      contentProps={{
        align: md ? "start" : "center",
        maxWidth: 280,
      }}
    >
      <div className="flex w-full flex-col gap-3">
        <StatsContent />
      </div>
    </Popover>
  );
}
