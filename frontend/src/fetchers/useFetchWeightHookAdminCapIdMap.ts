import useSWR from "swr";

import {
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import {
  LIQUID_STAKING_INFO_MAP,
  LstClient,
  LstId,
} from "@suilend/springsui-sdk";

export default function useFetchWeightHookAdminCapIdMap() {
  const { suiClient } = useSettingsContext();
  const { address } = useWalletContext();

  const dataFetcher = async () => {
    if (!address) return undefined;

    const weightHookAdminCapIdMap = Object.values(LstId).reduce(
      (acc, lstId) => ({ ...acc, [lstId]: {} }),
      {} as Record<LstId, string | undefined>,
    );

    for (const _lstId of Object.values(LstId)) {
      const LIQUID_STAKING_INFO = LIQUID_STAKING_INFO_MAP[_lstId];

      weightHookAdminCapIdMap[_lstId] =
        (await LstClient.getWeightHookAdminCapId(
          suiClient,
          address,
          LIQUID_STAKING_INFO.type,
        )) ?? undefined;
    }

    return weightHookAdminCapIdMap;
  };

  const { data, mutate } = useSWR<
    Record<LstId, string | undefined> | undefined
  >(`weightHookAdminCapIdMap-${address}`, dataFetcher, {
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
