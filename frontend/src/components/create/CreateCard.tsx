import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ValidatorApy } from "@mysten/sui/client";
import BigNumber from "bignumber.js";
import { snakeCase } from "lodash";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { ADMIN_ADDRESS, FeeConfigArgs } from "@suilend/springsui-sdk";
import { formatNumber, formatPercent } from "@suilend/sui-fe";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";

import Button from "@/components/admin/Button";
import Input from "@/components/admin/Input";
import Card from "@/components/Card";
import IconUpload from "@/components/create/IconUpload";
import SelectPopover from "@/components/create/SelectPopover";
import FeesInputs from "@/components/FeesInputs";
import Skeleton from "@/components/Skeleton";
import ValidatorsInputs from "@/components/ValidatorsInputs";
import { useLoadedAppContext } from "@/contexts/AppContext";
import {
  createCoin,
  generate_bytecode,
  initializeCoinCreation,
} from "@/lib/createCoin";
import {
  BLACKLISTED_WORDS,
  BROWSE_MAX_FILE_SIZE_BYTES,
  createLst,
  setFeesAndValidators,
} from "@/lib/createLst";
import { showSuccessTxnToast } from "@/lib/toasts";
import { cn } from "@/lib/utils";
import { VALIDATOR_METADATA } from "@/lib/validators";

const SUILEND_VALIDATOR_ADDRESS =
  "0xce8e537664ba5d1d5a6a857b17bd142097138706281882be6805e17065ecde89";

const DEFAULT_FEE_CONFIG = {
  mintFeeBps: "0",
  redeemFeeBps: "2",
  spreadFeeBps: "1000",
};
const getDefaultVawConfig = () => ({
  id: uuidv4(),
  validatorAddress: SUILEND_VALIDATOR_ADDRESS,
  weight: "100",
});

