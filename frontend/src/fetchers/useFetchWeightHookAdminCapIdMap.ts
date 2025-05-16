import { SuiClient } from "@mysten/sui/client";
import useSWR from "swr";

import {
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import { PACKAGE_ID } from "@suilend/springsui-sdk/_generated/liquid_staking";

import { useAppContext } from "@/contexts/AppContext";

const getOwnedObjects = async (suiClient: SuiClient, address: string) => {
  const allObjs = [];
  let cursor = null;
  let hasNextPage = true;
  while (hasNextPage) {
    const objs = await suiClient.getOwnedObjects({
      owner: address,
      cursor,
      options: { showType: true },
    });

    allObjs.push(...objs.data);
    cursor = objs.nextCursor;
    hasNextPage = objs.hasNextPage;
  }

  return allObjs;
};

export default function useFetchWeightHookAdminCapIdMap() {
  const { suiClient } = useSettingsContext();
  const { address } = useWalletContext();
  const { appData } = useAppContext();

  const dataFetcher = async () => {
    if (!appData) return undefined; // Won't be reached as the useSWR key is null when appData is undefined
    if (!address) return undefined;

    const weightHookAdminCapIdMap = appData.lstCoinTypes.reduce(
      (acc, coinType) => ({ ...acc, [coinType]: undefined }),
      {} as Record<string, string | undefined>,
    );

    const allOwnedObjs = await getOwnedObjects(suiClient, address);
    for (const coinType of appData.lstCoinTypes) {
      const weightHookAdminCapType = `${PACKAGE_ID}::weight::WeightHookAdminCap<${coinType}>`;

      const ownedObj = allOwnedObjs.find(
        (obj) => obj.data?.type === weightHookAdminCapType,
      );
      if (ownedObj) weightHookAdminCapIdMap[coinType] = ownedObj.data?.objectId;
    }

    return weightHookAdminCapIdMap;
  };

  const { data, mutate } = useSWR<
    Record<string, string | undefined> | undefined
  >(!appData ? null : `weightHookAdminCapIdMap-${address}`, dataFetcher, {
    refreshInterval: 60 * 60 * 1000, // 1 hour
    onSuccess: (data) => {
      console.log("Refreshed weightHookAdminCapIdMap", data);
    },
    onError: (err) => {
      console.error("Failed to refresh weightHookAdminCapIdMap", err);
    },
  });

  return { data, mutateData: mutate };
}
