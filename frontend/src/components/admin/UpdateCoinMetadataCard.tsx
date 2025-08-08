import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import { snakeCase } from "lodash";
import { ExternalLink } from "lucide-react";

import { ADMIN_ADDRESS } from "@suilend/springsui-sdk";
import { PUBLISHED_AT } from "@suilend/springsui-sdk/_generated/liquid_staking";
import {
  BLACKLISTED_WORDS,
  removeCoinMetadataFromIndexedDB,
} from "@suilend/sui-fe";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";

import Card from "@/components/Card";
import Button from "@/components/create-admin/Button";
import DescriptionInput from "@/components/create-admin/DescriptionInput";
import IconUrllInput from "@/components/create-admin/IconUrllInput";
import NameInput from "@/components/create-admin/NameInput";
import SymbolInput from "@/components/create-admin/SymbolInput";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useLoadedLstContext } from "@/contexts/LstContext";
import { useUserContext } from "@/contexts/UserContext";
import { showSuccessTxnToast } from "@/lib/toasts";

export default function UpdateCoinMetadataCard() {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { appData } = useLoadedAppContext();
  const { refresh } = useUserContext();
  const { admin } = useLoadedLstContext();

  const existingSymbols = Object.values(appData.lstDataMap).reduce(
    (acc, lstData) => [...acc, lstData.token.symbol],
    [] as string[],
  );

  // State
  const [name, setName] = useState<string>(
    admin.lstData.token.name.slice(0, -1 * " Staked SUI".length),
  );
  const [symbol, setSymbol] = useState<string>(
    (admin.lstData.token.raw?.symbol ?? admin.lstData.token.symbol).slice(
      0,
      -1 * "SUI".length,
    ),
  );
  const [description, setDescription] = useState<string>(
    admin.lstData.token.description,
  );

  const [iconUrl, setIconUrl] = useState<string>(
    admin.lstData.token.raw?.iconUrl ?? admin.lstData.token.iconUrl ?? "",
  );
  const [iconFilename, setIconFilename] = useState<string>("");
  const [iconFileSize, setIconFileSize] = useState<string>("");

  const fullName = `${name} Staked SUI`;
  const fullSymbol = `${symbol}SUI`;
  const module_ = snakeCase(fullSymbol);
  const type = module_.toUpperCase();

  const prevLstCoinTypeRef = useRef<string>(admin.lstCoinType);
  useEffect(() => {
    if (admin.lstCoinType === prevLstCoinTypeRef.current) return;
    prevLstCoinTypeRef.current = admin.lstCoinType;

    setName(admin.lstData.token.name.slice(0, -1 * " Staked SUI".length));
    setSymbol(
      (admin.lstData.token.raw?.symbol ?? admin.lstData.token.symbol).slice(
        0,
        -1 * "SUI".length,
      ),
    );
    setDescription(admin.lstData.token.description);

    setIconUrl(
      admin.lstData.token.raw?.iconUrl ?? admin.lstData.token.iconUrl ?? "",
    );
    setIconFilename("");
    setIconFileSize("");
  }, [
    admin.lstCoinType,
    admin.lstData.token.name,
    admin.lstData.token.raw?.symbol,
    admin.lstData.token.symbol,
    admin.lstData.token.description,
    admin.lstData.token.raw?.iconUrl,
    admin.lstData.token.iconUrl,
  ]);

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submit = async () => {
    if (!admin.weightHookAdminCapId)
      throw new Error("Error: No weight hook admin cap");
    if (!admin.lstData.token.id) throw new Error("Missing coinMetadata id");

    if (isSubmitting) return;
    setIsSubmitting(true);

    const transaction = new Transaction();

    try {
      // Name
      if (name === "") throw new Error("Enter a name");
      if (name.length < 1 || name.length > 64)
        throw new Error("Name must be between 1 and 64 characters");

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
      if (
        existingSymbols.includes(fullSymbol) &&
        fullSymbol !== admin.lstData.token.symbol
      )
        throw new Error("Symbol must be unique among SpringSui LSTs");

      // Description
      if (description.length > 256)
        throw new Error("Description must be 256 characters or less");

      // Icon
      if (iconUrl === "") throw new Error("Upload an icon");

      //

      transaction.moveCall({
        target: `${PUBLISHED_AT}::weight::update_metadata`,
        typeArguments: [admin.lstData.lstInfo.LIQUID_STAKING_INFO.type],
        arguments: [
          transaction.object(
            admin.lstData.lstInfo.LIQUID_STAKING_INFO.weightHookId,
          ),
          transaction.object(admin.weightHookAdminCapId),
          transaction.object(admin.lstData.lstInfo.liquidStakingInfo.id),
          transaction.object(admin.lstData.token.id),
          transaction.pure.option("string", fullName),
          transaction.pure.option("string", fullSymbol),
          transaction.pure.option("string", description),
          transaction.pure.option("string", iconUrl),
        ],
      });

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast("Updated metadata", txUrl);

      // Patch
      await removeCoinMetadataFromIndexedDB([admin.lstCoinType]);
    } catch (err) {
      showErrorToast("Failed to update metadata", err as Error);
      console.error(err);
    } finally {
      setIsSubmitting(false);
      refresh();
    }
  };

  return (
    <Card>
      <div className="flex w-full flex-col gap-4 p-4">
        <div className="flex flex-row items-center gap-2">
          <p className="text-navy-600">Coin Metadata</p>

          <Link
            className="block text-navy-500 transition-colors hover:text-foreground"
            href={explorer.buildCoinUrl(admin.lstCoinType)}
            target="_blank"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          {/* Name */}
          <NameInput name={name} setName={setName} fullName={fullName} />

          {/* Symbol */}
          <SymbolInput
            symbol={symbol}
            setSymbol={setSymbol}
            fullSymbol={fullSymbol}
            isUpdate
          />
        </div>

        {/* Description */}
        <DescriptionInput
          description={description}
          setDescription={setDescription}
        />

        {/* IconUrl */}
        <IconUrllInput
          iconUrl={iconUrl}
          setIconUrl={setIconUrl}
          iconFilename={iconFilename}
          setIconFilename={setIconFilename}
          iconFileSize={iconFileSize}
          setIconFileSize={setIconFileSize}
        />

        <Button
          onClick={submit}
          isLoading={isSubmitting}
          isDisabled={!admin.weightHookAdminCapId}
        >
          Update
        </Button>
      </div>
    </Card>
  );
}
