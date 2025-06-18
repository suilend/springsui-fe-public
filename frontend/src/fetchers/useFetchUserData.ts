import useSWR, { useSWRConfig } from "swr";

import { initializeObligations } from "@suilend/sdk";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";

import { useAppContext } from "@/contexts/AppContext";
import { UserData } from "@/contexts/UserContext";

export default function useFetchUserData() {
  const { suiClient } = useSettingsContext();
  const { address } = useWalletContext();
  const { appData } = useAppContext();

  const { cache } = useSWRConfig();

  // Data
  const dataFetcher = async () => {
    if (!appData) return undefined as unknown as UserData; // In practice `dataFetcher` won't be called if `appData` is falsy

    const { obligationOwnerCaps: _obligationOwnerCaps, obligations } =
      await initializeObligations(
        suiClient,
        appData.suilendClient,
        appData.refreshedRawReserves,
        appData.reserveMap,
        address,
      );
    const obligationOwnerCaps = _obligationOwnerCaps
      .slice()
      .sort(
        (a, b) =>
          obligations.findIndex((o) => o.id === a.obligationId) -
          obligations.findIndex((o) => o.id === b.obligationId),
      ); // Same order as `obligations`

    return {
      obligationOwnerCaps,
      obligations,
    };
  };

  const { data, mutate } = useSWR<UserData>(
    !appData ? null : `userData-${address}`,
    dataFetcher,
    {
      refreshInterval: 30 * 1000,
      onSuccess: (data) => {
        console.log("Fetched user data", data);
      },
      onError: (err, key) => {
        const isInitialLoad = cache.get(key)?.data === undefined;
        if (isInitialLoad) showErrorToast("Failed to fetch user data", err);

        console.error(err);
      },
    },
  );

  return { data, mutateData: mutate };
}
