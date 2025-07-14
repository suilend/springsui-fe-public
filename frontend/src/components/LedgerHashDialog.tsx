import Dialog from "@/components/Dialog";

interface LedgerHashDialogProps {
  isOpen: boolean;
  ledgerHash: string;
}

export default function LedgerHashDialog({
  isOpen,
  ledgerHash,
}: LedgerHashDialogProps) {
  return (
    <Dialog
      rootProps={{ open: isOpen, onOpenChange: () => {} }}
      headerProps={{
        title: <>Using a ledger?</>,
        showCloseButton: false,
      }}
      dialogContentOuterClassName="max-w-sm"
    >
      <p className="text-p2 text-navy-600">
        If you are using a Ledger to sign the transaction, please verify the
        hash shown on your device matches the hash below.
      </p>
      <p className="break-all font-[monospace] text-p2 text-foreground">
        {ledgerHash}
      </p>
    </Dialog>
  );
}
