import { ChartBar } from "lucide-react";

import Popover from "@/components/Popover";
import { AppData, useAppContext } from "@/contexts/AppContext";
import {
  NORMALIZED_LST_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
} from "@/lib/coinType";
import { formatNumber, formatPercent, formatToken } from "@/lib/format";

export default function StatsPopover() {
  const appContext = useAppContext();
  const data = appContext.data as AppData;

  const suiToken = data.coinMetadataMap[NORMALIZED_SUI_COINTYPE];
  const lstToken = data.coinMetadataMap[NORMALIZED_LST_COINTYPE];

  const stats = [
    {
      label: "APR",
      value: formatPercent(data.liquidStakingInfo.aprPercent),
    },
    {
      label: `Total staked ${lstToken.symbol}`,
      value: formatToken(data.liquidStakingInfo.totalLstSupply),
    },
    {
      label: `Total locked ${suiToken.symbol}`,
      value: formatToken(data.liquidStakingInfo.totalSuiSupply),
    },
    {
      label: "Total stakers",
      value: formatNumber(data.liquidStakingInfo.totalStakers),
    },
  ];

  return (
    <Popover
      trigger={
        <button className="flex h-8 w-8 flex-row items-center justify-center gap-2 md:h-12 md:w-auto md:rounded-md md:bg-white md:px-4 md:shadow-sm">
          <ChartBar size={20} />
          <p className="text-p2 max-md:hidden">Stats</p>
        </button>
      }
      contentProps={{
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
