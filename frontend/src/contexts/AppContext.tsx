import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";

import { CoinMetadata } from "@mysten/sui/client";
import BigNumber from "bignumber.js";
import { useLocalStorage } from "usehooks-ts";

import { NORMALIZED_SUI_COINTYPE, Token } from "@suilend/frontend-sui";
import useFetchBalances from "@suilend/frontend-sui-next/fetchers/useFetchBalances";
import useCoinMetadataMap from "@suilend/frontend-sui-next/hooks/useCoinMetadataMap";
import useRefreshOnBalancesChange from "@suilend/frontend-sui-next/hooks/useRefreshOnBalancesChange";
import { ParsedObligation, ParsedReserve, SuilendClient } from "@suilend/sdk";
import { ObligationOwnerCap } from "@suilend/sdk/_generated/suilend/lending-market/structs";
import { LiquidStakingObjectInfo, LstClient } from "@suilend/springsui-sdk";

import useFetchAppData from "@/fetchers/useFetchAppData";
export interface LstData {
  LIQUID_STAKING_INFO: LiquidStakingObjectInfo;
  lstClient: LstClient;

  totalSuiSupply: BigNumber;
  totalLstSupply: BigNumber;
  suiToLstExchangeRate: BigNumber;
  lstToSuiExchangeRate: BigNumber;

  mintFeePercent: BigNumber;
  redeemFeePercent: BigNumber;
  spreadFeePercent: BigNumber;
  aprPercent?: BigNumber;

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

  LIQUID_STAKING_INFO_MAP: Record<string, LiquidStakingObjectInfo>;
  lstCoinTypes: string[];
  lstDataMap: Record<string, LstData>;

  currentEpoch: number;
  currentEpochProgressPercent: number;
  currentEpochEndMs: number;
}

export interface AppContext {
  localCoinMetadataMap: Record<string, CoinMetadata>;
  addCoinMetadataToLocalMap: (
    coinType: string,
    coinMetadata: CoinMetadata,
  ) => void;

  appData: AppData | undefined;

  rawBalancesMap: Record<string, BigNumber> | undefined;
  balancesCoinMetadataMap: Record<string, CoinMetadata> | undefined;
  getBalance: (coinType: string) => BigNumber;

  refresh: () => Promise<void>;
}
type LoadedAppContext = AppContext & {
  appData: AppData;
};

const AppContext = createContext<AppContext>({
  localCoinMetadataMap: {},
  addCoinMetadataToLocalMap: () => {
    throw Error("AppContextProvider not initialized");
  },

  appData: undefined,

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
  // Local CoinMetadata map
  const [localCoinMetadataMap, setLocalCoinMetadataMap] = useLocalStorage<
    Record<string, CoinMetadata>
  >("springSui_coinMetadataMap", {});

  const addCoinMetadataToLocalMap = useCallback(
    (coinType: string, coinMetadata: CoinMetadata) => {
      setLocalCoinMetadataMap((o) => ({ ...o, [coinType]: coinMetadata }));
    },
    [setLocalCoinMetadataMap],
  );

  // App data
  const { data: appData, mutateData: mutateAppData } = useFetchAppData(
    localCoinMetadataMap,
    addCoinMetadataToLocalMap,
  );

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
    await mutateAppData();
    await refreshRawBalancesMap();
  }, [mutateAppData, refreshRawBalancesMap]);

  useRefreshOnBalancesChange(refresh);

  // Context
  const contextValue: AppContext = useMemo(
    () => ({
      localCoinMetadataMap,
      addCoinMetadataToLocalMap,

      appData,

      rawBalancesMap,
      balancesCoinMetadataMap,
      getBalance,

      refresh,
    }),
    [
      localCoinMetadataMap,
      addCoinMetadataToLocalMap,
      appData,
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
