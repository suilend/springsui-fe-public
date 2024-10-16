import { useRouter } from "next/router";
import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { CoinBalance, SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { IdentifierString, WalletAccount } from "@mysten/wallet-standard";
import { useWallet } from "@suiet/wallet-kit";
import BigNumber from "bignumber.js";
import { isEqual } from "lodash";

import { useAppContext } from "@/contexts/AppContext";
import useFetchBalances from "@/fetchers/useFetchBalances";
import { formatAddress } from "@/lib/format";
import { errorToast, infoToast } from "@/lib/toasts";
import { Wallet } from "@/lib/types";
import { useListWallets } from "@/lib/wallets";

export enum QueryParams {
  WALLET = "wallet",
}

export interface WalletContext {
  isImpersonating: boolean;
  isConnectWalletDropdownOpen: boolean;
  setIsConnectWalletDropdownOpen: Dispatch<SetStateAction<boolean>>;

  wallet: Wallet | undefined;
  connectWallet: (wallet: Wallet) => Promise<void>;
  disconnectWallet: () => Promise<void>;

  walletAccounts: readonly WalletAccount[];
  walletAccount?: WalletAccount;
  selectWalletAccount: (accountAddress: string) => void;

  address: string | undefined;
  signExecuteAndWaitForTransaction: (
    transaction: Transaction,
  ) => Promise<SuiTransactionBlockResponse>;

  refreshBalancesData: () => Promise<void>;
  getAccountBalance: (coinType: string) => BigNumber;
}

const WalletContext = createContext<WalletContext>({
  isImpersonating: false,
  isConnectWalletDropdownOpen: false,
  setIsConnectWalletDropdownOpen: () => {
    throw new Error("WalletContextProvider not initialized");
  },

  wallet: undefined,
  connectWallet: async () => {
    throw new Error("WalletContextProvider not initialized");
  },
  disconnectWallet: async () => {
    throw new Error("WalletContextProvider not initialized");
  },

  walletAccounts: [],
  walletAccount: undefined,
  selectWalletAccount: () => {
    throw new Error("WalletContextProvider not initialized");
  },

  address: undefined,
  signExecuteAndWaitForTransaction: async () => {
    throw new Error("WalletContextProvider not initialized");
  },

  refreshBalancesData: async () => {
    throw new Error("WalletContextProvider not initialized");
  },
  getAccountBalance: () => {
    throw new Error("WalletContextProvider not initialized");
  },
});

export const useWalletContext = () => useContext(WalletContext);

export function WalletContextProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const queryParams = {
    [QueryParams.WALLET]: router.query[QueryParams.WALLET] as
      | string
      | undefined,
  };

  const { suiClient, appData, refreshAppData } = useAppContext();

  // Impersonated address
  const impersonatedAddress = queryParams[QueryParams.WALLET];

  // Wallet
  const [isConnectWalletDropdownOpen, setIsConnectWalletDropdownOpen] =
    useState<boolean>(false);

  const {
    chain,
    adapter,
    connected: isWalletConnected,
    select: connectWallet,
    disconnect: disconnectWallet,
    getAccounts: getWalletAccounts,
  } = useWallet();

  const wallets = useListWallets();
  const wallet = useMemo(
    () => wallets.find((w) => w.name === adapter?.name),
    [wallets, adapter],
  );

  const connectWalletWrapper = useCallback(
    async (_wallet: Wallet) => {
      try {
        await connectWallet(_wallet.name);
        infoToast(`Connected ${_wallet.name}`);

        setIsConnectWalletDropdownOpen(false);
      } catch (err) {
        errorToast(`Failed to connect ${_wallet.name}`, err as Error);
        console.error(err);
      }
    },
    [connectWallet],
  );

  const disconnectWalletWrapper = useCallback(async () => {
    await disconnectWallet();
    infoToast("Disconnected wallet");
  }, [disconnectWallet]);

  // Wallet account
  const [walletAccounts, setWalletAccounts] = useState<
    readonly WalletAccount[]
  >([]);
  const [walletAccountAddress, setWalletAccountAddress] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    setWalletAccountAddress(
      window.localStorage.getItem("accountAddress") ?? undefined,
    );
  }, [isWalletConnected]);

  useEffect(() => {
    if (!isWalletConnected) {
      setWalletAccounts([]);
      return;
    }

    const _walletAccounts = getWalletAccounts();
    setWalletAccounts(_walletAccounts);

    if (_walletAccounts.length === 0) {
      // NO ACCOUNTS (should not happen) - set to undefined
      setWalletAccountAddress(undefined);
      return;
    }

    if (!walletAccountAddress) {
      // NO ADDRESS SET - set to first account's address
      setWalletAccountAddress(_walletAccounts[0].address);
    } else {
      const account = _walletAccounts.find(
        (a) => a.address === walletAccountAddress,
      );
      if (account) {
        // ADDRESS SET + ACCOUNT FOUND - do nothing
        return;
      }

      // ADDRESS SET + NO ACCOUNT FOUND - set to first account's address
      setWalletAccountAddress(_walletAccounts[0].address);
    }
  }, [
    isWalletConnected,
    getWalletAccounts,
    setWalletAccountAddress,
    walletAccountAddress,
  ]);

  const walletAccount = useMemo(
    () =>
      walletAccounts?.find((wa) => wa.address === walletAccountAddress) ??
      undefined,
    [walletAccounts, walletAccountAddress],
  );

  const selectWalletAccount = useCallback(
    (_accountAddress: string) => {
      const _walletAccount = walletAccounts.find(
        (a) => a.address === _accountAddress,
      );
      if (!_walletAccount) return;

      setWalletAccountAddress(_accountAddress);
      window.localStorage.setItem("accountAddress", _accountAddress);

      infoToast(
        `Switched to ${_walletAccount?.label ?? formatAddress(_walletAccount.address)}`,
        {
          description: _walletAccount?.label
            ? formatAddress(_walletAccount.address)
            : undefined,
          descriptionClassName: "uppercase", // TODO
        },
      );
    },
    [walletAccounts],
  );

  // Tx
  const signExecuteAndWaitForTransaction = useCallback(
    async (transaction: Transaction) => {
      const _address = impersonatedAddress ?? walletAccount?.address;
      if (_address) {
        (async () => {
          try {
            const simResult = await suiClient.devInspectTransactionBlock({
              sender: _address,
              transactionBlock: transaction,
            });

            if (simResult.error) {
              throw simResult.error;
            }
          } catch (err) {
            console.error(err);
            // throw err; - Do not rethrow error
          }
        })(); // Do not await
      }

      if (!chain) throw new Error("Missing chain");
      if (!adapter) throw new Error("Missing adapter");
      if (!walletAccount) throw new Error("Missing account");

      try {
        // BEGIN legacy code
        const signedTransaction = await adapter.signTransactionBlock({
          transactionBlock: transaction as any, // Expects TransactionBlock, not Transaction
          account: walletAccount,
          chain: chain.id as IdentifierString,
        });

        const res1 = await suiClient.executeTransactionBlock({
          transactionBlock: signedTransaction.transactionBlockBytes,
          signature: signedTransaction.signature,
        });
        // END legacy code

        const res2 = await suiClient.waitForTransaction({
          digest: res1.digest,
          options: {
            showEffects: true,
            showBalanceChanges: true,
          },
        });
        if (
          res2.effects?.status !== undefined &&
          res2.effects.status.status === "failure"
        )
          throw new Error(res2.effects.status.error ?? "Transaction failed");

        return res2;
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
    [impersonatedAddress, walletAccount, suiClient, chain, adapter],
  );

  // Balances
  const { data: balancesData, mutate: mutateBalancesData } = useFetchBalances(
    impersonatedAddress ?? walletAccount?.address,
  );

  const refreshBalancesData = useCallback(async () => {
    await mutateBalancesData();
  }, [mutateBalancesData]);

  const getAccountBalance = useCallback(
    (coinType: string) =>
      new BigNumber(balancesData?.[coinType] ?? new BigNumber(0)).div(
        10 ** (appData?.coinMetadataMap[coinType]?.decimals ?? 0),
      ),
    [balancesData, appData?.coinMetadataMap],
  );

  // Poll for balance changes
  const previousBalancesRef = useRef<CoinBalance[] | undefined>(undefined);
  useEffect(() => {
    const _address = impersonatedAddress ?? walletAccount?.address;
    if (!_address) return;

    previousBalancesRef.current = undefined;
    const interval = setInterval(async () => {
      try {
        const balances = await suiClient.getAllBalances({
          owner: _address,
        });

        if (
          previousBalancesRef.current !== undefined &&
          !isEqual(balances, previousBalancesRef.current)
        ) {
          await refreshAppData();
          await refreshBalancesData();
        }
        previousBalancesRef.current = balances;
      } catch (err) {
        console.error(err);
      }
    }, 1000 * 5);

    return () => {
      if (interval !== undefined) clearInterval(interval);
    };
  }, [
    impersonatedAddress,
    walletAccount?.address,
    suiClient,
    refreshAppData,
    refreshBalancesData,
  ]);

  // Context
  const contextValue = useMemo(
    () => ({
      isImpersonating: !!impersonatedAddress,
      isConnectWalletDropdownOpen,
      setIsConnectWalletDropdownOpen,

      wallet,
      connectWallet: connectWalletWrapper,
      disconnectWallet: disconnectWalletWrapper,

      walletAccounts,
      walletAccount,
      selectWalletAccount,

      address: impersonatedAddress ?? walletAccount?.address,
      signExecuteAndWaitForTransaction,

      refreshBalancesData,
      getAccountBalance,
    }),
    [
      impersonatedAddress,
      isConnectWalletDropdownOpen,
      wallet,
      connectWalletWrapper,
      disconnectWalletWrapper,
      walletAccounts,
      walletAccount,
      selectWalletAccount,
      signExecuteAndWaitForTransaction,
      refreshBalancesData,
      getAccountBalance,
    ],
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}
