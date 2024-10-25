import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { SuiClient } from "@mysten/sui/client";
import BigNumber from "bignumber.js";

import { LstClient } from "@springsui/sdk/functions";

import useFetchAppData from "@/fetchers/useFetchAppData";
import { LIQUID_STAKING_INFO } from "@/lib/coinType";
import { EXPLORER, RPC } from "@/lib/constants";
import { ParsedLiquidStakingInfo, Token } from "@/lib/types";

export interface AppData {
  suiPrice: BigNumber;
  suilendPointsPerDay: BigNumber;
  coinMetadataMap: Record<string, Token>;
  liquidStakingInfo: ParsedLiquidStakingInfo;
}

export interface AppContext {
  suiClient: SuiClient;
  lstClient: LstClient | null;
  appData: AppData | undefined;
  refreshAppData: () => Promise<void>;

  rpc: typeof RPC;
  explorer: typeof EXPLORER;
}

const defaultContextValue: AppContext = {
  suiClient: new SuiClient({ url: RPC.url }),
  lstClient: null,
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

  // Lst client
  const [lstClient, setLstClient] = useState<LstClient | null>(null);
  useEffect(() => {
    (async () => {
      const _lstClient = await LstClient.initialize(
        suiClient,
        LIQUID_STAKING_INFO,
      );
      setLstClient(_lstClient);
    })();
  }, [suiClient]);

  // App data
  const { data: appData, mutate: mutateAppData } = useFetchAppData(suiClient);

  const refreshAppData = useCallback(async () => {
    await mutateAppData();
  }, [mutateAppData]);

  // Context
  const contextValue: AppContext = useMemo(
    () => ({
      suiClient,
      lstClient,
      appData,
      refreshAppData,

      rpc: RPC,
      explorer: EXPLORER,
    }),
    [suiClient, lstClient, appData, refreshAppData],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
