import { useState } from "react";

import { Transaction } from "@mysten/sui/transactions";

import { formatToken } from "@suilend/sui-fe";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";

import Card from "@/components/Card";
import Button from "@/components/create-admin/Button";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useLoadedLstContext } from "@/contexts/LstContext";
import { useUserContext } from "@/contexts/UserContext";
import { showSuccessTxnToast } from "@/lib/toasts";
import { patchLst } from "@/lib/updateLst";

export default function ClaimFeesCard() {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { refresh } = useUserContext();
  const { appData } = useLoadedAppContext();
  const { admin } = useLoadedLstContext();

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submit = async () => {
    if (!address) throw new Error("Wallet not connected");
    if (!admin.weightHookAdminCapId)
      throw new Error("Error: No weight hook admin cap");

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

      // Patch
      await patchLst(admin.lstCoinType);
    } catch (err) {
      showErrorToast("Failed to claim fees", err as Error);
      console.error(err);
    } finally {
      setIsSubmitting(false);
      refresh();
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
            {appData.suiToken.symbol}
          </p>
        </div>

        <Button
          onClick={submit}
          isLoading={isSubmitting}
          isDisabled={!admin.weightHookAdminCapId}
        >
          Claim
        </Button>
      </div>
    </Card>
  );
}
