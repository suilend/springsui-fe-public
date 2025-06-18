import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";

import { CoinMetadata } from "@mysten/sui/client";
import BigNumber from "bignumber.js";

import { ParsedObligation } from "@suilend/sdk";
import { ObligationOwnerCap } from "@suilend/sdk/_generated/suilend/lending-market/structs";
import useFetchBalances from "@suilend/sui-fe-next/fetchers/useFetchBalances";
import useCoinMetadataMap from "@suilend/sui-fe-next/hooks/useCoinMetadataMap";
import useRefreshOnBalancesChange from "@suilend/sui-fe-next/hooks/useRefreshOnBalancesChange";

import { useAppContext } from "@/contexts/AppContext";
import useFetchUserData from "@/fetchers/useFetchUserData";

export interface UserData {
  obligationOwnerCaps: ObligationOwnerCap<string>[];
  obligations: ParsedObligation[];
}

interface UserContext {
  rawBalancesMap: Record<string, BigNumber> | undefined;
  refreshRawBalancesMap: () => Promise<void>;
  balancesCoinMetadataMap: Record<string, CoinMetadata> | undefined;
  getBalance: (coinType: string) => BigNumber;

  userData: UserData | undefined; // Depends on appData
  refreshUserData: () => Promise<void>;

  refresh: () => void; // Refreshes appData, balances, and userData
}

const UserContext = createContext<UserContext>({
  rawBalancesMap: undefined,
  refreshRawBalancesMap: async () => {
    throw Error("UserContextProvider not initialized");
  },
  balancesCoinMetadataMap: undefined,
  getBalance: () => {
    throw Error("UserContextProvider not initialized");
  },

  userData: undefined,
  refreshUserData: async () => {
    throw Error("UserContextProvider not initialized");
  },

  refresh: () => {
    throw Error("UserContextProvider not initialized");
  },
});

export const useUserContext = () => useContext(UserContext);

export function UserContextProvider({ children }: PropsWithChildren) {
  const { refreshAppData } = useAppContext();

  // Balances
  const { data: rawBalancesMap, mutateData: mutateRawBalancesMap } =
    useFetchBalances();

  const refreshRawBalancesMap = useCallback(async () => {
    await mutateRawBalancesMap();
  }, [mutateRawBalancesMap]);

  const balancesCoinTypes = useMemo(
    () => Object.keys(rawBalancesMap ?? {}),
    [rawBalancesMap],
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

  // User data (non-blocking)
  const { data: userData, mutateData: mutateUserData } = useFetchUserData();

  // Refresh
  const refreshUserData = useCallback(async () => {
    await mutateUserData();
  }, [mutateUserData]);

  const refresh = useCallback(() => {
    (async () => {
      await refreshAppData();
      await refreshUserData();
    })();
    refreshRawBalancesMap();
  }, [refreshAppData, refreshUserData, refreshRawBalancesMap]);

  useRefreshOnBalancesChange(refresh as () => Promise<void>);

  // Context
  const contextValue = useMemo(
    () => ({
      rawBalancesMap,
      refreshRawBalancesMap,
      balancesCoinMetadataMap,
      getBalance,

      userData,
      refreshUserData,

      refresh,
    }),
    [
      rawBalancesMap,
      refreshRawBalancesMap,
      balancesCoinMetadataMap,
      getBalance,
      userData,
      refreshUserData,
      refresh,
    ],
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}
