import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";

import { SuiClient } from "@mysten/sui/client";
import BigNumber from "bignumber.js";

import useFetchAppData from "@/fetchers/useFetchAppData";
import { EXPLORER, RPC } from "@/lib/constants";
import { ParsedLiquidStakingInfo, Token } from "@/lib/types";

export interface AppData {
  suiPrice: BigNumber;
  coinMetadataMap: Record<string, Token>;
  liquidStakingInfo: ParsedLiquidStakingInfo;
}

export interface AppContext {
  suiClient: SuiClient;
  appData: AppData | undefined;
  refreshAppData: () => Promise<void>;

  rpc: typeof RPC;
  explorer: typeof EXPLORER;
}

const defaultContextValue: AppContext = {
  suiClient: new SuiClient({ url: RPC.url }),
  appData: undefined,
  refreshAppData: async () => {
    throw Error("AppContextProvider not initialized");
  },

  rpc: RPC,
  explorer: EXPLORER,
};

const AppContext = createContext<AppContext>(defaultContextValue);

export const useAppContext = () => useContext(AppContext);

export function AppContextProvider({ children }: PropsWithChildren) {
  // Sui client
  const suiClient = useMemo(() => new SuiClient({ url: RPC.url }), []);

  // App data
  const { data: appData, mutate: mutateAppData } = useFetchAppData(suiClient);

  const refreshAppData = useCallback(async () => {
    await mutateAppData();
  }, [mutateAppData]);

  // Context
  const contextValue: AppContext = useMemo(
    () => ({
      suiClient,
      appData,
      refreshAppData,

      rpc: RPC,
      explorer: EXPLORER,
    }),
    [suiClient, appData, refreshAppData],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
