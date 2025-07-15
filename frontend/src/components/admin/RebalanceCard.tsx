import { useState } from "react";

import { Transaction } from "@mysten/sui/transactions";

import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";

import Card from "@/components/Card";
import Button from "@/components/create-admin/Button";
import { useLoadedLstContext } from "@/contexts/LstContext";
import { useUserContext } from "@/contexts/UserContext";
import { showSuccessTxnToast } from "@/lib/toasts";
import { patchLst } from "@/lib/updateLst";

export default function RebalanceCard() {
  const { explorer } = useSettingsContext();
  const { signExecuteAndWaitForTransaction } = useWalletContext();
  const { refresh } = useUserContext();
  const { admin } = useLoadedLstContext();

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const transaction = new Transaction();

    try {
      admin.lstData.lstClient.rebalance(
        transaction,
        admin.lstData.lstClient.liquidStakingObject.weightHookId,
      );

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast("Rebalanced", txUrl);

      // Patch
      await patchLst(admin.lstCoinType);
    } catch (err) {
      showErrorToast("Failed to rebalance", err as Error);
      console.error(err);
    } finally {
      setIsSubmitting(false);
      refresh();
    }
  };

  return (
    <Card>
      <div className="flex w-full flex-col gap-4 p-4">
        <p className="text-navy-600">Rebalance</p>

        <Button onClick={submit} isLoading={isSubmitting}>
          Rebalance
        </Button>
      </div>
    </Card>
  );
}
