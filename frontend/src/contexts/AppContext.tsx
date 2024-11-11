import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";

import { CoinMetadata } from "@mysten/sui/client";
import { normalizeStructTag } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";

import { NORMALIZED_SUI_COINTYPE, Token } from "@suilend/frontend-sui";
import useFetchBalances from "@suilend/frontend-sui/fetchers/useFetchBalances";
import useCoinMetadataMap from "@suilend/frontend-sui/hooks/useCoinMetadataMap";
import useRefreshOnBalancesChange from "@suilend/frontend-sui/hooks/useRefreshOnBalancesChange";
import {
  LiquidStakingObjectInfo,
  LstClient,
  SUILEND_VALIDATOR_ADDRESS,
} from "@suilend/springsui-sdk";

import useFetchAppData from "@/fetchers/useFetchAppData";

export enum LstId {
  sSUI = "sSUI",
  ripleysSUI = "ripleysSUI",
  // mSUI = "mSUI",
}

export type LiquidStakingInfo = LiquidStakingObjectInfo;

export const VALIDATOR_MAP: Record<LstId, string | undefined> = {
  [LstId.sSUI]: SUILEND_VALIDATOR_ADDRESS,
  [LstId.ripleysSUI]: undefined,
  // [LstId.mSUI]:
  //   "0x56f4ec3046f1055a9d75d202d167f49a3748b259801315c74895cb0f330b4b7d",
};

export const LIQUID_STAKING_INFO_MAP: Record<LstId, LiquidStakingInfo> = {
  [LstId.sSUI]: {
    id: "0x15eda7330c8f99c30e430b4d82fd7ab2af3ead4ae17046fcb224aa9bad394f6b",
    type: normalizeStructTag(
      "0x83556891f4a0f233ce7b05cfe7f957d4020492a34f5405b2cb9377d060bef4bf::spring_sui::SPRING_SUI",
    ),
    weightHookId:
      "0xbbafcb2d7399c0846f8185da3f273ad5b26b3b35993050affa44cfa890f1f144",
  },
  [LstId.ripleysSUI]: {
    id: "0x50f983c5257f578a2340ff45f6c82f3d6fc358a3e7a8bc57dd112d280badbfd6",
    type: normalizeStructTag(
      "0xdc0c8026236f1be172ba03d7d689bfd663497cc5a730bf367bfb2e2c72ec6df8::ripleys::RIPLEYS",
    ),
    weightHookId:
      "0xfee25aa74038036cb1548a27a6824213c6a263c3aa45dc37b1c3fbe6037be7d2",
  },
};

export const NORMALIZED_LST_COINTYPES = Object.values(
  LIQUID_STAKING_INFO_MAP,
).map((info) => info.type);

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
