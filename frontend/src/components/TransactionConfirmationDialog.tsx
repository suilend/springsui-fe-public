import Card from "@/components/Card";
import Dialog from "@/components/Dialog";
import TokenLogo from "@/components/TokenLogo";
import { Token } from "@/lib/types";

interface TransactionConfirmationDialogProps {
  isStaking: boolean;
  inToken: Token;
  outToken: Token;
  inValue: string;
  outValue: string;
  isOpen: boolean;
}

export default function TransactionConfirmationDialog({
  isStaking,
  inToken,
  outToken,
  inValue,
  outValue,
  isOpen,
}: TransactionConfirmationDialogProps) {
  return (
    <Dialog rootProps={{ open: isOpen }}>
      <Card className="p-4">
        <div className="flex w-full flex-col items-center gap-6 rounded-md bg-white px-5 pb-5 pt-8">
          <p className="px-4 text-center text-h2">
            Confirm transaction in your wallet
          </p>

          <video
            className="h-36 w-36"
            autoPlay
            controls={false}
            loop
            muted
            preload="auto"
            src={"/assets/transaction-confirmation.webm"}
          />

          <div className="flex w-full flex-col rounded-md border border-navy-100">
            <div className="flex w-full flex-row items-center justify-between p-3">
              <p className="text-p2 text-navy-600">
                You are {isStaking ? "staking" : "unstaking"}
              </p>

              <div className="flex flex-row items-center">
                <p className="mr-2">{inValue}</p>
                <TokenLogo className="mr-1" token={inToken} size={16} />
                <p>{inToken.symbol}</p>
              </div>
            </div>
            <div className="h-px w-full bg-navy-100" />
            <div className="flex w-full flex-row items-center justify-between p-3">
              <p className="text-p2 text-navy-600">You will receive</p>

              <div className="flex flex-row items-center">
                <p className="mr-2">{outValue}</p>
                <TokenLogo className="mr-1" token={outToken} size={16} />
                <p>{outToken.symbol}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Dialog>
  );
}
