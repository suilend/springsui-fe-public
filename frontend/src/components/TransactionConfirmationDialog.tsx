import BigNumber from "bignumber.js";

import { Token } from "@suilend/frontend-sui";

import Card from "@/components/Card";
import Dialog from "@/components/Dialog";
import TokenLogo from "@/components/TokenLogo";
import useBreakpoint from "@/hooks/useBreakpoint";
import { formatToken } from "@/lib/format";

export type TransactionConfirmationDialogConfig = {
  isStaking: boolean;
  inToken: Token;
  outToken: Token;
  inValue: string;
  outValue: string;
};

interface TransactionConfirmationDialogProps {
  isOpen: boolean;
  config: TransactionConfirmationDialogConfig;
}

export default function TransactionConfirmationDialog({
  isOpen,
  config,
}: TransactionConfirmationDialogProps) {
  const { isStaking, inToken, outToken, inValue, outValue } = config;

  const { md } = useBreakpoint();

  if (!md) return null;
  return (
    <Dialog rootProps={{ open: isOpen }}>
      <Card className="p-2 md:p-4">
        <div className="flex w-full flex-col items-center gap-6 rounded-md bg-white px-4 pb-4 pt-8">
          <p className="px-4 text-center text-h2">
            Confirm transaction in your wallet
          </p>

          <video
            className="h-40 w-40"
            autoPlay
            controls={false}
            loop
            muted
            preload="auto"
            playsInline
          >
            <source
              src="/assets/transaction-confirmation.webm"
              type="video/webm"
            />
          </video>

          <div className="flex w-full flex-col rounded-md border border-navy-100">
            <div className="flex w-full flex-row items-center justify-between p-3">
              <p className="text-p2 text-navy-600">
                {isStaking ? "Staking" : "Unstaking"}
              </p>

              <div className="flex flex-row items-center">
                <p className="mr-2">
                  {formatToken(new BigNumber(inValue), {
                    dp: inToken.decimals,
                  })}
                </p>
                <TokenLogo className="mr-1.5" token={inToken} size={16} />
                <p>{inToken.symbol}</p>
              </div>
            </div>
            <div className="h-px w-full bg-navy-100" />
            <div className="flex w-full flex-row items-center justify-between p-3">
              <p className="text-p2 text-navy-600">Receiving</p>

              <div className="flex flex-row items-center">
                <p className="mr-2">
                  {formatToken(new BigNumber(outValue), {
                    dp: outToken.decimals,
                  })}
                </p>
                <TokenLogo className="mr-1.5" token={outToken} size={16} />
                <p>{outToken.symbol}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Dialog>
  );
}
