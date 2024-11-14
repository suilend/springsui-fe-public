import useSWR from "swr";

import {
  LIQUID_STAKING_INFO_MAP,
  LstId,
  useSettingsContext,
} from "@suilend/frontend-sui";
import { phantom } from "@suilend/springsui-sdk/_generated/_framework/reified";
import { WeightHook } from "@suilend/springsui-sdk/_generated/liquid_staking/weight/structs";

export default function useFetchWeightHookMap() {
  const { suiClient } = useSettingsContext();

  const dataFetcher = async () => {
    const weightHookMap = Object.values(LstId).reduce(
      (acc, lstId) => ({ ...acc, [lstId]: {} }),
      {} as Record<LstId, WeightHook<string>>,
    );

    for (const _lstId of Object.values(LstId)) {
      const LIQUID_STAKING_INFO = LIQUID_STAKING_INFO_MAP[_lstId];

      weightHookMap[_lstId] = await WeightHook.fetch(
        suiClient,
        phantom(LIQUID_STAKING_INFO.type),
        LIQUID_STAKING_INFO.weightHookId,
      );
    }

    return weightHookMap;
  };

  const { data, mutate } = useSWR<
    Record<LstId, WeightHook<string>> | undefined
  >("weightHookMap", dataFetcher, {
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
