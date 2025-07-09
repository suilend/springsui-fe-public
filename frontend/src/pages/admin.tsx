import { NORMALIZED_sSUI_COINTYPE } from "@suilend/sui-fe";

import ClaimFeesCard from "@/components/admin/ClaimFeesCard";
import RebalanceCard from "@/components/admin/RebalanceCard";
import TransferOwnershipCard from "@/components/admin/TransferOwnershipCard";
import UpdateFeesCard from "@/components/admin/UpdateFeesCard";
import UpdateMetadataCard from "@/components/admin/UpdateMetadataCard";
import UpdateValidatorsCard from "@/components/admin/UpdateValidatorsCard";
import { FooterSm } from "@/components/Footer";
import TokenLogo from "@/components/TokenLogo";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useLoadedLstContext } from "@/contexts/LstContext";
import { cn } from "@/lib/utils";

export default function Admin() {
  const { appData, lstWeightHookAdminCapIdMap } = useLoadedAppContext();
  const { admin } = useLoadedLstContext();

  const detectedWeightHookAdminCapIds = Object.entries(
    lstWeightHookAdminCapIdMap ?? {},
  ).map(([coinType]) => coinType);

  return (
    <>
      <div className="relative z-[1] flex w-full flex-col items-center px-4 pt-4 md:px-10 md:py-20">
        <div className="flex w-full max-w-2xl flex-col items-center gap-8">
          {/* Title */}
          <div className="flex w-full flex-col items-center gap-3">
            <p className="text-center text-h1">Admin</p>

            <div className="flex flex-row flex-wrap items-center justify-center gap-2">
              {(detectedWeightHookAdminCapIds.length > 0
                ? detectedWeightHookAdminCapIds
                : [NORMALIZED_sSUI_COINTYPE]
              ).map((coinType) => {
                const lstData = appData.lstDataMap[coinType];

                return (
                  <button
                    key={coinType}
                    className={cn(
                      "group flex h-10 flex-row items-center gap-2 rounded-[20px] px-2 pr-3",
                      coinType === admin.lstCoinType
                        ? "cursor-default bg-white"
                        : "bg-white/25 transition-colors",
                    )}
                    onClick={() => admin.setLstCoinType(coinType)}
                  >
                    <TokenLogo token={lstData.token} size={24} />
                    <p
                      className={cn(
                        "!text-p2",
                        coinType === admin.lstCoinType
                          ? "text-foreground"
                          : "text-navy-600 transition-colors group-hover:text-foreground",
                      )}
                    >
                      {lstData.token.symbol}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex w-full flex-col gap-4">
            <RebalanceCard />
            <ClaimFeesCard />
            <UpdateMetadataCard />
            <UpdateFeesCard />
            <UpdateValidatorsCard />
            <TransferOwnershipCard />
          </div>

          {/* WIDTH < md */}
          <FooterSm />
        </div>
      </div>
    </>
  );
}
