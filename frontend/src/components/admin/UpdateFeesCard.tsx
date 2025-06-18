import { useCallback, useEffect, useRef, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";

import { FeeConfigArgs } from "@suilend/springsui-sdk";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";

import Button from "@/components/admin/Button";
import Card from "@/components/Card";
import FeesInputs from "@/components/FeesInputs";
import { LstData, useLoadedAppContext } from "@/contexts/AppContext";
import { useLoadedLstContext } from "@/contexts/LstContext";
import { showSuccessTxnToast } from "@/lib/toasts";
import { patchLst } from "@/lib/updateLst";

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

  const prevLstCoinTypeRef = useRef<string>(admin.lstCoinType);
  useEffect(() => {
    if (admin.lstCoinType === prevLstCoinTypeRef.current) return;
    prevLstCoinTypeRef.current = admin.lstCoinType;

    setFeeConfigArgs(getFeeConfigArgs(admin.lstData));
  }, [admin.lstCoinType, getFeeConfigArgs, admin.lstData]);

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

      if (
        new BigNumber(
          new BigNumber(feeConfigArgs.mintFeeBps).plus(
            feeConfigArgs.redeemFeeBps,
          ),
        ).lt(2)
      )
        throw new Error(
          "Staking + unstaking fees must add up to at least 2 bps (0.02%)",
        );

      admin.lstData.lstClient.updateFees(
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

      // Patch
      await patchLst(admin.lstCoinType);
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

        <FeesInputs
          feeConfigArgs={feeConfigArgs}
          setFeeConfigArgs={setFeeConfigArgs}
        />

        <Button
          onClick={submit}
          isLoading={isSubmitting}
          isDisabled={!admin.weightHookAdminCapId}
        />
      </div>
    </Card>
  );
}
