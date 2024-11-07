import { useState } from "react";

import { Transaction } from "@mysten/sui/transactions";

import { useSettingsContext, useWalletContext } from "@suilend/frontend-sui";
import { LstClient } from "@suilend/springsui-sdk";

import Button from "@/components/admin/Button";
import Card from "@/components/Card";
import { useAppContext } from "@/contexts/AppContext";
import { LIQUID_STAKING_INFO } from "@/lib/coinType";
import { errorToast, successToast } from "@/lib/toasts";

export default function RebalanceCard() {
  const { explorer } = useSettingsContext();
  const { signExecuteAndWaitForTransaction } = useWalletContext();
  const { refreshAppData, refreshBalances, ...restAppContext } =
    useAppContext();
  const lstClient = restAppContext.lstClient as LstClient;

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

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
      setIsSubmitting(false);
      await refreshAppData();
      await refreshBalances();
    }
  };

  return (
    <Card>
      <div className="flex w-full flex-col gap-4 p-4">
        <p className="text-navy-600">Rebalance</p>

        <Button onClick={submit} isSubmitting={isSubmitting} />
      </div>
    </Card>
  );
}
