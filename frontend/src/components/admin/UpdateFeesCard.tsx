import { useCallback, useEffect, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";

import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui";
import { FeeConfigArgs } from "@suilend/springsui-sdk";

import Button from "@/components/admin/Button";
import Input from "@/components/admin/Input";
import Card from "@/components/Card";
import { LstData, useLoadedAppContext } from "@/contexts/AppContext";
import { useLoadedLstContext } from "@/contexts/LstContext";
import { showSuccessTxnToast } from "@/lib/toasts";

export default function UpdateFeesCard() {
  const { explorer } = useSettingsContext();
  const { signExecuteAndWaitForTransaction } = useWalletContext();
  const { refresh } = useLoadedAppContext();
  const { admin } = useLoadedLstContext();

  // State
  const getFeeConfigArgs = useCallback(
    (_lstData: LstData) => ({
      mintFeeBps: _lstData.mintFeePercent.times(100).toString(),
      redeemFeeBps: _lstData.redeemFeePercent.times(100).toString(),
      spreadFeeBps: _lstData.spreadFeePercent.times(100).toString(),
    }),
    [],
  );

  const [feeConfigArgs, setFeeConfigArgs] = useState<
    Record<keyof FeeConfigArgs, string>
  >(getFeeConfigArgs(admin.lstData));

  useEffect(() => {
    setFeeConfigArgs(getFeeConfigArgs(admin.lstData));
  }, [getFeeConfigArgs, admin.lstData]);

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submit = async () => {
    if (!admin.weightHookAdminCapId)
      throw new Error("Error: No weight hook admin cap");

    if (isSubmitting) return;
    setIsSubmitting(true);

    const transaction = new Transaction();

    try {
      const hasMissingValues = Object.entries(feeConfigArgs).some(
        ([key, value]) => value === "",
      );
      if (hasMissingValues) throw new Error("Missing values");

      admin.lstClient.updateFees(
        transaction,
        admin.weightHookAdminCapId,
        Object.entries(feeConfigArgs).reduce(
          (acc, [key, value]) => ({ ...acc, [key]: +value }),
          {},
        ),
      );

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast("Updated fees", txUrl);
    } catch (err) {
      showErrorToast("Failed to update fees", err as Error);
      console.error(err);
    } finally {
      setIsSubmitting(false);
      await refresh();
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
          isDisabled={!admin.weightHookAdminCapId}
          isSubmitting={isSubmitting}
        />
      </div>
    </Card>
  );
}
