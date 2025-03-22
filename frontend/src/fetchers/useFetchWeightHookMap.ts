import useSWR from "swr";

import { useSettingsContext } from "@suilend/frontend-sui-next";
import { phantom } from "@suilend/springsui-sdk/_generated/_framework/reified";
import { WeightHook } from "@suilend/springsui-sdk/_generated/liquid_staking/weight/structs";

import { useAppContext } from "@/contexts/AppContext";

export default function useFetchWeightHookMap() {
  const { suiClient } = useSettingsContext();
  const { appData } = useAppContext();

  const dataFetcher = async () => {
    if (!appData?.LIQUID_STAKING_INFO_MAP) return undefined; // Won't be reached as the useSWR key is null when appData is undefined

    const weightHookMap = Object.keys(appData.LIQUID_STAKING_INFO_MAP).reduce(
      (acc, lstId) => ({ ...acc, [lstId]: {} as WeightHook<string> }),
      {} as Record<string, WeightHook<string>>,
    );

    for (const [lstId, LIQUID_STAKING_INFO] of Object.entries(
      appData.LIQUID_STAKING_INFO_MAP,
    )) {
      weightHookMap[lstId] = await WeightHook.fetch(
        suiClient,
        phantom(LIQUID_STAKING_INFO.type),
        LIQUID_STAKING_INFO.weightHookId,
      );
    }

    return weightHookMap;
  };

  const { data, mutate } = useSWR<
    Record<string, WeightHook<string>> | undefined
  >(!appData ? null : "weightHookMap", dataFetcher, {
    refreshInterval: 60 * 1000,
    onSuccess: (data) => {
      console.log("Refreshed weightHookMap", data);
    },
    onError: (err) => {
      console.error("Failed to refresh weightHookMap", err);
    },
  });

  return { data, mutateData: mutate };
}
