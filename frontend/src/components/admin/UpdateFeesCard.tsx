import { useState } from "react";

import { Transaction } from "@mysten/sui/transactions";

import { useSettingsContext, useWalletContext } from "@suilend/frontend-sui";
import { FeeConfigArgs, LstClient } from "@suilend/springsui-sdk";

import Button from "@/components/admin/Button";
import Input from "@/components/admin/Input";
import Card from "@/components/Card";
import { AppData, useAppContext } from "@/contexts/AppContext";
import { errorToast, successToast } from "@/lib/toasts";

export default function UpdateFeesCard() {
  const { explorer } = useSettingsContext();
  const { signExecuteAndWaitForTransaction } = useWalletContext();
  const {
    refreshAppData,
    refreshBalances,
    weightHookAdminCapId,
    ...restAppContext
  } = useAppContext();
  const lstClient = restAppContext.lstClient as LstClient;
  const appData = restAppContext.appData as AppData;

  // State
  const [feeConfigArgs, setFeeConfigArgs] = useState<
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

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submit = async () => {
    if (!weightHookAdminCapId)
      throw new Error("Error: No weight hook admin cap");

    if (isSubmitting) return;
    setIsSubmitting(true);

    const transaction = new Transaction();

    try {
      const hasMissingValues = Object.entries(feeConfigArgs).some(
        ([key, value]) => value === "",
      );
      if (hasMissingValues) throw new Error("Missing values");

      lstClient.updateFees(
        transaction,
        weightHookAdminCapId,
        Object.entries(feeConfigArgs).reduce(
          (acc, [key, value]) => ({ ...acc, [key]: +value }),
          {},
        ),
      );

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      successToast("Updated fees", undefined, txUrl);
    } catch (err) {
      errorToast("Failed to update fees", err as Error);
      console.error(err);
    } finally {
      setIsSubmitting(false);
      await refreshAppData();
      await refreshBalances();
    }
  };

  return (
    <Card>
      <div className="flex w-full flex-col gap-4 p-4">
        <p className="text-navy-600">Update fees</p>

        <div className="flex flex-col gap-4 md:flex-row">
          {Object.keys(feeConfigArgs).map((key) => (
            <div
              key={key}
              className="flex flex-col gap-1.5 max-md:w-full md:flex-1"
            >
              <p className="text-p2 text-navy-600">{key}</p>
              <Input
                type="number"
                value={feeConfigArgs[key as keyof FeeConfigArgs] ?? ""}
                onChange={(value) =>
                  setFeeConfigArgs((fc) => ({
                    ...fc,
                    [key]: value,
                  }))
                }
              />
            </div>
          ))}
        </div>

        <Button
          onClick={submit}
          isDisabled={!weightHookAdminCapId}
          isSubmitting={isSubmitting}
        />
      </div>
    </Card>
  );
}
