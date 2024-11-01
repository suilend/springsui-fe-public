import { useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import { Loader2 } from "lucide-react";

import { FeeConfigArgs, LstClient } from "@suilend/springsui-sdk";

import Card from "@/components/Card";
import { FooterSm } from "@/components/Footer";
import { AppData, useAppDataContext } from "@/contexts/AppDataContext";
import { useRootContext } from "@/contexts/RootContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { LIQUID_STAKING_INFO } from "@/lib/coinType";
import { errorToast, successToast } from "@/lib/toasts";

export default function Admin() {
  const { explorer, ...restRootContext } = useRootContext();
  const lstClient = restRootContext.lstClient as LstClient;
  const { refreshAppData, ...restAppContext } = useAppDataContext();
  const appData = restAppContext.appData as AppData;
  const { signExecuteAndWaitForTransaction, weightHookAdminCapId } =
    useWalletContext();

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

  // Update fees
  const [updateFeesFeeConfigArgs, setUpdateFeesFeeConfigArgs] = useState<
    Record<keyof FeeConfigArgs, string>
  >({
    mintFeeBps: appData.liquidStakingInfo.mintFeePercent.times(100).toString(),
    redeemFeeBps: appData.liquidStakingInfo.redeemFeePercent
      .times(100)
      .toString(),
    spreadFeeBps: appData.liquidStakingInfo.spreadFeePercent
      .times(100)
      .toString(),
  });

  const [isUpdatingFees, setIsUpdatingFees] = useState<boolean>(false);

  const updateFees = async () => {
    if (!weightHookAdminCapId)
      throw new Error("Error: No weight hook admin cap");

    if (isUpdatingFees) return;
    setIsUpdatingFees(true);

    const transaction = new Transaction();

    try {
      const missingEntries = Object.entries(updateFeesFeeConfigArgs).filter(
        ([key, value]) => value === "",
      );
      if (missingEntries.length > 0)
        throw new Error(
          `Missing values for: ${missingEntries.map(([key]) => key).join(", ")}`,
        );

      lstClient.updateFees(
        transaction,
        weightHookAdminCapId,
        Object.entries(updateFeesFeeConfigArgs).reduce(
          (acc, [key, value]) => ({ ...acc, [key]: +value }),
          {} as FeeConfigArgs,
        ),
      );

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      successToast("Updated fees", undefined, txUrl);
    } catch (err) {
      errorToast("Failed to update fees", err as Error);
      console.error(err);
    } finally {
      setIsUpdatingFees(false);
      await refreshAppData();
    }
  };

  return (
    <>
      <div className="relative z-[1] flex w-full flex-col items-center px-4 pt-4 md:px-10 md:py-20">
        <div className="flex w-full max-w-3xl flex-col items-center gap-8">
          <p className="text-center text-h1">Admin</p>

          <div className="flex w-full flex-col gap-4">
            {/* Rebalance */}
            <Card>
              <div className="flex w-full flex-col gap-4 p-4">
                <p className="text-navy-600">Rebalance</p>
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

            {/* Update fees */}
            <Card>
              <div className="flex w-full flex-col gap-4 p-4">
                <p className="text-navy-600">Update fees</p>
                <div className="flex flex-col gap-4 md:flex-row">
                  {Object.keys(updateFeesFeeConfigArgs).map((key) => (
                    <div
                      key={key}
                      className="flex flex-col gap-1.5 max-md:w-full md:flex-1"
                    >
                      <p className="text-p2 text-navy-600">{key}</p>
                      <input
                        type="number"
                        className="h-10 w-full rounded-sm bg-white px-4 font-sans text-p1 text-foreground placeholder:text-navy-500 focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        value={
                          updateFeesFeeConfigArgs[key as keyof FeeConfigArgs] ??
                          ""
                        }
                        onChange={(e) =>
                          setUpdateFeesFeeConfigArgs((fc) => ({
                            ...fc,
                            [key]: e.target.value,
                          }))
                        }
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </div>
                  ))}
                </div>

                <button
                  className="flex h-10 w-[92px] w-max flex-row items-center justify-center gap-2 rounded-sm bg-navy-800 px-3 text-white disabled:opacity-50"
                  onClick={updateFees}
                  disabled={!weightHookAdminCapId}
                >
                  {isUpdatingFees ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <p className="text-p2">Update fees</p>
                  )}
                </button>
              </div>
            </Card>
          </div>

          {/* WIDTH < md */}
          <FooterSm />
        </div>
      </div>
    </>
  );
}
