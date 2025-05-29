import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { CoinMetadata } from "@mysten/sui/client";
import * as Sentry from "@sentry/nextjs";
import BigNumber from "bignumber.js";

import { ParsedObligation, ParsedReserve, SuilendClient } from "@suilend/sdk";
import { ObligationOwnerCap } from "@suilend/sdk/_generated/suilend/lending-market/structs";
import { LiquidStakingObjectInfo, LstClient } from "@suilend/springsui-sdk";
import { PACKAGE_ID } from "@suilend/springsui-sdk/_generated/liquid_staking";
import { LiquidStakingInfo } from "@suilend/springsui-sdk/_generated/liquid_staking/liquid-staking/structs";
import { WeightHook } from "@suilend/springsui-sdk/_generated/liquid_staking/weight/structs";
import { NORMALIZED_SUI_COINTYPE, Token } from "@suilend/sui-fe";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";
import useFetchBalances from "@suilend/sui-fe-next/fetchers/useFetchBalances";
import useCoinMetadataMap from "@suilend/sui-fe-next/hooks/useCoinMetadataMap";
import useRefreshOnBalancesChange from "@suilend/sui-fe-next/hooks/useRefreshOnBalancesChange";

import useFetchAppData from "@/fetchers/useFetchAppData";

export interface LstData {
  lstInfo: {
    LIQUID_STAKING_INFO: LiquidStakingObjectInfo;
    liquidStakingInfo: LiquidStakingInfo<string>;
    weightHook: WeightHook<string>;
    apy: string;
  };
  lstClient: LstClient;

  totalSuiSupply: BigNumber;
  totalLstSupply: BigNumber;
  suiToLstExchangeRate: BigNumber;
  lstToSuiExchangeRate: BigNumber;

  mintFeePercent: BigNumber;
  redeemFeePercent: BigNumber;
  spreadFeePercent: BigNumber;
  aprPercent: BigNumber;

  fees: BigNumber;
  accruedSpreadFees: BigNumber;

  token: Token;
  price: BigNumber;

  suilendReserveStats:
    | {
        aprPercent: BigNumber;
        tvlUsd: BigNumber;
        sendPointsPerDay: BigNumber;
      }
    | undefined;
}

export interface AppData {
  suilendClient: SuilendClient;
  reserveMap: Record<string, ParsedReserve>;
  obligationOwnerCaps: ObligationOwnerCap<string>[] | undefined;
  obligations: ParsedObligation[] | undefined;

  sendPointsToken: Token;
  suiToken: Token;
  suiPrice: BigNumber;

  lstCoinTypes: string[];
  lstDataMap: Record<string, LstData>;

  currentEpoch: number;
  currentEpochProgressPercent: number;
  currentEpochEndMs: number;
}

interface AppContext {
  appData: AppData | undefined;
  lstWeightHookAdminCapIdMap: Record<string, string> | undefined;

  rawBalancesMap: Record<string, BigNumber> | undefined;
  balancesCoinMetadataMap: Record<string, CoinMetadata> | undefined;
  getBalance: (coinType: string) => BigNumber;

  refresh: () => Promise<void>;
}
type LoadedAppContext = AppContext & {
  appData: AppData;
};

const AppContext = createContext<AppContext>({
  appData: undefined,
  lstWeightHookAdminCapIdMap: undefined,

  rawBalancesMap: undefined,
  balancesCoinMetadataMap: undefined,
  getBalance: () => {
    throw Error("AppContextProvider not initialized");
  },

  refresh: async () => {
    throw Error("AppContextProvider not initialized");
  },
});

export const useAppContext = () => useContext(AppContext);
export const useLoadedAppContext = () => useAppContext() as LoadedAppContext;

