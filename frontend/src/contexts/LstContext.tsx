import { useRouter } from "next/router";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  NORMALIZED_SUI_COINTYPE,
  NORMALIZED_sSUI_COINTYPE,
  isSui,
} from "@suilend/frontend-sui";
import { useWalletContext } from "@suilend/frontend-sui-next";
import { WeightHook } from "@suilend/springsui-sdk/_generated/liquid_staking/weight/structs";

import { LstData, useAppContext } from "@/contexts/AppContext";

export enum Mode {
  STAKING = "staking",
  UNSTAKING = "unstaking",
  CONVERTING = "converting",
}

export const DEFAULT_TOKEN_IN_SYMBOL = "SUI";
export const DEFAULT_TOKEN_OUT_SYMBOL = "sSUI";

export enum QueryParams {
  LST = "lst",
  AMOUNT = "amount",
}

export interface LstContext {
  isSlugValid: () => boolean;
  tokenInSymbol: string;
  tokenOutSymbol: string;
  mode: Mode;
  lstCoinTypes: string[];

  admin: {
    weightHook: WeightHook<string> | undefined;
    weightHookAdminCapId: string | undefined;

    lstCoinType: string;
    setLstCoinType: (coinType: string) => void;
    lstData: LstData | undefined;
  };
}
type LoadedLstContext = LstContext & {
  admin: LstContext["admin"] & {
    lstData: LstData;
  };
};

const LstContext = createContext<LstContext>({
  isSlugValid: () => {
    throw Error("LstContextProvider not initialized");
  },
  tokenInSymbol: DEFAULT_TOKEN_IN_SYMBOL,
  tokenOutSymbol: DEFAULT_TOKEN_OUT_SYMBOL,
  mode: Mode.STAKING,
  lstCoinTypes: [],

  admin: {
    weightHook: undefined,
    weightHookAdminCapId: undefined,

    lstCoinType: NORMALIZED_sSUI_COINTYPE,
    setLstCoinType: () => {
      throw Error("LstContextProvider not initialized");
    },
    lstData: undefined,
  },
});

export const useLstContext = () => useContext(LstContext);
export const useLoadedLstContext = () => useLstContext() as LoadedLstContext;

export function LstContextProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const queryParams = useMemo(
    () => ({
      [QueryParams.LST]: router.query[QueryParams.LST] as string | undefined,
    }),
    [router.query],
  );
  const slug = router.query.slug as string[] | undefined;

  const { address } = useWalletContext();
  const { appData, lstWeightHookAdminCapIdMap } = useAppContext();

  // Slug
  const isSlugValid = useCallback(() => {
    if (!appData) return false;
    if (slug === undefined) return false;

    const validSymbols = [NORMALIZED_SUI_COINTYPE, ...appData.lstCoinTypes].map(
      (coinType) =>
        (isSui(coinType)
          ? appData.suiToken
          : appData.lstDataMap[coinType].token
        ).symbol,
    );

    const symbols = slug[0].split("-");
    if (
      symbols.length !== 2 ||
      symbols.includes("") ||
      symbols[0] === symbols[1]
    )
      return false;

    if (
      !validSymbols.includes(symbols[0]) ||
      !validSymbols.includes(symbols[1])
    )
      return false;

    return true;
  }, [appData, slug]);

  const [tokenInSymbol, tokenOutSymbol] = useMemo(
    () =>
      isSlugValid()
        ? slug![0].split("-")
        : [
            DEFAULT_TOKEN_IN_SYMBOL,
            queryParams[QueryParams.LST] ?? DEFAULT_TOKEN_OUT_SYMBOL,
          ],
    [isSlugValid, slug, queryParams],
  );

  // Mode
  const mode = useMemo(() => {
    if (!appData) return Mode.STAKING;

    const validNonSuiSymbols = appData.lstCoinTypes.map(
      (coinType) => appData.lstDataMap[coinType].token.symbol,
    );

    if (tokenInSymbol === "SUI" && validNonSuiSymbols.includes(tokenOutSymbol))
      return Mode.STAKING;
    else if (
      validNonSuiSymbols.includes(tokenInSymbol) &&
      tokenOutSymbol === "SUI"
    )
      return Mode.UNSTAKING;
    else if (
      validNonSuiSymbols.includes(tokenInSymbol) &&
      validNonSuiSymbols.includes(tokenOutSymbol)
    )
      return Mode.CONVERTING;

    return Mode.STAKING; // Not possible
  }, [appData, tokenInSymbol, tokenOutSymbol]);

  // LSTs
  const lstCoinTypes = useMemo(() => {
    if (!appData) return [];

    let symbols: string[] = [];
    if (mode === Mode.STAKING) symbols = [tokenOutSymbol];
    else if (mode === Mode.UNSTAKING) symbols = [tokenInSymbol];
    else if (mode === Mode.CONVERTING)
      symbols = [tokenInSymbol, tokenOutSymbol];

    return symbols.map(
      (symbol) =>
        Object.values(appData.lstDataMap).find(
          (lstData) => lstData.token.symbol === symbol,
        )!.token.coinType,
    );
  }, [appData, mode, tokenOutSymbol, tokenInSymbol]);

  // Admin
  // Admin - lst coinType, client, and data
  const [adminLstCoinType, setAdminLstCoinType] = useState<string>(
    NORMALIZED_sSUI_COINTYPE,
  );

  const adminLstData = useMemo(
    () => appData?.lstDataMap[adminLstCoinType],
    [appData?.lstDataMap, adminLstCoinType],
  );

  // Admin - weightHook
  const weightHook = useMemo(
    () => appData?.lstDataMap[adminLstCoinType].lstInfo.weightHook,
    [appData?.lstDataMap, adminLstCoinType],
  );

  // Admin - weightHookAdminCapId
  const weightHookAdminCapId: string | undefined = useMemo(
    () => lstWeightHookAdminCapIdMap?.[adminLstCoinType],
    [lstWeightHookAdminCapIdMap, adminLstCoinType],
  );

  // Admin - set adminLstCoinType based on weightHookAdminCapId
  useEffect(() => {
    if (!appData || lstWeightHookAdminCapIdMap === undefined) return;
    if (
      !address ||
      Object.values(lstWeightHookAdminCapIdMap).every((v) => v === undefined)
    ) {
      setAdminLstCoinType(NORMALIZED_sSUI_COINTYPE);
      return;
    }

    if (lstWeightHookAdminCapIdMap[adminLstCoinType] !== undefined) return;
    for (const _coinType of appData.lstCoinTypes) {
      if (lstWeightHookAdminCapIdMap[_coinType]) {
        setAdminLstCoinType(_coinType);
        break;
      }
    }
  }, [
    appData,
    lstWeightHookAdminCapIdMap,
    address,
    setAdminLstCoinType,
    adminLstCoinType,
  ]);

  // Context
  const contextValue: LstContext = useMemo(
    () => ({
      isSlugValid,
      tokenInSymbol,
      tokenOutSymbol,
      mode,
      lstCoinTypes,

      admin: {
        weightHook,
        weightHookAdminCapId,

        lstCoinType: adminLstCoinType,
        setLstCoinType: setAdminLstCoinType,
        lstData: adminLstData,
      },
    }),
    [
      isSlugValid,
      tokenInSymbol,
      tokenOutSymbol,
      mode,
      lstCoinTypes,
      weightHook,
      weightHookAdminCapId,
      adminLstCoinType,
      setAdminLstCoinType,
      adminLstData,
    ],
  );

  return (
    <LstContext.Provider value={contextValue}>{children}</LstContext.Provider>
  );
}
