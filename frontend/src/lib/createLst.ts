import { SuiClient, SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";

import {
  FeeConfigArgs,
  LiquidStakingObjectInfo,
  LstClient,
} from "@suilend/springsui-sdk";
import { formatNumber } from "@suilend/sui-fe";
import { WalletContext } from "@suilend/sui-fe-next";

import { CreateCoinResult } from "@/lib/createCoin";

export const BLACKLISTED_WORDS = [
  // Sui
  "sui",
  "suilend",
  "springsui",
  "steamm",
  "root",
  "rootlet",
  "rootlets",
  "send",

  // Test
  "test",
  "temp",
  "dummy",

  // Brands
  "bnb",
  "bn",
  "okx",
  "coin",
  "coinbase",
  "p",
  "bp",
  "cb",
  "bb",

  // Inappropriate
  "anal",
  "anus",
  "ass",
  "asshole",
  "bitch",
  "bitching",
  "boob",
  "boobs",
  "butt",
  "butthole",
  "butts",
  "cheat",
  "cheater",
  "cock",
  "cockhead",
  "cocaine",
  "crack",
  "cracker",
  "cunt",
  "cunty",
  "cum",
  "cumshot",
  "death",
  "dead",
  "die",
  "dick",
  "dickhead",
  "drug",
  "drugs",
  "fake",
  "fraud",
  "fuck",
  "fucker",
  "fucking",
  "hack",
  "hacker",
  "hate",
  "heroin",
  "hitler",
  "hax",
  "haxor",
  "jizz",
  "kill",
  "meth",
  "naked",
  "nazi",
  "nude",
  "nudes",
  "pedo",
  "pedophile",
  "penis",
  "pirate",
  "piracy",
  "porn",
  "porno",
  "pussy",
  "pussycat",
  "racism",
  "racist",
  "scam",
  "scammer",
  "sex",
  "sexism",
  "sexist",
  "shit",
  "shitter",
  "shitting",
  "slut",
  "slutty",
  "sperm",
  "steal",
  "terror",
  "terrorist",
  "thief",
  "thieves",
  "tit",
  "tits",
  "vagina",
  "weed",
  "whore",
  "whoring",
  "xxx",
];

export const BROWSE_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const BROWSE_FILE_SIZE_ERROR_MESSAGE = `Please upload an image smaller than ${formatNumber(new BigNumber(BROWSE_MAX_FILE_SIZE_BYTES / 1024 / 1024), { dp: 0 })} MB`;

export type CreateLstResult = {
  result: {
    liquidStakingInfoId: string;
    weightHookAdminCapId: string;
    weightHookId: string;
  };
  res: SuiTransactionBlockResponse;
};
export const createLst = async (
  createCoinResult: CreateCoinResult,
  address: string,
  signExecuteAndWaitForTransaction: WalletContext["signExecuteAndWaitForTransaction"],
): Promise<CreateLstResult> => {
  console.log("[createLst] Creating LST");

  const transaction = new Transaction();

  // Create lst
  const weightHookAdminCap = LstClient.createNewLst(
    transaction,
    createCoinResult.treasuryCapId,
    createCoinResult.coinType,
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
  if (!liquidStakingInfoObjectChange)
    throw new Error("LiquidStakingInfo object change not found");
  if (liquidStakingInfoObjectChange.type !== "created")
    throw new Error("LiquidStakingInfo object change is not of type 'created'");

  // Get WeightHookAdminCap id from transaction
  const weightHookAdminCapObjectChange = res.objectChanges?.find(
    (change) =>
      change.type === "created" &&
      change.objectType.includes(":WeightHookAdminCap<"),
  );
  if (!weightHookAdminCapObjectChange)
    throw new Error("WeightHookAdminCap object change not found");
  if (weightHookAdminCapObjectChange.type !== "created")
    throw new Error(
      "WeightHookAdminCap object change is not of type 'created'",
    );

  // Get WeightHook id from transaction
  const weightHookObjectChange = res.objectChanges?.find(
    (change) =>
      change.type === "created" && change.objectType.includes(":WeightHook<"),
  );
  if (!weightHookObjectChange)
    throw new Error("WeightHook object change not found");
  if (weightHookObjectChange.type !== "created")
    throw new Error("WeightHook object change is not of type 'created'");

  const liquidStakingInfoId = liquidStakingInfoObjectChange.objectId;
  const weightHookAdminCapId = weightHookAdminCapObjectChange.objectId;
  const weightHookId = weightHookObjectChange.objectId;

  console.log(
    "liquidStakingInfoId:",
    liquidStakingInfoId,
    "weightHookAdminCapId:",
    weightHookAdminCapId,
    "weightHookId:",
    weightHookId,
  );

  return {
    result: { liquidStakingInfoId, weightHookAdminCapId, weightHookId },
    res,
  };
};

export const setFeesAndValidators = async (
  createCoinResult: CreateCoinResult,
  lstCreateResult: CreateLstResult,
  feeConfigArgs: Record<keyof FeeConfigArgs, string>,
  vaw: { id: string; validatorAddress: string; weight: string }[],
  suiClient: SuiClient,
  signExecuteAndWaitForTransaction: WalletContext["signExecuteAndWaitForTransaction"],
): Promise<SuiTransactionBlockResponse> => {
  const transaction = new Transaction();

  const LIQUID_STAKING_INFO: LiquidStakingObjectInfo = {
    id: lstCreateResult.result.liquidStakingInfoId,
    type: createCoinResult.coinType,
    weightHookId: lstCreateResult.result.weightHookId,
  };
  const lstClient = await LstClient.initialize(suiClient, LIQUID_STAKING_INFO);

  // Set fees
  lstClient.updateFees(
    transaction,
    lstCreateResult.result.weightHookAdminCapId,
    Object.entries(feeConfigArgs).reduce(
      (acc, [key, value]) => ({ ...acc, [key]: +value }),
      {},
    ),
  );

  // Set validators
  lstClient.setValidatorAddressesAndWeights(
    transaction,
    lstCreateResult.result.weightHookId,
    lstCreateResult.result.weightHookAdminCapId,
    vaw.reduce(
      (acc, row) => ({ ...acc, [row.validatorAddress]: +row.weight }),
      {},
    ),
  );

  return signExecuteAndWaitForTransaction(transaction);
};
