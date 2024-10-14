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
import BigNumber from "bignumber.js";
import { isEqual } from "lodash";

import { useWalletContext } from "@/contexts/WalletContext";
import useFetchAppData from "@/fetchers/useFetchAppData";
import { EXPLORER, RPC } from "@/lib/constants";
import { ParsedLiquidStakingInfo, Token } from "@/lib/types";

export interface AppData {
  suiPrice: BigNumber;
  coinMetadataMap: Record<string, Token>;
  balanceMap: Record<string, BigNumber>;
  liquidStakingInfo: ParsedLiquidStakingInfo;
}

export interface AppContext {
  suiClient: SuiClient;
  data: AppData | null;
  refreshData: () => Promise<void>;
  getBalance: (coinType: string) => BigNumber;
  rpc: typeof RPC;
  explorer: typeof EXPLORER;
  signExecuteAndWaitForTransaction: (
    transaction: Transaction,
  ) => Promise<SuiTransactionBlockResponse>;
}

const defaultContextValue: AppContext = {
  suiClient: new SuiClient({ url: RPC.url }),
  data: null,
  refreshData: async () => {
    throw Error("AppContextProvider not initialized");
  },
  getBalance: () => {
    throw Error("AppContextProvider not initialized");
  },
  rpc: RPC,
  explorer: EXPLORER,
  signExecuteAndWaitForTransaction: () => {
    throw Error("AppContextProvider not initialized");
  },
};

const AppContext = createContext<AppContext>(defaultContextValue);

export const useAppContext = () => useContext(AppContext);

export function AppContextProvider({ children }: PropsWithChildren) {
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();

  // Sui client
  const suiClient = useMemo(() => new SuiClient({ url: RPC.url }), []);

  // App data
  const { data, mutate: mutateData } = useFetchAppData(suiClient, address);

  const refreshData = useCallback(async () => {
    await mutateData();
  }, [mutateData]);

  const getBalance = useCallback(
    (coinType: string) => data?.balanceMap[coinType] ?? new BigNumber(0),
    [data],
  );

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
      getBalance,
      rpc: RPC,
      explorer: EXPLORER,
      signExecuteAndWaitForTransaction: (transaction: Transaction) =>
        signExecuteAndWaitForTransaction(suiClient, transaction),
    }),
    [
      suiClient,
      data,
      refreshData,
      getBalance,
      signExecuteAndWaitForTransaction,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
