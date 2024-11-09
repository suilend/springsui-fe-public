import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { CoinMetadata } from "@mysten/sui/client";
import BigNumber from "bignumber.js";

import { useSettingsContext, useWalletContext } from "@suilend/frontend-sui";
import useFetchBalances from "@suilend/frontend-sui/fetchers/useFetchBalances";
import useBalancesCoinMetadataMap from "@suilend/frontend-sui/hooks/useBalancesCoinMetadataMap";
import useRefreshOnBalancesChange from "@suilend/frontend-sui/hooks/useRefreshOnBalancesChange";
import { LstClient } from "@suilend/springsui-sdk";

import useFetchAppData from "@/fetchers/useFetchAppData";
import { LIQUID_STAKING_INFO } from "@/lib/coinType";
import { ParsedLiquidStakingInfo, Token } from "@/lib/types";

export interface AppData {
  coinMetadataMap: Record<string, CoinMetadata>;
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

interface AppContext {
  lstClient: LstClient | undefined;

  appData: AppData | undefined;
  balancesCoinMetadataMap: Record<string, CoinMetadata> | undefined;
  getBalance: (coinType: string) => BigNumber;
  refresh: () => Promise<void>;

  weightHookAdminCapId: string | undefined;
}
type LoadedAppContext = AppContext & {
  lstClient: LstClient;
  appData: AppData;
};

const AppContext = createContext<AppContext>({
  lstClient: undefined,

  appData: undefined,
  balancesCoinMetadataMap: undefined,
  getBalance: () => {
    throw Error("AppContextProvider not initialized");
  },
  refresh: async () => {
    throw Error("AppContextProvider not initialized");
  },

  weightHookAdminCapId: undefined,
});

export const useAppContext = () => useContext(AppContext);
export const useLoadedAppContext = () => useAppContext() as LoadedAppContext;

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

  // App data and balances
  const { data: appData, mutateData: mutateAppData } = useFetchAppData();
  const { data: rawBalancesMap, mutateData: mutateRawBalancesMap } =
    useFetchBalances();

  const balancesCoinMetadataMap = useBalancesCoinMetadataMap(rawBalancesMap);

  const getBalance = useCallback(
    (coinType: string) => {
      if (rawBalancesMap?.[coinType] === undefined) return new BigNumber(0);

      const coinMetadata =
        appData?.coinMetadataMap?.[coinType] ??
        balancesCoinMetadataMap?.[coinType];
      if (!coinMetadata) return new BigNumber(0);

      return new BigNumber(rawBalancesMap[coinType]).div(
        10 ** coinMetadata.decimals,
      );
    },
    [rawBalancesMap, appData?.coinMetadataMap, balancesCoinMetadataMap],
  );

  const refresh = useCallback(async () => {
    await mutateAppData();
    await mutateRawBalancesMap();
  }, [mutateAppData, mutateRawBalancesMap]);

  useRefreshOnBalancesChange(refresh);

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
      balancesCoinMetadataMap,
      getBalance,
      refresh,

      weightHookAdminCapId,
    }),
    [
      lstClient,
      appData,
      balancesCoinMetadataMap,
      getBalance,
      refresh,
      weightHookAdminCapId,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
