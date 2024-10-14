import Icon, { IconList } from "@/components/Icon";
import { useAppContext } from "@/contexts/AppContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { formatToken } from "@/lib/format";
import { Token } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BalanceLabelProps {
  token: Token;
  onClick?: () => void;
}

export default function BalanceLabel({ token, onClick }: BalanceLabelProps) {
  const { getBalance } = useAppContext();
  const { address } = useWalletContext();

  const hasOnClick = !!onClick && getBalance(token.coinType).gt(0);

  return (
    <div
      className={cn(
        "flex flex-row items-center gap-1.5",
        hasOnClick && "group cursor-pointer",
      )}
      onClick={hasOnClick ? onClick : undefined}
    >
      <Icon
        className={cn(
          "text-navy-600",
          hasOnClick && "transition-colors group-hover:text-foreground",
        )}
        icon={IconList.WALLET}
      />
      <p
        className={cn(
          "text-p2 text-navy-600",
          hasOnClick &&
            "underline decoration-dotted decoration-1 underline-offset-2 transition-colors group-hover:text-foreground group-hover:decoration-solid",
        )}
      >
        {address ? formatToken(getBalance(token.coinType)) : "-"}
      </p>
    </div>
  );
}
