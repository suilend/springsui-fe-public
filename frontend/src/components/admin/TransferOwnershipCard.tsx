import { useEffect, useRef, useState } from "react";

import { showErrorToast } from "@suilend/sui-fe-next";

import TransferOwnershipConfirmationDialog from "@/components/admin/TransferOwnershipConfirmationDialog";
import Card from "@/components/Card";
import Button from "@/components/create-admin/Button";
import Input from "@/components/create-admin/Input";
import { useLoadedLstContext } from "@/contexts/LstContext";

export default function TransferOwnershipCard() {
  const { admin } = useLoadedLstContext();

  // State
  const [newOwnerAddress, setNewOwnerAddress] = useState<string>("");
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState<boolean>(false);

  const prevLstCoinTypeRef = useRef<string>(admin.lstCoinType);
  useEffect(() => {
    if (admin.lstCoinType === prevLstCoinTypeRef.current) return;
    prevLstCoinTypeRef.current = admin.lstCoinType;

    setNewOwnerAddress("");
  }, [admin.lstCoinType]);

  // Submit
  const submit = () => {
    try {
      if (newOwnerAddress === "") throw new Error("Enter an address");

      setIsConfirmationDialogOpen(true);
    } catch (err) {
      showErrorToast("Failed to transfer owner cap", err as Error);
      console.error(err);
    }
  };

  return (
    <>
      <TransferOwnershipConfirmationDialog
        isOpen={isConfirmationDialogOpen}
        setIsOpen={setIsConfirmationDialogOpen}
        newOwnerAddress={newOwnerAddress}
      />

      <Card>
        <div className="flex w-full flex-col gap-4 p-4">
          <p className="text-navy-600">Transfer ownership</p>

          <div className="flex w-full flex-col gap-2">
            <p className="text-p2 text-navy-600">Address</p>
            <Input
              value={newOwnerAddress}
              onChange={(value) => setNewOwnerAddress(value)}
            />
          </div>

          <Button onClick={submit} isDisabled={!admin.weightHookAdminCapId}>
            Transfer
          </Button>
        </div>
      </Card>
    </>
  );
}
