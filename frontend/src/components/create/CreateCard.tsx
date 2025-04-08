import assert from "assert";

import { useState } from "react";

import { bcs } from "@mysten/bcs";
import {
  update_constants,
  update_identifiers,
} from "@mysten/move-bytecode-template";
import init from "@mysten/move-bytecode-template";
import { SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";
import { Minus } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { v4 as uuidv4 } from "uuid";

import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import { FeeConfigArgs } from "@suilend/springsui-sdk";
import { LiquidStakingObjectInfo, LstClient } from "@suilend/springsui-sdk";

import Button from "@/components/admin/Button";
import Input from "@/components/admin/Input";
import Card from "@/components/Card";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useLoadedLstContext } from "@/contexts/LstContext";
import { showSuccessTxnToast } from "@/lib/toasts";

function generate_bytecode(
  module: string,
  type: string,
  name: string,
  symbol: string,
  description: string,
  imageUrl: string,
) {
  const bytecode = Buffer.from(
    "oRzrCwYAAAAKAQAMAgweAyonBFEIBVlMB6UBywEI8AJgBtADXQqtBAUMsgQoABABCwIGAhECEgITAAICAAEBBwEAAAIADAEAAQIDDAEAAQQEAgAFBQcAAAkAAQABDwUGAQACBwgJAQIDDAUBAQwDDQ0BAQwEDgoLAAUKAwQAAQQCBwQMAwICCAAHCAQAAQsCAQgAAQoCAQgFAQkAAQsBAQkAAQgABwkAAgoCCgIKAgsBAQgFBwgEAgsDAQkACwIBCQABBggEAQUBCwMBCAACCQAFDENvaW5NZXRhZGF0YQZPcHRpb24IVEVNUExBVEULVHJlYXN1cnlDYXAJVHhDb250ZXh0A1VybARjb2luD2NyZWF0ZV9jdXJyZW5jeQtkdW1teV9maWVsZARpbml0FW5ld191bnNhZmVfZnJvbV9ieXRlcwZvcHRpb24TcHVibGljX3NoYXJlX29iamVjdA9wdWJsaWNfdHJhbnNmZXIGc2VuZGVyBHNvbWUIdGVtcGxhdGUIdHJhbnNmZXIKdHhfY29udGV4dAN1cmwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAICAQkKAgUEVE1QTAoCDg1UZW1wbGF0ZSBDb2luCgIaGVRlbXBsYXRlIENvaW4gRGVzY3JpcHRpb24KAiEgaHR0cHM6Ly9leGFtcGxlLmNvbS90ZW1wbGF0ZS5wbmcAAgEIAQAAAAACEgsABwAHAQcCBwMHBBEGOAAKATgBDAILAS4RBTgCCwI4AwIA=",
    "base64",
  );

  let updated = update_identifiers(bytecode, {
    TEMPLATE: type,
    template: module,
  });

  updated = update_constants(
    updated,
    bcs.string().serialize(symbol).toBytes(),
    bcs.string().serialize("TMPL").toBytes(),
    "Vector(U8)", // type of the constant
  );

  updated = update_constants(
    updated,
    bcs.string().serialize(name).toBytes(), // new value
    bcs.string().serialize("Template Coin").toBytes(), // current value
    "Vector(U8)", // type of the constant
  );

  updated = update_constants(
    updated,
    bcs.string().serialize(description).toBytes(), // new value
    bcs.string().serialize("Template Coin Description").toBytes(), // current value
    "Vector(U8)", // type of the constant
  );

  updated = update_constants(
    updated,
    bcs.string().serialize(imageUrl).toBytes(), // new value
    bcs.string().serialize("https://example.com/template.png").toBytes(), // current value
    "Vector(U8)", // type of the constant
  );

  return updated;
}

const feeNameMap: Record<keyof FeeConfigArgs, string> = {
  mintFeeBps: "Staking fee",
  redeemFeeBps: "Unstaking fee",
  spreadFeeBps: "Performance fee",
};

