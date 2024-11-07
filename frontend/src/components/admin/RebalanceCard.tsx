import { useState } from "react";

import { Transaction } from "@mysten/sui/transactions";

import { LstClient } from "@suilend/springsui-sdk";

import Button from "@/components/admin/Button";
import Card from "@/components/Card";
import { useAppDataContext } from "@/contexts/AppDataContext";
import { useRootContext } from "@/contexts/RootContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { LIQUID_STAKING_INFO } from "@/lib/coinType";
import { errorToast, successToast } from "@/lib/toasts";

export default function RebalanceCard() {
  const { explorer, ...restRootContext } = useRootContext();
  const lstClient = restRootContext.lstClient as LstClient;
  const { refreshAppData } = useAppDataContext();
  const { signExecuteAndWaitForTransaction } = useWalletContext();

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