export default function CreateCard() {
  const { explorer, suiClient } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { appData, refresh: refreshAppData } = useLoadedAppContext();
  const existingSymbols = Object.values(appData.lstDataMap).reduce(
    (acc, lstData) => [...acc, lstData.token.symbol],
    [] as string[],
  );

  // State
  const [name, setName] = useState<string>("");
  const [symbol, setSymbol] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [iconUrl, setIconUrl] = useState<string>("");
  const [iconFilename, setIconFilename] = useState<string>("");
  const [iconFileSize, setIconFileSize] = useState<string>("");

  const fullName = `${name} Staked SUI`;
  const fullSymbol = `${symbol}SUI`;
  const module_ = snakeCase(fullSymbol);
  const type = module_.toUpperCase();

  // Optional
  const [showOptional, setShowOptional] = useState<boolean>(false);

  // State - fees
  const [feeConfigArgs, setFeeConfigArgs] =
    useState<Record<keyof FeeConfigArgs, string>>(DEFAULT_FEE_CONFIG);

  // State - validators
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

  const [vaw, setVaw] = useState<
    { id: string; validatorAddress: string; weight: string }[]
  >([getDefaultVawConfig()]);

  const onVawChange = (id: string, key: string, value: string) =>
    setVaw((vaw) =>
      vaw.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submit = async () => {
    if (!address) throw new Error("Wallet not connected");

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Name
      if (name === "") throw new Error("Enter a name");
      if (name.length < 1 || name.length > 32)
        throw new Error("Name must be between 1 and 32 characters");

      // Symbol
      if (symbol === "") throw new Error("Enter a symbol");
      if (symbol !== symbol.toLowerCase())
        throw new Error("Symbol must be lowercase");
      if (/\s/.test(symbol)) throw new Error("Symbol cannot contain spaces");
      if (/^\d/.test(symbol))
        throw new Error("Symbol cannot start with a number");
      if (/[^a-z0-9]/.test(symbol))
        throw new Error("Symbol cannot contain special characters");
      if (symbol.length < 1 || symbol.length > 8)
        throw new Error("Symbol must be between 1 and 8 characters");
      if (
        address !== ADMIN_ADDRESS &&
        BLACKLISTED_WORDS.includes(symbol.toLowerCase())
      )
        throw new Error("Symbol cannot be a reserved or blacklisted word");
      if (fullSymbol === fullName)
        throw new Error("Symbol can't be the same as the name"); // Should never happen (different suffixes are added automatically)
      if (existingSymbols.includes(fullSymbol))
        throw new Error("Symbol must be unique among SpringSui LSTs");

      // Description
      if (description.length > 256)
        throw new Error("Description must be 256 characters or less");

      // Icon
      if (iconUrl === "") throw new Error("Upload an icon");

      // Fees
      if (Object.entries(feeConfigArgs).some(([key, value]) => value === ""))
        throw new Error("Enter fees");
      if (
        new BigNumber(
          new BigNumber(feeConfigArgs.mintFeeBps).plus(
            feeConfigArgs.redeemFeeBps,
          ),
        ).lt(2)
      )
        throw new Error(
          "Staking + unstaking fees must add up to at least 2 bps (0.02%)",
        );

      // Validators
      if (vaw.length === 0) throw new Error("Add at least one validator");
      if (vaw.some((row) => row.validatorAddress === "" || row.weight === ""))
        throw new Error("Enter validator address and weight");

      //

      // 0) Prepare
      await initializeCoinCreation();

      // 1) Create coin
      const createCoinResult = await createCoin(
        generate_bytecode(
          module_,
          type,
          fullName,
          fullSymbol,
          description,
          iconUrl,
        ),
        address,
        signExecuteAndWaitForTransaction,
      );

      // 2) Create LST
      const createLstResult = await createLst(
        createCoinResult,
        address,
        signExecuteAndWaitForTransaction,
      );

      // 3) Set fees and validators
      const res = await setFeesAndValidators(
        createCoinResult,
        createLstResult,
        feeConfigArgs,
        vaw,
        suiClient,
        signExecuteAndWaitForTransaction,
      );
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast("Created LST", txUrl);

      // Reset
      setName("");
      setSymbol("");
      setDescription("");

      setIconUrl("");
      setIconFilename("");
      setIconFileSize("");
      (document.getElementById("icon-upload") as HTMLInputElement).value = "";

      setShowOptional(false);

      setFeeConfigArgs(DEFAULT_FEE_CONFIG);
      setVaw([getDefaultVawConfig()]);
    } catch (err) {
      showErrorToast("Failed to create LST", err as Error);
      console.error(err);
    } finally {
      setIsSubmitting(false);
      await refreshAppData();
    }
  };

  return (
    <>
      {/* Details */}
      <Card>
        <div className="flex w-full flex-col gap-4 p-4">
          <p className="text-navy-600">Details</p>

          <div className="flex flex-col gap-4 md:flex-row">
            {/* Name */}
            <div className="flex flex-col gap-2 max-md:w-full md:flex-[2]">
              <p className="text-p2 text-navy-600">Name</p>
              <div className="relative w-full">
                <div className="pointer-events-none absolute right-4 top-1/2 z-[2] -translate-y-1/2 bg-white">
                  <p className="text-p1 text-foreground">Staked SUI</p>
                </div>
                <Input
                  className="relative z-[1]"
                  placeholder="Spring"
                  value={name}
                  onChange={setName}
                />
              </div>
              {name !== "" && (
                <p className="text-p3 text-navy-500">{`"${fullName}"`}</p>
              )}
            </div>

            {/* Symbol */}
            <div className="flex flex-col gap-2 max-md:w-full md:flex-1">
              <p className="text-p2 text-navy-600">Symbol</p>
              <div className="relative w-full">
                <div className="pointer-events-none absolute right-4 top-1/2 z-[2] -translate-y-1/2 bg-white">
                  <p className="text-p1 text-foreground">SUI</p>
                </div>
                <Input
                  className="relative z-[1]"
                  placeholder="s"
                  value={symbol}
                  onChange={setSymbol}
                />
              </div>
              {symbol !== "" && (
                <p className="text-p3 text-navy-500">
                  {`"${fullSymbol}"`} (
                  {existingSymbols.includes(fullSymbol)
                    ? "not unique"
                    : "unique"}
                  )
                </p>
              )}
            </div>
          </div>

          <div className="flex w-full flex-row gap-4">
            <div className="flex flex-col gap-2 max-md:w-full md:flex-1">
              <div className="flex w-full flex-col gap-1">
                <p className="text-p2 text-navy-600">Icon</p>
                <p className="text-p3 text-navy-500">
                  {[
                    "PNG, JPEG, WebP, or SVG.",
                    `Max ${formatNumber(
                      new BigNumber(BROWSE_MAX_FILE_SIZE_BYTES / 1024 / 1024),
                      { dp: 0 },
                    )} MB.`,
                    `128x128 or larger recommended`,
                  ].join(" ")}
                </p>
              </div>
              <IconUpload
                iconUrl={iconUrl}
                setIconUrl={setIconUrl}
                iconFilename={iconFilename}
                setIconFilename={setIconFilename}
                iconFileSize={iconFileSize}
                setIconFileSize={setIconFileSize}
              />
            </div>
          </div>

          <div className="flex w-full flex-row gap-4">
            {/* Validator */}
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
                    onChange={(id) =>
                      onVawChange(vaw[0].id, "validatorAddress", id)
                    }
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
          </div>

          {/* Optional */}
          <button
            className="group flex w-full w-max flex-row items-center gap-2"
            onClick={() => setShowOptional((prev) => !prev)}
          >
            <p
              className={cn(
                "!text-p2 transition-colors",
                showOptional
                  ? "text-foreground"
                  : "text-navy-600 group-hover:text-foreground",
              )}
            >
              Optional
            </p>
            {showOptional ? (
              <ChevronUp className="h-4 w-4 text-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-navy-600 group-hover:text-foreground" />
            )}
          </button>

          {showOptional && (
            <>
              {/* Optional - description */}
              <Card className="shadow-none bg-[transparent]">
                <div className="flex w-full flex-col gap-4 p-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-p2 text-navy-600">Description</p>
                    <Input
                      placeholder="Infinitely liquid staking on Sui"
                      value={description}
                      onChange={setDescription}
                    />
                  </div>
                </div>
              </Card>

              {/* Optional - fees */}
              <Card className="shadow-none bg-[transparent]">
                <div className="flex w-full flex-col gap-4 p-4">
                  <p className="text-navy-600">Fees</p>

                  <FeesInputs
                    feeConfigArgs={feeConfigArgs}
                    setFeeConfigArgs={setFeeConfigArgs}
                  />
                </div>
              </Card>

              {/* Optional - validators */}
              <Card className="shadow-none bg-[transparent]">
                <div className="flex w-full flex-col gap-4 p-4">
                  <div className="flex flex-row items-center gap-2">
                    <p className="text-navy-600">Validators</p>

                    <Link
                      className="block text-navy-500 transition-colors hover:text-foreground"
                      href={explorer
                        .buildAddressUrl("")
                        .replace("account", "validators")}
                      target="_blank"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>

                  <ValidatorsInputs vaw={vaw} setVaw={setVaw} />
                </div>
              </Card>
            </>
          )}
        </div>
      </Card>

      <div className="w-full px-4">
        <Button onClick={submit} isLoading={isSubmitting}>
          Create LST
        </Button>
      </div>
    </>
  );
}
