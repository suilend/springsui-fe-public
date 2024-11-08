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
import { showSuccessTxnToast } from "@/lib/toasts";

export default function CollectFeesCard() {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { lstClient, refresh, weightHookAdminCapId } = useLoadedAppContext();

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submit = async () => {
    if (!weightHookAdminCapId)
      throw new Error("Error: No weight hook admin cap");

    if (!address) throw new Error("Error: No address");

    if (isSubmitting) return;
    setIsSubmitting(true);

    const transaction = new Transaction();

    try {
      const sui = lstClient.collectFees(transaction, weightHookAdminCapId);
      transaction.transferObjects([sui], address);

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast("Collected fees", txUrl);
    } catch (err) {
      showErrorToast("Failed to collect fees", err as Error);
      console.error(err);
    } finally {
      setIsSubmitting(false);
      await refresh();
    }
  };

  return (
    <Card>
      <div className="flex w-full flex-col gap-4 p-4">
        <p className="text-navy-600">Collect fees</p>

        <Button
          onClick={submit}
          isDisabled={!weightHookAdminCapId}
          isSubmitting={isSubmitting}
        />
      </div>
    </Card>
  );
}
