import ClaimFeesCard from "@/components/admin/ClaimFeesCard";
import RebalanceCard from "@/components/admin/RebalanceCard";
import UpdateFeesCard from "@/components/admin/UpdateFeesCard";
import ValidatorAddressesAndWeightsCard from "@/components/admin/ValidatorAddressesAndWeightsCard";
import { FooterSm } from "@/components/Footer";
import Skeleton from "@/components/Skeleton";
import TokenLogo from "@/components/TokenLogo";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useLoadedLstContext } from "@/contexts/LstContext";
import { cn } from "@/lib/utils";

export default function Admin() {
  const { appData } = useLoadedAppContext();
  const { admin } = useLoadedLstContext();

  const detectedWeightHookAdminCapIds = Object.entries(
    admin.weightHookAdminCapIdMap ?? {},
  )
    .filter(([, value]) => value !== undefined)
    .map(([lstId]) => lstId);

  return (
    <>
      <div className="relative z-[1] flex w-full flex-col items-center px-4 pt-4 md:px-10 md:py-20">
        <div className="flex w-full max-w-4xl flex-col items-center gap-8">
          {/* Title */}
          <div className="flex w-full flex-col items-center gap-3">
            <p className="text-center text-h1">Admin</p>

            <div className="flex flex-row items-center gap-2">
              {(detectedWeightHookAdminCapIds.length > 0
                ? detectedWeightHookAdminCapIds
                : ["sSUI"]
              ).map((lstId) => {
                const lstData = appData.lstDataMap[lstId];

                return (
                  <button
                    key={lstId}
                    className={cn(
                      "group flex h-10 flex-row items-center gap-2 rounded-[20px] px-2 pr-3",
                      lstId === admin.lstId
                        ? "cursor-default bg-white"
                        : "bg-white/25 transition-colors",
                    )}
                    onClick={() => admin.setLstId(lstId)}
                  >
                    <TokenLogo token={lstData.token} size={24} />
                    <p
                      className={cn(
                        "!text-p2",
                        lstId === admin.lstId
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
            <UpdateFeesCard />
            <ClaimFeesCard />
            {admin.weightHook === undefined ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <ValidatorAddressesAndWeightsCard />
            )}
          </div>

          {/* WIDTH < md */}
          <FooterSm />
        </div>
      </div>
    </>
  );
}
