import { CoinBalance, SuiClient } from "@mysten/sui/client";
import { normalizeStructTag } from "@mysten/sui/utils";
import { toast } from "sonner";
import useSWR from "swr";

import { AppContext, AppData } from "@/contexts/AppContext";

export default function useFetchAppData(
  suiClient: SuiClient,
  address: string | undefined,
) {
  // Data
  const dataFetcher = async () => {
    let coinBalancesRaw: CoinBalance[] = [];

    if (address) {
      // Wallet assets
      coinBalancesRaw = (
        await suiClient.getAllBalances({
          owner: address,
        })
      )
        .map((cb) => ({ ...cb, coinType: normalizeStructTag(cb.coinType) }))
        .sort((a, b) => (a.coinType < b.coinType ? -1 : 1));
    }

    return {
      coinBalancesRaw,
    } as AppData;
  };

  const { data, mutate } = useSWR<AppContext["data"]>(
    `appData-${address}`,
    dataFetcher,
    {
      refreshInterval: 30 * 1000,
      onSuccess: (data) => {
        console.log("Refreshed app data", data);
      },
      onError: (err) => {
        toast.error("Failed to refresh app data.", {
          description: (err as Error)?.message || "An unknown error occured",
        });
        console.error(err);
      },
    },
  );

  return {
    data,
    mutate,
  };
}
