import { Dispatch, SetStateAction } from "react";

import { FeeConfigArgs } from "@suilend/springsui-sdk";

import Input from "@/components/admin/Input";

const feeNameMap: Record<keyof FeeConfigArgs, string> = {
  mintFeeBps: "Staking fee (bps)",
  redeemFeeBps: "Unstaking fee (bps)",
  spreadFeeBps: "Performance fee (bps)",
};

interface FeesInputsProps {
  feeConfigArgs: Record<keyof FeeConfigArgs, string>;
  setFeeConfigArgs: Dispatch<
    SetStateAction<Record<keyof FeeConfigArgs, string>>
  >;
}

export default function FeesInputs({
  feeConfigArgs,
  setFeeConfigArgs,
}: FeesInputsProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {Object.keys(feeConfigArgs).map((key) => (
        <div key={key} className="flex flex-col gap-2 max-md:w-full md:flex-1">
          <p className="text-p2 text-navy-600">
            {feeNameMap[key as keyof FeeConfigArgs]}
          </p>
          <Input
            type="number"
            value={feeConfigArgs[key as keyof FeeConfigArgs] ?? ""}
            onChange={(value) =>
              setFeeConfigArgs((fc) => ({ ...fc, [key]: value }))
            }
          />
          {key === "mintFeeBps" && (
            <p className="text-p3 text-navy-500">0 bps (0.00%) recommended</p>
          )}
          {key === "redeemFeeBps" && <></>}
          {key === "spreadFeeBps" && (
            <p className="text-p3 text-navy-500">E.g. 10% fee = 1000 bps</p>
          )}
        </div>
      ))}
    </div>
  );
}
