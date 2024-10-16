import { normalizeStructTag } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";
import useSWR from "swr";

import { useAppContext } from "@/contexts/AppContext";
import { coinTypes } from "@/lib/coinType";
import { errorToast } from "@/lib/toasts";

export default function useFetchBalances(address: string | undefined) {
  const { suiClient } = useAppContext();

  const dataFetcher = async () => {
    // Balances
    const balancesMap: Record<string, BigNumber> = {};

    if (address) {
      const rawBalances = (
        await suiClient.getAllBalances({
          owner: address,
        })
      )
        .map((cb) => ({ ...cb, coinType: normalizeStructTag(cb.coinType) }))
        .sort((a, b) => (a.coinType < b.coinType ? -1 : 1));

      for (const coinType of coinTypes) {
        balancesMap[coinType] = new BigNumber(
          rawBalances.find((balance) => balance.coinType === coinType)
            ?.totalBalance ?? 0,
        );
      }
    }

    return balancesMap;
  };

  const { data, mutate } = useSWR<Record<string, BigNumber>>(
    `balances-${address}`,
    dataFetcher,
    {
      refreshInterval: 15 * 1000,
      onSuccess: (data) => {
        console.log("Refreshed wallet balances", data);
      },
      onError: (err) => {
        errorToast("Failed to refresh wallet balances.", err);
        console.error(err);
      },
    },
  );

  return { data, mutate };
}
