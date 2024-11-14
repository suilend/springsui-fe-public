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
  LstId,
  shallowPushQuery,
  useWalletContext,
} from "@suilend/frontend-sui";
import { LstClient } from "@suilend/springsui-sdk";
import { WeightHook } from "@suilend/springsui-sdk/_generated/liquid_staking/weight/structs";

import { LstData, useAppContext } from "@/contexts/AppContext";
import useFetchWeightHookAdminCapIdMap from "@/fetchers/useFetchWeightHookAdminCapIdMap";
import useFetchWeightHookMap from "@/fetchers/useFetchWeightHookMap";

enum QueryParams {
  LST = "lst",
}

export interface LstContext {
  lstId: LstId;
  setLstId: (lstId: LstId) => void;
  lstClient: LstClient | undefined;
  lstData: LstData | undefined;

  admin: {
    weightHook: WeightHook<string> | undefined;
    weightHookAdminCapId: string | undefined;

    lstId: LstId;
    lstClient: LstClient | undefined;
    lstData: LstData | undefined;
  };
}
type LoadedLstContext = LstContext & {
  lstClient: LstClient;
  lstData: LstData;

  admin: LstContext["admin"] & {
    lstClient: LstClient;
    lstData: LstData;
  };
};

const LstContext = createContext<LstContext>({
  lstId: LstId.sSUI,
  setLstId: () => {
    throw Error("LstContextProvider not initialized");
  },
  lstClient: undefined,
  lstData: undefined,

  admin: {
    weightHook: undefined,
    weightHookAdminCapId: undefined,

    lstId: LstId.sSUI,
    lstClient: undefined,
    lstData: undefined,
  },
});

export const useLstContext = () => useContext(LstContext);
export const useLoadedLstContext = () => useLstContext() as LoadedLstContext;

export function LstContextProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const queryParams = {
    [QueryParams.LST]: router.query[QueryParams.LST] as LstId | undefined,
  };

  const { address } = useWalletContext();
  const { appData } = useAppContext();

  // Lst id, client, and data
  const lstId =
    queryParams[QueryParams.LST] &&
    Object.values(LstId).includes(queryParams[QueryParams.LST])
      ? queryParams[QueryParams.LST]
      : LstId.sSUI;
  const setLstId = useCallback(
    (_lstId: LstId) => {
      shallowPushQuery(router, { ...router.query, [QueryParams.LST]: _lstId });
    },
    [router],
  );

  const lstClient = useMemo(
    () => appData?.lstClientMap[lstId],
    [appData?.lstClientMap, lstId],
  );
  const lstData = useMemo(
    () => appData?.lstDataMap[lstId],
    [appData?.lstDataMap, lstId],
  );

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
      lstId,
      setLstId,
      lstClient,
      lstData,

      admin: {
        weightHook,
        weightHookAdminCapId,

        lstId: adminLstId,
        lstClient: adminLstClient,
        lstData: adminLstData,
      },
    }),
    [
      lstId,
      setLstId,
      lstClient,
      lstData,
      weightHook,
      weightHookAdminCapId,
      adminLstId,
      adminLstClient,
      adminLstData,
    ],
  );

  return (
    <LstContext.Provider value={contextValue}>{children}</LstContext.Provider>
  );
}
