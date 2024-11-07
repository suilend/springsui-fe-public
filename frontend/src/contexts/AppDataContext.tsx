import BigNumber from "bignumber.js";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";

import { useRootContext } from "@/contexts/RootContext";
import useFetchAppData from "@/fetchers/useFetchAppData";
import { ParsedLiquidStakingInfo, Token } from "@/lib/types";

export interface AppData {
  tokenMap: Record<string, Token>;
  liquidStakingInfo: ParsedLiquidStakingInfo;

  suiPrice: BigNumber;
  lstPrice: BigNumber;
  lstReserveAprPercent: BigNumber;
  lstReserveTvlUsd: BigNumber;
  lstReserveSendPointsPerDay: BigNumber;

  currentEpoch: number;
  currentEpochProgressPercent: number;
  currentEpochEndMs: number;
}

export interface AppDataContext {
  appData: AppData | undefined;
  refreshAppData: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContext>({
  appData: undefined,
  refreshAppData: async () => {
    throw Error("AppDataContextProvider not initialized");
  },
});

export const useAppDataContext = () => useContext(AppDataContext);

export function AppDataContextProvider({ children }: PropsWithChildren) {
  const { suiClient } = useRootContext();

  // App data
  const { appData, mutateAppData } = useFetchAppData(suiClient);

  const refreshAppData = useCallback(async () => {
    await mutateAppData();
  }, [mutateAppData]);

  // Context
  const contextValue: AppDataContext = useMemo(
    () => ({
      appData,
      refreshAppData,
    }),
    [appData, refreshAppData],
  );

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
}
