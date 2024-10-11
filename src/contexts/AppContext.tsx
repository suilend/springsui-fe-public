import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import {
  CoinBalance,
  SuiClient,
  SuiTransactionBlockResponse,
} from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { isEqual } from "lodash";

import { useWalletContext } from "@/contexts/WalletContext";
import useFetchAppData from "@/fetchers/useFetchAppData";
import { EXPLORERS, RPCS } from "@/lib/constants";

export interface AppData {
  coinBalancesRaw: CoinBalance[];
}

export interface AppContext {
  suiClient: SuiClient | null;
  data: AppData | null;
  refreshData: () => Promise<void>;
  rpc: (typeof RPCS)[number];
  explorer: (typeof EXPLORERS)[number];
  signExecuteAndWaitForTransaction: (
    transaction: Transaction,
  ) => Promise<SuiTransactionBlockResponse>;
}

const defaultContextValue: AppContext = {
  suiClient: null,
  data: null,
  refreshData: async () => {
    throw Error("AppContextProvider not initialized");
  },
  rpc: RPCS[0],
  explorer: EXPLORERS[0],
  signExecuteAndWaitForTransaction: () => {
    throw Error("AppContextProvider not initialized");
  },
};

const AppContext = createContext<AppContext>(defaultContextValue);

export const useAppContext = () => useContext(AppContext);

export function AppContextProvider({ children }: PropsWithChildren) {
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();

  // Sui client
  const suiClient = useMemo(() => new SuiClient({ url: RPCS[0].url }), []);

  // App data
  const { data, mutate: mutateData } = useFetchAppData(suiClient, address);

  const refreshData = useCallback(async () => {
    await mutateData();
  }, [mutateData]);

  // Poll for balance changes
  const previousBalancesRef = useRef<CoinBalance[] | undefined>(undefined);
  useEffect(() => {
    previousBalancesRef.current = undefined;

    if (!address) return;
    if (!suiClient) return;

    const interval = setInterval(async () => {
      try {
        const balances = await suiClient.getAllBalances({
          owner: address,
        });

        if (
          previousBalancesRef.current !== undefined &&
          !isEqual(balances, previousBalancesRef.current)
        )
          await refreshData();
        previousBalancesRef.current = balances;
      } catch (err) {
        console.error(err);
      }
    }, 1000 * 5);

    return () => {
      if (interval !== undefined) clearInterval(interval);
    };
  }, [address, suiClient, refreshData]);

  // Context
  const contextValue: AppContext = useMemo(
    () => ({
      suiClient,
      data: data ?? null,
      refreshData,
      rpc: RPCS[0],
      explorer: EXPLORERS[0],
      signExecuteAndWaitForTransaction: (transaction: Transaction) =>
        signExecuteAndWaitForTransaction(suiClient, transaction),
    }),
    [suiClient, data, refreshData, signExecuteAndWaitForTransaction],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
