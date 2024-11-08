import { useState } from "react";

import { Transaction } from "@mysten/sui/transactions";

import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui";

import Button from "@/components/admin/Button";
import Card from "@/components/Card";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { LIQUID_STAKING_INFO } from "@/lib/coinType";
import { showSuccessTxnToast } from "@/lib/toasts";

export default function RebalanceCard() {
  const { explorer } = useSettingsContext();
  const { signExecuteAndWaitForTransaction } = useWalletContext();
  const { lstClient, refresh } = useLoadedAppContext();

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

      showSuccessTxnToast("Rebalanced", txUrl);
    } catch (err) {
      showErrorToast("Failed to rebalance", err as Error);
      console.error(err);
    } finally {
      setIsSubmitting(false);
      await refresh();
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
