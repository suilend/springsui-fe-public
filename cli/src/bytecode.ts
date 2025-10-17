import assert from "assert";

import { bcs } from "@mysten/bcs";
import {
  update_constants,
  update_identifiers,
} from "@mysten/move-bytecode-template";
import init from "@mysten/move-bytecode-template";
import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { fromBase64, normalizeSuiAddress } from "@mysten/sui/utils";

import { LstClient } from "@suilend/springsui-sdk";
// import url from "@mysten/move-bytecode-template/move_bytecode_template_bg.wasm?url";

const keypair = Ed25519Keypair.fromSecretKey(
  fromBase64(process.env.SUI_SECRET_KEY!),
);

function generate_bytecode(
  lst_type: string, // eg K_SUI
  module_name: string, // eg ksui
  symbol: string, // eg sSUI
  name: string, // eg Spring SUI
  description: string, // eg Spring SUI is a liquid staking protocol on Sui
  img_url: string,
) {
  const bytecode = Buffer.from(
    "oRzrCwYAAAAKAQAMAgweAyonBFEIBVlMB6UBywEI8AJgBtADXQqtBAUMsgQoABABCwIGAhECEgITAAICAAEBBwEAAAIADAEAAQIDDAEAAQQEAgAFBQcAAAkAAQABDwUGAQACBwgJAQIDDAUBAQwDDQ0BAQwEDgoLAAUKAwQAAQQCBwQMAwICCAAHCAQAAQsCAQgAAQoCAQgFAQkAAQsBAQkAAQgABwkAAgoCCgIKAgsBAQgFBwgEAgsDAQkACwIBCQABBggEAQUBCwMBCAACCQAFDENvaW5NZXRhZGF0YQZPcHRpb24IVEVNUExBVEULVHJlYXN1cnlDYXAJVHhDb250ZXh0A1VybARjb2luD2NyZWF0ZV9jdXJyZW5jeQtkdW1teV9maWVsZARpbml0FW5ld191bnNhZmVfZnJvbV9ieXRlcwZvcHRpb24TcHVibGljX3NoYXJlX29iamVjdA9wdWJsaWNfdHJhbnNmZXIGc2VuZGVyBHNvbWUIdGVtcGxhdGUIdHJhbnNmZXIKdHhfY29udGV4dAN1cmwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAICAQkKAgUEVE1QTAoCDg1UZW1wbGF0ZSBDb2luCgIaGVRlbXBsYXRlIENvaW4gRGVzY3JpcHRpb24KAiEgaHR0cHM6Ly9leGFtcGxlLmNvbS90ZW1wbGF0ZS5wbmcAAgEIAQAAAAACEgsABwAHAQcCBwMHBBEGOAAKATgBDAILAS4RBTgCCwI4AwIA=",
    "base64",
  );

  let updated = update_identifiers(bytecode, {
    TEMPLATE: lst_type,
    template: module_name,
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
    bcs.string().serialize(img_url).toBytes(), // new value
    bcs.string().serialize("https://example.com/template.png").toBytes(), // current value
    "Vector(U8)", // type of the constant
  );

  return updated;
}

async function main() {
  const client = new SuiClient({ url: "https://fullnode.mainnet.sui.io" });
  console.log("asdf");
  await init();

  const bytecode = generate_bytecode(
    "RIPLEYS_SUI",
    "ripleys_sui",
    "rSui",
    "Ripleys Staked Sui",
    "Ripleys Staked Sui is a liquid staking protocol on Sui",
    "https://example.com/ripleys.png",
  );

  // Step 1: Create the coin
  const tx = new Transaction();
  const [upgradeCap] = tx.publish({
    modules: [[...bytecode]],
    dependencies: [normalizeSuiAddress("0x1"), normalizeSuiAddress("0x2")],
  });

  tx.transferObjects([upgradeCap], tx.pure.address(keypair.toSuiAddress()));

  const txResponse = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log(txResponse);
  // Step 2: Get the treasury Cap id from the transaction
  const treasuryCapObjectChange = txResponse.objectChanges?.find(
    (change) =>
      change.type === "created" && change.objectType.includes("TreasuryCap"),
  );
  assert(treasuryCapObjectChange?.type === "created");

  const treasuryCapId = treasuryCapObjectChange?.objectId;
  const coinType = treasuryCapObjectChange?.objectType
    .split("<")[1]
    .split(">")[0];

  console.log(coinType);
  console.log(treasuryCapId);

  // wait until the sui rpc recognizes the treasuryCapId
  while (true) {
    const object = await client.getObject({ id: treasuryCapId });
    if (object.error) {
      console.log("waiting for sui rpc to recognize the treasuryCapId");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } else {
      break;
    }
  }

  // Step 3: Create the lst
  const tx2 = new Transaction();
  const weightHookAdminCap = LstClient.createNewLst(
    tx2,
    treasuryCapId,
    coinType,
  );

  tx2.transferObjects([tx2.object(weightHookAdminCap)], keypair.toSuiAddress());

  const txResponse2 = await client.signAndExecuteTransaction({
    transaction: tx2,
    signer: keypair,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log(txResponse2);
}

main();
