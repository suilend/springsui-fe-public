import { useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import { Loader2 } from "lucide-react";

import { LstClient } from "@suilend/springsui-sdk";

import Card from "@/components/Card";
import { useAppDataContext } from "@/contexts/AppDataContext";
import { useRootContext } from "@/contexts/RootContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { LIQUID_STAKING_INFO } from "@/lib/coinType";
import { errorToast, successToast } from "@/lib/toasts";

export default function Admin() {
  const { explorer, ...restRootContext } = useRootContext();
  const lstClient = restRootContext.lstClient as LstClient;
  const { refreshAppData } = useAppDataContext();
  const { signExecuteAndWaitForTransaction } = useWalletContext();

  // Rebalance
  const [isRebalancing, setIsRebalancing] = useState<boolean>(false);

  const rebalance = async () => {
    if (isRebalancing) return;

    setIsRebalancing(true);

    const transaction = new Transaction();

    try {
      lstClient.rebalance(transaction, LIQUID_STAKING_INFO.weightHookId);

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      successToast("Rebalanced", undefined, txUrl);
    } catch (err) {
      errorToast("Failed to rebalance", err as Error);
      console.error(err);
    } finally {
      setIsRebalancing(false);
      await refreshAppData();
    }
  };

  return (
    <>
      <div className="relative z-[1] flex w-full flex-col items-center px-4 pt-4 md:px-10 md:py-20">
        <div className="flex w-full max-w-3xl flex-col items-center gap-8">
          <p className="text-center text-h1">Admin</p>

          <div className="flex w-full flex-col gap-4">
            <Card>
              <div className="flex w-full flex-col gap-2 p-2 md:gap-4 md:p-4">
                <button
                  className="flex h-10 w-[92px] w-max flex-row items-center justify-center gap-2 rounded-sm bg-navy-800 px-3 text-white"
                  onClick={rebalance}
                >
                  {isRebalancing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <p className="text-p2">Rebalance</p>
                  )}
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
