import { useEffect, useRef, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import { snakeCase } from "lodash";

import Card from "@/components/Card";
import Button from "@/components/create-admin/Button";
import DescriptionInput from "@/components/create-admin/DescriptionInput";
import IconUrllInput from "@/components/create-admin/IconUrllInput";
import NameInput from "@/components/create-admin/NameInput";
import SymbolInput from "@/components/create-admin/SymbolInput";
import { useLoadedLstContext } from "@/contexts/LstContext";

export default function UpdateMetadataCard() {
  const { admin } = useLoadedLstContext();

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

  const prevLstCoinTypeRef = useRef<string>(admin.lstCoinType);
  useEffect(() => {
    if (admin.lstCoinType === prevLstCoinTypeRef.current) return;
    prevLstCoinTypeRef.current = admin.lstCoinType;

    setName("");
    setSymbol("");
    setDescription("");

    setIconUrl("");
    setIconFilename("");
    setIconFileSize("");
  }, [admin.lstCoinType]);

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submit = async () => {
    if (!admin.weightHookAdminCapId)
      throw new Error("Error: No weight hook admin cap");

    if (isSubmitting) return;
    setIsSubmitting(true);

    const transaction = new Transaction();

    try {
    } catch (err) {}
  };

  return (
    <Card>
      <div className="flex w-full flex-col gap-4 p-4">
        <p className="text-navy-600">CoinMetadata</p>

        <div className="flex flex-col gap-4 md:flex-row">
          {/* Name */}
          <NameInput name={name} setName={setName} fullName={fullName} />

          {/* Symbol */}
          <SymbolInput
            symbol={symbol}
            setSymbol={setSymbol}
            fullSymbol={fullSymbol}
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
