import { forwardRef } from "react";

import BigNumber from "bignumber.js";

import { LstId, Token } from "@suilend/frontend-sui";

import BalanceLabel from "@/components/BalanceLabel";
import LstPopover from "@/components/LstPopover";
import TokenLogo from "@/components/TokenLogo";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StakeInputProps {
  token: Token;
  isLst?: boolean;
  onLstChange?: (lstId: LstId) => void;
  title: string;
  value: string;
  onChange?: (value: string) => void;
  usdValue: BigNumber;
  onBalanceClick?: () => void;
}

const StakeInput = forwardRef<HTMLInputElement, StakeInputProps>(
  (
    {
      token,
      isLst,
      onLstChange,
      title,
      value,
      onChange,
      usdValue,
      onBalanceClick,
    },
    ref,
  ) => {
    const isReadOnly = !onChange;

    return (
      <div
        className={cn(
          "flex w-full flex-col rounded-md bg-white p-4 transition-shadow",
          !isReadOnly &&
            "focus-within:shadow-[inset_0_0_0_1px_hsl(var(--blue))]",
        )}
      >
        <p className="text-p2 text-navy-600">{title}</p>

        <div className="flex w-full flex-row items-center justify-between">
          <div className="flex-1">
            <input
              ref={ref}
              autoFocus
              type="number"
              className="w-full py-1.5 font-sans text-h2 text-foreground placeholder:text-navy-500 focus-visible:outline-none md:text-h1 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              placeholder="0"
              value={value}
              readOnly={isReadOnly}
              onChange={
                !isReadOnly ? (e) => onChange(e.target.value) : undefined
              }
              onWheel={(e) => e.currentTarget.blur()}
            />
          </div>

          {isLst ? (
            <LstPopover onChange={onLstChange} />
          ) : (
            <div className="flex flex-row items-center gap-2">
              <TokenLogo token={token} size={28} />
              <p className="text-h3">{token.symbol}</p>
            </div>
          )}
        </div>

        <div className="flex w-full flex-row items-center justify-between">
          <p className="text-p2 text-navy-500">{formatUsd(usdValue)}</p>

          <BalanceLabel token={token} onClick={onBalanceClick} />
        </div>
      </div>
    );
  },
);
StakeInput.displayName = "StakeInput";

export default StakeInput;
