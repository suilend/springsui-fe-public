import { useState } from "react";

import { Transaction } from "@mysten/sui/transactions";

import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";

import Button from "@/components/admin/Button";
import Dialog from "@/components/Dialog";
import TokenLogo from "@/components/TokenLogo";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useLoadedLstContext } from "@/contexts/LstContext";
import { showSuccessTxnToast } from "@/lib/toasts";

interface TransactionConfirmationDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  newOwnerAddress: string;
}

export default function TransferOwnershipConfirmationDialog({
  isOpen,
  setIsOpen,
  newOwnerAddress,
}: TransactionConfirmationDialogProps) {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { refresh } = useLoadedAppContext();
  const { admin } = useLoadedLstContext();

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submit = async () => {
    if (!address) throw new Error("Wallet not connected");
    if (!admin.weightHookAdminCapId)
      throw new Error("Error: No weight hook admin cap");

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const transaction = new Transaction();

      transaction.transferObjects(
        [admin.weightHookAdminCapId],
        newOwnerAddress,
      );

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast("Transferred owner cap", txUrl);
      setIsOpen(false);
    } catch (err) {
      showErrorToast("Failed to transfer owner cap", err as Error);
      console.error(err);
    } finally {
      setIsSubmitting(false);
      await refresh();
    }
  };

  return (
    <Dialog
      rootProps={{ open: isOpen, onOpenChange: setIsOpen }}
      headerProps={{
        title: (
          <>
            Transfer ownership of{" "}
            <TokenLogo token={admin.lstData.token} size={24} />
            {admin.lstData.token.symbol}
          </>
        ),
      }}
      dialogContentOuterClassName="max-w-lg"
    >
      <div className="flex flex-col gap-4">
        <p className="text-p2 text-navy-600">
          You are about to transfer admin rights to{" "}
          <span className="break-all font-bold text-foreground">
            {newOwnerAddress}
          </span>
        </p>

        <div className="flex flex-col gap-2">
          <p className="text-p2 text-navy-600">
            Note that transferring the OwnerCap will transfer full
            administrative control of {admin.lstData.token.symbol} to this
            address. This includes the ability to:
          </p>

          <div className="flex flex-col gap-1">
            <p className="text-p2 text-navy-600">• Claim fees</p>
            <p className="text-p2 text-navy-600">
              • Update fees and validators
            </p>
            <p className="text-p2 text-navy-600">
              • Transfer ownership of the LST
            </p>
          </div>
        </div>

        <p className="text-p2 text-navy-600">
          This action is irreversible. Please double-check the recipient address
          and confirm you fully understand the consequences.
        </p>

        <Button
          onClick={submit}
          isLoading={isSubmitting}
          isDisabled={!admin.weightHookAdminCapId}
        />
      </div>
    </Dialog>
  );
}