export function AppContextProvider({ children }: PropsWithChildren) {
  const { suiClient } = useSettingsContext();
  const { address } = useWalletContext();

  // App data
  const { data: appData, mutateData: mutateAppData } = useFetchAppData();

  // WeightHookAdminCap map
  const [lstWeightHookAdminCapIdMapMap, setLstWeightHookAdminCapIdMapMap] =
    useState<Record<string, Record<string, string>>>({});
  const lstWeightHookAdminCapIdMap: Record<string, string> | undefined =
    useMemo(
      () => (!address ? {} : lstWeightHookAdminCapIdMapMap[address]),
      [address, lstWeightHookAdminCapIdMapMap],
    );

  const getOwnedObjects = useCallback(async () => {
    if (!address) return [];

    const allObjs = [];
    let cursor = null;
    let hasNextPage = true;
    while (hasNextPage) {
      const objs = await suiClient.getOwnedObjects({
        owner: address,
        cursor,
        options: { showType: true },
      });

      allObjs.push(...objs.data);
      cursor = objs.nextCursor;
      hasNextPage = objs.hasNextPage;
    }

    return allObjs;
  }, [address, suiClient]);

  const fetchWeightHookAdminCapIdMap = useCallback(
    async (_appData: AppData | undefined = appData) => {
      if (!address || !_appData) return;

      try {
        const result: Record<string, string> = {};

        const allOwnedObjs = await getOwnedObjects();
        for (const coinType of _appData.lstCoinTypes) {
          const ownedObj = allOwnedObjs.find(
            (obj) =>
              obj.data?.type ===
              `${PACKAGE_ID}::weight::WeightHookAdminCap<${coinType}>`,
          );
          if (ownedObj?.data?.objectId)
            result[coinType] = ownedObj.data.objectId;

          setLstWeightHookAdminCapIdMapMap((prev) => ({
            ...prev,
            [address!]: result,
          }));
        }
      } catch (err) {
        showErrorToast(
          "Failed to fetch weight hook admin cap id map",
          err as Error,
        );
        console.error(err);
        Sentry.captureException(err);
      }
    },
    [appData, getOwnedObjects, address],
  );

  const hasFetchedWeightHookAdminCapIdMapRef = useRef<Record<string, boolean>>(
    {},
  );
  useEffect(() => {
    if (!address || !appData) return;

    if (hasFetchedWeightHookAdminCapIdMapRef.current[address]) return;
    hasFetchedWeightHookAdminCapIdMapRef.current[address] = true;

    fetchWeightHookAdminCapIdMap();
  }, [address, appData, fetchWeightHookAdminCapIdMap]);

  // Balances
  const { data: rawBalancesMap, mutateData: mutateRawBalancesMap } =
    useFetchBalances();

  const refreshRawBalancesMap = useCallback(async () => {
    await mutateRawBalancesMap();
  }, [mutateRawBalancesMap]);

  const balancesCoinTypes = useMemo(
    () => [NORMALIZED_SUI_COINTYPE, ...(appData?.lstCoinTypes ?? [])],
    [appData?.lstCoinTypes],
  );
  const balancesCoinMetadataMap = useCoinMetadataMap(balancesCoinTypes);

  const getBalance = useCallback(
    (coinType: string) => {
      if (rawBalancesMap?.[coinType] === undefined) return new BigNumber(0);

      const coinMetadata = balancesCoinMetadataMap?.[coinType];
      if (!coinMetadata) return new BigNumber(0);

      return new BigNumber(rawBalancesMap[coinType]).div(
        10 ** coinMetadata.decimals,
      );
    },
    [rawBalancesMap, balancesCoinMetadataMap],
  );

  // Refresh
  const refresh = useCallback(async () => {
    await Promise.all([
      (async () => {
        const refreshAppData = await mutateAppData();
        await fetchWeightHookAdminCapIdMap(refreshAppData);
      })(),
      refreshRawBalancesMap,
    ]);
  }, [mutateAppData, fetchWeightHookAdminCapIdMap, refreshRawBalancesMap]);

  useRefreshOnBalancesChange(refresh);

  // Context
  const contextValue: AppContext = useMemo(
    () => ({
      appData,
      lstWeightHookAdminCapIdMap,

      rawBalancesMap,
      balancesCoinMetadataMap,
      getBalance,

      refresh,
    }),
    [
      appData,
      lstWeightHookAdminCapIdMap,
      rawBalancesMap,
      balancesCoinMetadataMap,
      getBalance,
      refresh,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
