import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";

import { CoinMetadata } from "@mysten/sui/client";
import BigNumber from "bignumber.js";

import { NORMALIZED_SUI_COINTYPE, Token } from "@suilend/frontend-sui";
import useFetchBalances from "@suilend/frontend-sui-next/fetchers/useFetchBalances";
import useCoinMetadataMap from "@suilend/frontend-sui-next/hooks/useCoinMetadataMap";
import useRefreshOnBalancesChange from "@suilend/frontend-sui-next/hooks/useRefreshOnBalancesChange";
import { ParsedObligation, SuilendClient } from "@suilend/sdk";
import { ObligationOwnerCap } from "@suilend/sdk/_generated/suilend/lending-market/structs";
import {
  LstClient,
  LstId,
  NORMALIZED_LST_COINTYPES,
} from "@suilend/springsui-sdk";

import useFetchAppData from "@/fetchers/useFetchAppData";

export interface LstData {
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
  obligationOwnerCaps: ObligationOwnerCap<string>[] | undefined;
  obligations: ParsedObligation[] | undefined;

  sendPointsToken: Token;
  suiToken: Token;
  suiPrice: BigNumber;

  lstClientMap: Record<LstId, LstClient>;
  lstDataMap: Record<LstId, LstData>;

  currentEpoch: number;
  currentEpochProgressPercent: number;
  currentEpochEndMs: number;
}

interface AppContext {
  appData: AppData | undefined;
  balancesCoinMetadataMap: Record<string, CoinMetadata> | undefined;
  getBalance: (coinType: string) => BigNumber;
  refresh: () => Promise<void>;
}
type LoadedAppContext = AppContext & {
  appData: AppData;
};

const AppContext = createContext<AppContext>({
  appData: undefined,
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
  // App data
  const { data: appData, mutateData: mutateAppData } = useFetchAppData();

  // Balances
  const { data: rawBalancesMap, mutateData: mutateRawBalancesMap } =
    useFetchBalances();

  const balancesCoinTypes = useMemo(
    () => [NORMALIZED_SUI_COINTYPE, ...NORMALIZED_LST_COINTYPES],
    [],
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
    await mutateRawBalancesMap();
  }, [mutateAppData, mutateRawBalancesMap]);

  useRefreshOnBalancesChange(refresh);

  // Context
  const contextValue: AppContext = useMemo(
    () => ({
      appData,
      balancesCoinMetadataMap,
      getBalance,
      refresh,
    }),
    [appData, balancesCoinMetadataMap, getBalance, refresh],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
