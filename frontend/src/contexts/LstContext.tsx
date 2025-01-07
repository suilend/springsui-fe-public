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

import { LstId } from "@suilend/frontend-sui";
import { useWalletContext } from "@suilend/frontend-sui-next";
import { LstClient } from "@suilend/springsui-sdk";
import { WeightHook } from "@suilend/springsui-sdk/_generated/liquid_staking/weight/structs";

import { LstData, useAppContext } from "@/contexts/AppContext";
import useFetchWeightHookAdminCapIdMap from "@/fetchers/useFetchWeightHookAdminCapIdMap";
import useFetchWeightHookMap from "@/fetchers/useFetchWeightHookMap";

export enum Mode {
  STAKING = "staking",
  UNSTAKING = "unstaking",
  CONVERTING = "converting",
}

export const DEFAULT_TOKEN_IN_SYMBOL = "SUI";
export const DEFAULT_TOKEN_OUT_SYMBOL = LstId.sSUI;

export enum QueryParams {
  LST = "lst",
  AMOUNT = "amount",
}

export interface LstContext {
  isSlugValid: () => boolean;
  tokenInSymbol: string;
  tokenOutSymbol: string;
  mode: Mode;
  lstIds: LstId[];

  admin: {
    weightHook: WeightHook<string> | undefined;
    weightHookAdminCapIdMap: Record<LstId, string | undefined> | undefined;
    weightHookAdminCapId: string | undefined;

    lstId: LstId;
    setLstId: (lstId: LstId) => void;
    lstClient: LstClient | undefined;
    lstData: LstData | undefined;
  };
}
type LoadedLstContext = LstContext & {
  admin: LstContext["admin"] & {
    lstClient: LstClient;
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
  lstIds: [],

  admin: {
    weightHook: undefined,
    weightHookAdminCapIdMap: undefined,
    weightHookAdminCapId: undefined,

    lstId: LstId.sSUI,
    setLstId: () => {
      throw Error("LstContextProvider not initialized");
    },
    lstClient: undefined,
    lstData: undefined,
  },
});

export const useLstContext = () => useContext(LstContext);
export const useLoadedLstContext = () => useLstContext() as LoadedLstContext;

export function LstContextProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const queryParams = useMemo(
    () => ({
      [QueryParams.LST]: router.query[QueryParams.LST] as LstId | undefined,
    }),
    [router.query],
  );
  const slug = router.query.slug as string[] | undefined;

  const { address } = useWalletContext();
  const { appData } = useAppContext();

  // Slug
  const isSlugValid = useCallback(() => {
    if (slug === undefined) return false;

    const symbols = slug[0].split("-");
    if (
      symbols.length !== 2 ||
      symbols.includes("") ||
      symbols[0] === symbols[1]
    )
      return false;

    const validSymbols = ["SUI", ...Object.values(LstId)];
    if (
      !validSymbols.includes(symbols[0]) ||
      !validSymbols.includes(symbols[1])
    )
      return false;

    return true;
  }, [slug]);

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
    if (
      tokenInSymbol === "SUI" &&
      Object.values(LstId).includes(tokenOutSymbol as LstId)
    )
      return Mode.STAKING;
    else if (
      Object.values(LstId).includes(tokenInSymbol as LstId) &&
      tokenOutSymbol === "SUI"
    )
      return Mode.UNSTAKING;
    else if (
      Object.values(LstId).includes(tokenInSymbol as LstId) &&
      Object.values(LstId).includes(tokenOutSymbol as LstId)
    )
      return Mode.CONVERTING;

    return Mode.STAKING; // Not possible
  }, [tokenInSymbol, tokenOutSymbol]);

  // Lsts
  const lstIds = useMemo(() => {
    if (mode === Mode.STAKING) return [tokenOutSymbol as LstId];
    if (mode === Mode.UNSTAKING) return [tokenInSymbol as LstId];
    if (mode === Mode.CONVERTING)
      return [tokenInSymbol as LstId, tokenOutSymbol as LstId];

    return [];
  }, [mode, tokenOutSymbol, tokenInSymbol]);

  // Admin
  // Admin - lst id, client, and data
  const [adminLstId, setAdminLstId] = useState<LstId>(LstId.sSUI);

  const adminLstClient = useMemo(
    () => appData?.lstClientMap[adminLstId],
    [appData?.lstClientMap, adminLstId],
  );
  const adminLstData = useMemo(
    () => appData?.lstDataMap[adminLstId],
    [appData?.lstDataMap, adminLstId],
  );

  // Admin - weightHook
  const { data: weightHookMap } = useFetchWeightHookMap();

  const weightHook = useMemo(
    () => weightHookMap?.[adminLstId],
    [weightHookMap, adminLstId],
  );

  // Admin - weightHookAdminCapId
  const {
    data: weightHookAdminCapIdMap,
    mutateData: mutateWeightHookAdminCapIdMap,
  } = useFetchWeightHookAdminCapIdMap();
  useEffect(() => {
    mutateWeightHookAdminCapIdMap();
  }, [address, mutateWeightHookAdminCapIdMap]);

  const weightHookAdminCapId = useMemo(
    () => weightHookAdminCapIdMap?.[adminLstId],
    [weightHookAdminCapIdMap, adminLstId],
  );

  // Admin - set adminLstId based on weightHookAdminCapId
  useEffect(() => {
    if (
      !address ||
      weightHookAdminCapIdMap === undefined ||
      Object.values(weightHookAdminCapIdMap).every((v) => v === undefined)
    ) {
      setAdminLstId(LstId.sSUI);
      return;
    }

    for (const _lstId of Object.values(LstId)) {
      if (weightHookAdminCapIdMap[_lstId]) {
        setAdminLstId(_lstId);
        break;
      }
    }
  }, [address, weightHookAdminCapIdMap, setAdminLstId]);

  // Context
  const contextValue: LstContext = useMemo(
    () => ({
      isSlugValid,
      tokenInSymbol,
      tokenOutSymbol,
      mode,
      lstIds,

      admin: {
        weightHook,
        weightHookAdminCapIdMap,
        weightHookAdminCapId,

        lstId: adminLstId,
        setLstId: setAdminLstId,
        lstClient: adminLstClient,
        lstData: adminLstData,
      },
    }),
    [
      isSlugValid,
      tokenInSymbol,
      tokenOutSymbol,
      mode,
      lstIds,
      weightHook,
      weightHookAdminCapIdMap,
      weightHookAdminCapId,
      adminLstId,
      setAdminLstId,
      adminLstClient,
      adminLstData,
    ],
  );

  return (
    <LstContext.Provider value={contextValue}>{children}</LstContext.Provider>
  );
}