export default function CreateCard() {
  const { explorer, suiClient } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { appData, refresh: refreshAppData } = useLoadedAppContext();
  const { refresh: refreshLstData } = useLoadedLstContext();

  const existingSymbols = Object.values(appData.lstDataMap).reduce(
    (acc, lstData) => [...acc, lstData.token.symbol],
    [] as string[],
  );

  // State
  const [name, setName] = useState<string>("");
  const [symbol, setSymbol] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [module, setModule] = useState<string>("");

  // State - fees
  const [feeConfigArgs, setFeeConfigArgs] = useState<
    Record<keyof FeeConfigArgs, string>
  >({ mintFeeBps: "", redeemFeeBps: "", spreadFeeBps: "" });

  // State - validators
  const [vaw, setVaw] = useState<
    { id: string; validatorAddress: string; weight: string }[]
  >([{ id: uuidv4(), validatorAddress: "", weight: "" }]);

  const onVawChange = (id: string, key: string, value: string) =>
    setVaw((vaw) =>
      vaw.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );

  const removeVawRow = (id: string) =>
    setVaw((vaw) => vaw.filter((row) => row.id !== id));

  const addVawRow = () => {
    const rowId = uuidv4();
    setVaw((vaw) => [...vaw, { id: rowId, validatorAddress: "", weight: "" }]);

    setTimeout(() => {
      document.getElementById(`validator-address-${rowId}`)?.focus();
    });
  };

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const createCoin = async () => {
    await init();

    const bytecode = generate_bytecode(
      module,
      module.toUpperCase(),
      name,
      symbol,
      description,
      imageUrl,
    );

    // Create coin
    const transaction = new Transaction();

    const [upgradeCap] = transaction.publish({
      modules: [[...bytecode]],
      dependencies: [normalizeSuiAddress("0x1"), normalizeSuiAddress("0x2")],
    });
    transaction.transferObjects(
      [upgradeCap],
      transaction.pure.address(address!),
    );

    const res = await signExecuteAndWaitForTransaction(transaction);

    // Get TreasuryCap id from transaction
    const treasuryCapObjectChange = res.objectChanges?.find(
      (change) =>
        change.type === "created" && change.objectType.includes("TreasuryCap"),
    );
    assert(treasuryCapObjectChange?.type === "created");

    const treasuryCapId = treasuryCapObjectChange?.objectId;
    console.log("treasuryCapId:", treasuryCapId);

    const coinType = treasuryCapObjectChange?.objectType
      .split("<")[1]
      .split(">")[0];
    console.log("coinType:", coinType);

    return { treasuryCapId, coinType };
  };

  const createLst = async (treasuryCapId: string, coinType: string) => {
    const transaction = new Transaction();

    // Create lst
    const weightHookAdminCap = LstClient.createNewLst(
      transaction,
      treasuryCapId,
      coinType,
    );
    transaction.transferObjects(
      [transaction.object(weightHookAdminCap)],
      transaction.pure.address(address!),
    );

    const res = await signExecuteAndWaitForTransaction(transaction);

    // Get LiquidStakingInfo id from transaction
    const liquidStakingInfoObjectChange = res.objectChanges?.find(
      (change) =>
        change.type === "created" &&
        change.objectType.includes(":LiquidStakingInfo<"),
    );
    assert(liquidStakingInfoObjectChange?.type === "created");

    const liquidStakingInfoId = liquidStakingInfoObjectChange?.objectId;
    console.log("liquidStakingInfoId:", liquidStakingInfoId);

    // Get WeightHookAdminCap id from transaction
    const weightHookAdminCapObjectChange = res.objectChanges?.find(
      (change) =>
        change.type === "created" &&
        change.objectType.includes(":WeightHookAdminCap<"),
    );
    assert(weightHookAdminCapObjectChange?.type === "created");

    const weightHookAdminCapId = weightHookAdminCapObjectChange?.objectId;
    console.log("weightHookAdminCapId:", weightHookAdminCapId);

    // Get WeightHook id from transaction
    const weightHookObjectChange = res.objectChanges?.find(
      (change) =>
        change.type === "created" && change.objectType.includes(":WeightHook<"),
    );
    assert(weightHookObjectChange?.type === "created");

    const weightHookId = weightHookObjectChange?.objectId;
    console.log("weightHookId:", weightHookId);

    return { liquidStakingInfoId, weightHookAdminCapId, weightHookId };
  };

  const setFeesAndValidators = async (
    lstClient: LstClient,
    weightHookAdminCapId: string,
  ): Promise<SuiTransactionBlockResponse> => {
    const transaction = new Transaction();

    // Set fees
    lstClient.updateFees(
      transaction,
      weightHookAdminCapId,
      Object.entries(feeConfigArgs).reduce(
        (acc, [key, value]) => ({ ...acc, [key]: +value }),
        {},
      ),
    );

    // Set validators
    lstClient.setValidatorAddressesAndWeights(
      transaction,
      lstClient.liquidStakingObject.weightHookId,
      weightHookAdminCapId,
      vaw.reduce(
        (acc, row) => ({ ...acc, [row.validatorAddress]: +row.weight }),
        {},
      ),
    );

    return signExecuteAndWaitForTransaction(transaction);
  };

  const submit = async () => {
    if (!address) throw new Error("Wallet not connected");

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (name === "") throw new Error("Missing name");
      if (symbol === "") throw new Error("Missing symbol");
      if (name === symbol)
        throw new Error("Name and symbol cannot be the same");
      if (existingSymbols.includes(symbol))
        throw new Error("Symbol already taken");

      if (description === "") throw new Error("Missing description");
      if (imageUrl === "") throw new Error("Missing image");

      if (module === "") throw new Error("Missing module");
      if (module.toLowerCase() !== module)
        throw new Error("Module must be lowercase");

      if (Object.entries(feeConfigArgs).some(([key, value]) => value === ""))
        throw new Error("Missing fees");
      if (new BigNumber(feeConfigArgs.redeemFeeBps).lt(2))
        throw new Error("Redeem fee must be at least 2 bps (0.02%)");

      if (vaw.length === 0) throw new Error("Add at least one validator");
      if (vaw.some((row) => row.validatorAddress === "" || row.weight === ""))
        throw new Error("Missing validator address or weight");

      // Step 1: Create the coin
      const { treasuryCapId, coinType } = await createCoin();

      // Step 2: Create the lst
      const { liquidStakingInfoId, weightHookAdminCapId, weightHookId } =
        await createLst(treasuryCapId, coinType);

      // Step 3: Set fees and validators
      const LIQUID_STAKING_INFO: LiquidStakingObjectInfo = {
        id: liquidStakingInfoId,
        type: coinType,
        weightHookId: weightHookId,
      };

      const lstClient = await LstClient.initialize(
        suiClient,
        LIQUID_STAKING_INFO,
      );

      const res = await setFeesAndValidators(lstClient, weightHookAdminCapId);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast("Created LST", txUrl);

      // Reset
      setName("");
      setSymbol("");
      setDescription("");
      setImageUrl("");
      setModule("");

      setFeeConfigArgs({ mintFeeBps: "", redeemFeeBps: "", spreadFeeBps: "" });
      setVaw([{ id: uuidv4(), validatorAddress: "", weight: "" }]);
    } catch (err) {
      showErrorToast("Failed to create LST", err as Error);
      console.error(err);
    } finally {
      setIsSubmitting(false);
      refreshAppData();
      refreshLstData();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full px-4">
        <p className="text-h3 text-navy-800">Create LST</p>
      </div>

      {/* Details */}
      <Card>
        <div className="flex w-full flex-col gap-4 p-4">
          <p className="text-navy-600">Details</p>

          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex flex-col gap-1.5 max-md:w-full md:flex-[2]">
              <p className="text-p2 text-navy-600">
                Name <span className="text-error">*</span>
              </p>
              <Input
                placeholder="Spring Staked SUI"
                value={name}
                onChange={setName}
              />
              <p className="text-p3 text-navy-500">
                Cannot be the same as symbol
              </p>
            </div>
            <div className="flex flex-col gap-1.5 max-md:w-full md:flex-1">
              <p className="text-p2 text-navy-600">
                Symbol <span className="text-error">*</span>
              </p>
              <Input placeholder="sSUI" value={symbol} onChange={setSymbol} />
              <p className="text-p3 text-navy-500">Must be unique</p>
            </div>
            <div className="flex flex-col gap-1.5 max-md:w-full md:flex-[3]">
              <p className="text-p2 text-navy-600">
                Description <span className="text-error">*</span>
              </p>
              <Input
                placeholder="Infinitely liquid staking on Sui"
                value={description}
                onChange={setDescription}
              />
            </div>
          </div>

          <div className="flex w-full flex-row gap-4">
            <div className="flex flex-col gap-1.5 max-md:w-full md:flex-1">
              <p className="text-p2 text-navy-600">
                Image (URL or base64) <span className="text-error">*</span>
              </p>
              <Input value={imageUrl} onChange={setImageUrl} />
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex flex-col gap-1.5 max-md:w-full md:flex-[3]">
              <p className="text-p2 text-navy-600">packageId</p>
              <Input placeholder="Generated" value="" />
            </div>
            <div className="flex flex-col gap-1.5 max-md:w-full md:flex-1">
              <p className="text-p2 text-navy-600">
                module <span className="text-error">*</span>
              </p>
              <Input
                placeholder="spring_sui"
                value={module}
                onChange={setModule}
              />
            </div>
            <div className="flex flex-col gap-1.5 max-md:w-full md:flex-1">
              <p className="text-p2 text-navy-600">type</p>
              <Input
                placeholder={"spring_sui".toUpperCase()}
                value={module.toUpperCase()}
              />
            </div>
          </div>

          <p className="text-p2 text-navy-500">
            {"Your LST's coin type will be "}
            <span className="font-[monospace] text-navy-600">{`<packageId>::${module || "<module>"}::${module.toUpperCase() || "<type>"}`}</span>
          </p>
        </div>
      </Card>

      {/* Fees */}
      <Card>
        <div className="flex w-full flex-col gap-4 p-4">
          <p className="text-navy-600">Fees</p>

          <div className="flex flex-col gap-4 md:flex-row">
            {Object.keys(feeConfigArgs).map((key) => (
              <div
                key={key}
                className="flex flex-col gap-1.5 max-md:w-full md:flex-1"
              >
                <p className="text-p2 text-navy-600">
                  {feeNameMap[key as keyof FeeConfigArgs]}{" "}
                  <span className="text-error">*</span>
                </p>
                <Input
                  type="number"
                  value={feeConfigArgs[key as keyof FeeConfigArgs] ?? ""}
                  onChange={(value) =>
                    setFeeConfigArgs((fc) => ({ ...fc, [key]: value }))
                  }
                />
                {key === "mintFeeBps" && (
                  <p className="text-p3 text-navy-500">
                    Recommended to use 0 bps (0%)
                  </p>
                )}
                {key === "redeemFeeBps" && (
                  <p className="text-p3 text-navy-500">Min. 2 bps (0.02%)</p>
                )}
                {key === "spreadFeeBps" && (
                  <p className="text-p3 text-navy-500">
                    E.g. 10% fee = 1000 bps
                  </p>
                )}{" "}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Validators */}
      <Card>
        <div className="flex w-full flex-col gap-4 p-4">
          <p className="text-navy-600">Validators</p>

          <div className="flex flex-col gap-4">
            {vaw.map((row, index) => (
              <div key={row.id} className="flex flex-row gap-4">
                {/* Address */}
                <div className="flex flex-1 flex-col gap-1.5">
                  {index === 0 && (
                    <p className="text-p2 text-navy-600">
                      Address <span className="text-error">*</span>
                    </p>
                  )}
                  <TextareaAutosize
                    id={`validator-address-${row.id}`}
                    className="min-h-10 w-full rounded-sm bg-white px-4 py-2 font-sans text-p1 text-foreground placeholder:text-navy-500 focus-within:shadow-[inset_0_0_0_1px_hsl(var(--blue))] focus-visible:outline-none"
                    value={row.validatorAddress}
                    onChange={(e) =>
                      onVawChange(row.id, "validatorAddress", e.target.value)
                    }
                    minRows={1}
                  />
                </div>

                {/* Weight */}
                <div className="flex w-[125px] flex-col gap-1.5">
                  {index === 0 && (
                    <p className="text-p2 text-navy-600">
                      Weight (0–100%) <span className="text-error">*</span>
                    </p>
                  )}
                  <Input
                    type="number"
                    value={row.weight}
                    onChange={(value) => onVawChange(row.id, "weight", value)}
                  />
                  {index === vaw.length - 1 && (
                    <p className="text-p3 text-navy-500">Must add up to 100%</p>
                  )}
                </div>

                {/* Remove */}
                <div className="flex flex-col gap-1.5">
                  {index === 0 && <p className="text-p2 opacity-0">-</p>}
                  <Button
                    className="w-10"
                    isDisabled={vaw.length < 2}
                    onClick={() => removeVawRow(row.id)}
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}

            <Button className="mr-14 w-auto" onClick={addVawRow}>
              Add row
            </Button>
          </div>
        </div>
      </Card>

      <div className="w-full px-4">
        <Button onClick={submit} isLoading={isSubmitting}>
          Create LST
        </Button>
      </div>
    </div>
  );
}
