import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import BigNumber from "bignumber.js";

import { useSettingsContext, useWalletContext } from "@suilend/frontend-sui";
import useFetchBalances from "@suilend/frontend-sui/fetchers/useFetchBalances";
import useRefreshOnBalancesChange from "@suilend/frontend-sui/hooks/useRefreshOnBalancesChange";
import { LstClient } from "@suilend/springsui-sdk";

import useFetchAppData from "@/fetchers/useFetchAppData";
import { LIQUID_STAKING_INFO } from "@/lib/coinType";
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

export interface AppContext {
  lstClient: LstClient | undefined;

  appData: AppData | undefined;
  refreshAppData: () => Promise<void>;

  getBalance: (coinType: string) => BigNumber;
  refreshBalances: () => Promise<void>;

  weightHookAdminCapId: string | undefined;
}

const AppContext = createContext<AppContext>({
  lstClient: undefined,

  appData: undefined,
  refreshAppData: async () => {
    throw Error("AppContextProvider not initialized");
  },

  getBalance: () => {
    throw Error("AppContextProvider not initialized");
  },
  refreshBalances: async () => {
    throw Error("AppContextProvider not initialized");
  },

  weightHookAdminCapId: undefined,
});

export const useAppContext = () => useContext(AppContext);

export function AppContextProvider({ children }: PropsWithChildren) {
  const { suiClient } = useSettingsContext();
  const { address } = useWalletContext();

  // Lst client
  const [lstClient, setLstClient] =
    useState<AppContext["lstClient"]>(undefined);

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
  const { data: appData, mutateData: mutateAppData } = useFetchAppData();

  const refreshAppData = useCallback(async () => {
    await mutateAppData();
  }, [mutateAppData]);

  // Balances
  const { data: balances, mutateData: mutateBalances } = useFetchBalances();

  const refreshBalances = useCallback(async () => {
    await mutateBalances();
  }, [mutateBalances]);

  const getBalance = useCallback(
    (coinType: string) =>
      new BigNumber(balances?.[coinType] ?? new BigNumber(0)).div(
        10 ** (appData?.tokenMap[coinType]?.decimals ?? 0),
      ),
    [balances, appData?.tokenMap],
  );

  // Balances - refresh on change
  const refresh = useCallback(async () => {
    await refreshBalances();
    await refreshAppData();
  }, [refreshBalances, refreshAppData]);
  useRefreshOnBalancesChange(suiClient, refresh);

  // Admin
  const [weightHookAdminCapId, setWeightHookAdminCapId] =
    useState<AppContext["weightHookAdminCapId"]>(undefined);

  useEffect(() => {
    if (!address) return;
    if (!lstClient) return;

    (async () => {
      try {
        const _weightHookAdminCapId =
          await lstClient.getWeightHookAdminCapId(address);
        setWeightHookAdminCapId(_weightHookAdminCapId ?? undefined);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [address, lstClient]);

  // Context
  const contextValue: AppContext = useMemo(
    () => ({
      lstClient,

      appData,
      refreshAppData,

      getBalance,
      refreshBalances,

      weightHookAdminCapId,
    }),
    [
      lstClient,
      appData,
      refreshAppData,
      getBalance,
      refreshBalances,
      weightHookAdminCapId,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
