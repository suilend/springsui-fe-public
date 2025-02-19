import useSWR from "swr";

import {
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import { LstClient } from "@suilend/springsui-sdk";

import { useAppContext } from "@/contexts/AppContext";

export default function useFetchWeightHookAdminCapIdMap() {
  const { suiClient } = useSettingsContext();
  const { address } = useWalletContext();
  const { appData } = useAppContext();

  const dataFetcher = async () => {
    if (!appData?.LIQUID_STAKING_INFO_MAP) return undefined; // Won't be reached as the useSWR key is null when appData is undefined
    if (!address) return undefined;

    const weightHookAdminCapIdMap = Object.keys(
      appData.LIQUID_STAKING_INFO_MAP,
    ).reduce(
      (acc, lstId) => ({ ...acc, [lstId]: undefined }),
      {} as Record<string, string | undefined>,
    );

    for (const [lstId, LIQUID_STAKING_INFO] of Object.entries(
      appData.LIQUID_STAKING_INFO_MAP,
    )) {
      weightHookAdminCapIdMap[lstId] =
        (await LstClient.getWeightHookAdminCapId(
          suiClient,
          address,
          LIQUID_STAKING_INFO.type,
        )) ?? undefined;
    }

    return weightHookAdminCapIdMap;
  };

  const { data, mutate } = useSWR<
    Record<string, string | undefined> | undefined
  >(!appData ? null : `weightHookAdminCapIdMap-${address}`, dataFetcher, {
    refreshInterval: 60 * 1000,
    onSuccess: (data) => {
      console.log("Refreshed weightHookAdminCapIdMap", data);
    },
    onError: (err) => {
      console.error("Failed to refresh weightHookAdminCapIdMap", err);
    },
  });

  return { data, mutateData: mutate };
}
