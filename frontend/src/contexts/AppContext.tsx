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

import { Transaction } from "@mysten/sui/transactions";
import * as Sentry from "@sentry/nextjs";
import BigNumber from "bignumber.js";

import { ParsedReserve, SuilendClient } from "@suilend/sdk";
import { Reserve } from "@suilend/sdk/_generated/suilend/reserve/structs";
import { LiquidStakingObjectInfo, LstClient } from "@suilend/springsui-sdk";
import { PACKAGE_ID } from "@suilend/springsui-sdk/_generated/liquid_staking";
import { LiquidStakingInfo } from "@suilend/springsui-sdk/_generated/liquid_staking/liquid-staking/structs";
import { WeightHook } from "@suilend/springsui-sdk/_generated/liquid_staking/weight/structs";
import { Token } from "@suilend/sui-fe";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";
import useLedgerHashDialog from "@suilend/sui-fe-next/hooks/useLedgerHashDialog";

import LedgerHashDialog from "@/components/LedgerHashDialog";
import useFetchAppData from "@/fetchers/useFetchAppData";
import { isInvalidIconUrl } from "@/lib/tokens";

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

  suilendReserveStats: { aprPercent: BigNumber; tvlUsd: BigNumber } | undefined;
}

export interface AppData {
  suilendClient: SuilendClient;

  refreshedRawReserves: Reserve<string>[];
  reserveMap: Record<string, ParsedReserve>;

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
  refreshAppData: () => Promise<void>;

  lstWeightHookAdminCapIdMap: Record<string, string> | undefined;

  tokenIconImageLoadErrorMap: Record<string, boolean>;
  loadTokenIconImage: (token: Token) => void;

  openLedgerHashDialog: (transaction: Transaction) => Promise<void>;
  closeLedgerHashDialog: () => void;
}
type LoadedAppContext = AppContext & {
  appData: AppData;
};

const AppContext = createContext<AppContext>({
  appData: undefined,
  refreshAppData: async () => {
    throw Error("AppContextProvider not initialized");
  },

  lstWeightHookAdminCapIdMap: undefined,

  tokenIconImageLoadErrorMap: {},
  loadTokenIconImage: () => {
    throw Error("AppContextProvider not initialized");
  },

  openLedgerHashDialog: async () => {
    throw Error("AppContextProvider not initialized");
  },
  closeLedgerHashDialog: () => {
    throw Error("AppContextProvider not initialized");
  },
});

export const useAppContext = () => useContext(AppContext);
export const useLoadedAppContext = () => useAppContext() as LoadedAppContext;

export function AppContextProvider({ children }: PropsWithChildren) {
  const { suiClient } = useSettingsContext();
  const { address } = useWalletContext();

  // App data (blocking)
  const { data: appData, mutateData: mutateAppData } = useFetchAppData();

  const refreshAppData = useCallback(async () => {
    await mutateAppData();
  }, [mutateAppData]);

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

  // Token images
  const [tokenIconImageLoadErrorMap, setTokenIconImageLoadErrorMap] = useState<
    Record<string, boolean>
  >({});

  const loadedTokenIconsRef = useRef<string[]>([]);
  const loadTokenIconImage = useCallback((token: Token) => {
    if (isInvalidIconUrl(token.iconUrl)) return;

    if (loadedTokenIconsRef.current.includes(token.coinType)) return;
    loadedTokenIconsRef.current.push(token.coinType);

    const image = new Image();
    image.src = token.iconUrl!;
    image.onerror = () => {
      console.error(
        `Failed to load iconUrl for ${token.coinType}: ${token.iconUrl}`,
      );
      setTokenIconImageLoadErrorMap((prev) => ({
        ...prev,
        [token.coinType]: true,
      }));
    };
  }, []);

  // Ledger hash
  const {
    ledgerHash,
    isLedgerHashDialogOpen,
    openLedgerHashDialog,
    closeLedgerHashDialog,
  } = useLedgerHashDialog();

  // Context
  const contextValue: AppContext = useMemo(
    () => ({
      appData,
      refreshAppData,

      lstWeightHookAdminCapIdMap,

      tokenIconImageLoadErrorMap,
      loadTokenIconImage,

      openLedgerHashDialog,
      closeLedgerHashDialog,
    }),
    [
      appData,
      refreshAppData,
      lstWeightHookAdminCapIdMap,
      tokenIconImageLoadErrorMap,
      loadTokenIconImage,
      openLedgerHashDialog,
      closeLedgerHashDialog,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>
      <LedgerHashDialog
        isOpen={isLedgerHashDialogOpen}
        onClose={closeLedgerHashDialog}
        ledgerHash={ledgerHash ?? ""}
      />

      {children}
    </AppContext.Provider>
  );
}
