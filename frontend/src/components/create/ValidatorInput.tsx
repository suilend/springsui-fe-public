import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ValidatorApy } from "@mysten/sui/client";
import BigNumber from "bignumber.js";
import { ExternalLink } from "lucide-react";

import { SUILEND_VALIDATOR_ADDRESS } from "@suilend/springsui-sdk";
import { formatPercent } from "@suilend/sui-fe";
import { useSettingsContext } from "@suilend/sui-fe-next";

import SelectPopover from "@/components/create-admin/SelectPopover";
import Skeleton from "@/components/Skeleton";
import { VALIDATOR_METADATA } from "@/lib/validators";

interface ValidatorInputProps {
  vaw: { id: string; validatorAddress: string; weight: string }[];
  onVawChange: (id: string, key: string, value: string) => void;
}

export default function ValidatorInput({
  vaw,
  onVawChange,
}: ValidatorInputProps) {
  const { explorer, suiClient } = useSettingsContext();

  const [validatorApys, setValidatorApys] = useState<
    ValidatorApy[] | undefined
  >(undefined);

  useEffect(() => {
    (async () => {
      try {
        const validatorApys = await suiClient.getValidatorsApy();
        setValidatorApys(validatorApys.apys);
      } catch (err) {}
    })();
  }, [suiClient]);

  const validatorOptions = useMemo(
    () =>
      validatorApys === undefined
        ? undefined
        : validatorApys
            .map((apyObj) => {
              const metadata = VALIDATOR_METADATA.find(
                (vm) => vm.address === apyObj.address,
              );

              return {
                id: apyObj.address,
                name: metadata?.name ?? apyObj.address,
                endDecorator: (
                  <p className="shrink-0 text-p2 text-navy-500">
                    {formatPercent(new BigNumber(apyObj.apy * 100))} APR
                  </p>
                ),
                iconUrl: metadata?.imageUrl,
              };
            })
            .sort((a, b) => {
              const aMetadata = VALIDATOR_METADATA.find(
                (vm) => vm.address === a.id,
              );
              const bMetadata = VALIDATOR_METADATA.find(
                (vm) => vm.address === b.id,
              );

              return a.name === "Suilend"
                ? -1
                : (bMetadata?.stakeAmount ?? 0) - (aMetadata?.stakeAmount ?? 0); // Sort by stake (desc)
            }),
    [validatorApys],
  );

  return (
    <div className="flex flex-col gap-2 max-md:w-full md:flex-1">
      <p className="text-p2 text-navy-600">Validator</p>
      <div className="w-full max-w-[320px]">
        {validatorOptions === undefined ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <SelectPopover
            maxWidth={320}
            placeholder="Select validator"
            options={validatorOptions}
            highlightedOptionIds={[SUILEND_VALIDATOR_ADDRESS]}
            value={vaw[0].validatorAddress}
            onChange={(id) => onVawChange(vaw[0].id, "validatorAddress", id)}
          />
        )}
      </div>
      {vaw[0].validatorAddress && (
        <Link
          className="flex w-max flex-row items-center gap-1 text-navy-500 transition-colors hover:text-foreground"
          href={explorer
            .buildAddressUrl("")
            .replace("account", `validator/${vaw[0].validatorAddress}`)}
          target="_blank"
        >
          <p className="text-inherit text-p3">View validator</p>
          <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
