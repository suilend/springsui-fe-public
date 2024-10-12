import BigNumber from "bignumber.js";
import { Wallet } from "lucide-react";

import { AppData, useAppContext } from "@/contexts/AppContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { formatToken } from "@/lib/format";
import { Token } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BalanceLabelProps {
  token: Token;
  onClick?: () => void;
}

export default function BalanceLabel({ token, onClick }: BalanceLabelProps) {
  const appContext = useAppContext();
  const data = appContext.data as AppData;
  const { address } = useWalletContext();

  const balance = new BigNumber(
    data.coinBalancesRaw.find((cb) => cb.coinType === token.coinType)
      ?.totalBalance ?? 0,
  ).div(10 ** token.decimals);

  const hasOnClick = !!onClick && balance.gt(0);

  return (
    <div
      className={cn(
        "flex flex-row items-center gap-1.5",
        hasOnClick && "group cursor-pointer",
      )}
      onClick={hasOnClick ? onClick : undefined}
    >
      <Wallet
        className={cn(
          "h-4 w-4 text-navy-600",
          hasOnClick && "transition-colors group-hover:text-foreground",
        )}
      />
      <p
        className={cn(
          "text-p2 text-navy-600",
          hasOnClick &&
            "underline decoration-dotted decoration-1 underline-offset-2 transition-colors group-hover:text-foreground group-hover:decoration-solid",
        )}
      >
        {address ? formatToken(balance) : "-"}
      </p>
    </div>
  );
}
