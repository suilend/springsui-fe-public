import { ChartBar } from "lucide-react";

import Popover from "@/components/Popover";
import { AppData, useAppContext } from "@/contexts/AppContext";
import useBreakpoint from "@/hooks/useBreakpoint";
import {
  NORMALIZED_LST_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
} from "@/lib/coinType";
import { formatToken } from "@/lib/format";

export default function StatsPopover() {
  const appContext = useAppContext();
  const appData = appContext.appData as AppData;

  const { md } = useBreakpoint();

  const suiToken = appData.coinMetadataMap[NORMALIZED_SUI_COINTYPE];
  const lstToken = appData.coinMetadataMap[NORMALIZED_LST_COINTYPE];

  const stats = [
    {
      label: `Staked ${lstToken.symbol}`,
      value: formatToken(appData.liquidStakingInfo.totalLstSupply),
    },
    {
      label: `Locked ${suiToken.symbol}`,
      value: formatToken(appData.liquidStakingInfo.totalSuiSupply),
    },
    // {
    //   label: "Stakers",
    //   value: formatNumber(appData.liquidStakingInfo.totalStakers),
    // },
  ];

  return (
    <Popover
      trigger={
        <button className="flex h-10 w-8 flex-row items-center justify-center gap-2 md:h-12 md:w-auto md:rounded-md md:bg-white md:px-4 md:shadow-sm">
          <ChartBar size={20} />

          {/* WIDTH >= md */}
          <p className="text-p2 max-md:hidden">Stats</p>
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
