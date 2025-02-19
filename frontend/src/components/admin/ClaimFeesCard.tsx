import { useState } from "react";

import { Transaction } from "@mysten/sui/transactions";

import { formatToken } from "@suilend/frontend-sui";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";

import Button from "@/components/admin/Button";
import Card from "@/components/Card";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useLoadedLstContext } from "@/contexts/LstContext";
import { showSuccessTxnToast } from "@/lib/toasts";

export default function ClaimFeesCard() {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { refresh } = useLoadedAppContext();
  const { admin } = useLoadedLstContext();

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submit = async () => {
    if (!admin.weightHookAdminCapId)
      throw new Error("Error: No weight hook admin cap");

    if (!address) throw new Error("Error: No address");

    if (isSubmitting) return;
    setIsSubmitting(true);

    const transaction = new Transaction();

    try {
      admin.lstData.lstClient.collectFeesAndSendToUser(
        transaction,
        admin.weightHookAdminCapId,
        address,
      );

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast("Claimed fees", txUrl);
    } catch (err) {
      showErrorToast("Failed to claim fees", err as Error);
      console.error(err);
    } finally {
      setIsSubmitting(false);
      await refresh();
    }
  };

  return (
    <Card>
      <div className="flex w-full flex-col gap-4 p-4">
        <div className="flex w-full flex-row items-center gap-2">
          <p className="text-navy-600">Claim fees</p>
          <p className="text-p2 text-navy-500">
            {formatToken(
              admin.lstData.fees.plus(admin.lstData.accruedSpreadFees),
              { dp: admin.lstData.token.decimals },
            )}{" "}
            {admin.lstData.token.symbol}
          </p>
        </div>

        <Button
          onClick={submit}
          isLoading={isSubmitting}
          isDisabled={!admin.weightHookAdminCapId}
        />
      </div>
    </Card>
  );
}
