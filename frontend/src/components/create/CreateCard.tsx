import assert from "assert";

import { useState } from "react";

import { bcs } from "@mysten/bcs";
import {
  update_constants,
  update_identifiers,
} from "@mysten/move-bytecode-template";
import init from "@mysten/move-bytecode-template";
import { Transaction } from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";

import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import {
  FeeConfigArgs,
  LiquidStakingObjectInfo,
  LstClient,
} from "@suilend/springsui-sdk";

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
  const [module, setModule] = useState<string>("");

  const [symbol, setSymbol] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");

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

  const setFees = async (
    lstClient: LstClient,
    weightHookAdminCapId: string,
  ) => {
    // Set fees
    const transaction = new Transaction();

    const feeConfigArgs: FeeConfigArgs = {
      mintFeeBps: 0,
      redeemFeeBps: 2,
      spreadFeeBps: 0,
    };
    lstClient.updateFees(transaction, weightHookAdminCapId, feeConfigArgs);

    const res = await signExecuteAndWaitForTransaction(transaction);
    const txUrl = explorer.buildTxUrl(res.digest);

    showSuccessTxnToast("Created LST", txUrl, {
      description: "Please configure validators on the Admin page",
    });
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

      if (module === "") throw new Error("Missing module");
      if (module.toLowerCase() !== module)
        throw new Error("Module must be lowercase");

      // Step 1: Create the coin
      const { treasuryCapId, coinType } = await createCoin();

      // Step 2: Create the lst
      const { liquidStakingInfoId, weightHookAdminCapId, weightHookId } =
        await createLst(treasuryCapId, coinType);

      // Step 3: Set redeem fee to 2bps
      const LIQUID_STAKING_INFO: LiquidStakingObjectInfo = {
        id: liquidStakingInfoId,
        type: coinType,
        weightHookId: weightHookId,
      };

      const lstClient = await LstClient.initialize(
        suiClient,
        LIQUID_STAKING_INFO,
      );

      await setFees(lstClient, weightHookAdminCapId);
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
    <Card>
      <div className="flex w-full flex-col gap-4 p-4">
        <p className="text-navy-600">Create LST</p>

        <div className="flex w-full flex-row gap-4">
          <div className="flex flex-col gap-1.5 max-md:w-full md:flex-[2]">
            <p className="text-p2 text-navy-600">name</p>
            <Input
              placeholder="Spring Staked SUI"
              value={name}
              onChange={setName}
            />
          </div>
          <div className="flex flex-col gap-1.5 max-md:w-full md:flex-1">
            <p className="text-p2 text-navy-600">symbol</p>
            <Input placeholder="sSUI" value={symbol} onChange={setSymbol} />
          </div>
          <div className="flex flex-col gap-1.5 max-md:w-full md:flex-[3]">
            <p className="text-p2 text-navy-600">description</p>
            <Input
              placeholder="Infinitely liquid staking on Sui"
              value={description}
              onChange={setDescription}
            />
          </div>
        </div>

        <div className="flex w-full flex-row gap-4">
          <div className="flex flex-col gap-1.5 max-md:w-full md:flex-1">
            <p className="text-p2 text-navy-600">image (url or base64)</p>
            <Input value={imageUrl} onChange={setImageUrl} />
          </div>
        </div>

        <div className="flex w-full flex-row gap-4">
          <div className="flex flex-col gap-1.5 max-md:w-full md:flex-[3]">
            <p className="text-p2 text-navy-600">packageId</p>
            <Input placeholder="Random" value="" />
          </div>
          <div className="flex flex-col gap-1.5 max-md:w-full md:flex-1">
            <p className="text-p2 text-navy-600">module</p>
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
          {"coinType: "}
          <span className="text-navy-600">{`<packageId>::<${module || "module"}>::<${module.toUpperCase() || "type"}>`}</span>
        </p>

        <Button onClick={submit} isLoading={isSubmitting} />
      </div>
    </Card>
  );
}
