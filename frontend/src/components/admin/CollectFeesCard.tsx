import { Transaction } from "@mysten/sui/transactions";
import { LstClient } from "@suilend/springsui-sdk";
import { useState } from "react";

import Button from "@/components/admin/Button";
import Card from "@/components/Card";
import { useAppDataContext } from "@/contexts/AppDataContext";
import { useRootContext } from "@/contexts/RootContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { errorToast, successToast } from "@/lib/toasts";

export default function CollectFeesCard() {
  const { explorer, ...restRootContext } = useRootContext();
  const lstClient = restRootContext.lstClient as LstClient;
  const { refreshAppData } = useAppDataContext();
  const { signExecuteAndWaitForTransaction, weightHookAdminCapId, address } =
    useWalletContext();

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

      successToast("Collected fees", undefined, txUrl);
    } catch (err) {
      errorToast("Failed to collect fees", err as Error);
      console.error(err);
    } finally {
      setIsSubmitting(false);
      await refreshAppData();
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
