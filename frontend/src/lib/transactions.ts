import { SuiClient, SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { SUI_DECIMALS, normalizeStructTag } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";

import { LstClient } from "@suilend/springsui-sdk";

import { NORMALIZED_LST_COINTYPE, isSui } from "@/lib/coinType";
import { Token } from "@/lib/types";

export const getTotalGasFee = (res: SuiTransactionBlockResponse) =>
  res.effects
    ? new BigNumber(
        +res.effects.gasUsed.computationCost +
          +res.effects.gasUsed.storageCost -
          +res.effects.gasUsed.storageRebate,
      ).div(10 ** SUI_DECIMALS)
    : new BigNumber(0);

export const getBalanceChange = (
  res: SuiTransactionBlockResponse,
  address: string,
  token: Token,
  multiplier: -1 | 1 = 1,
) => {
  if (!res.balanceChanges) return undefined;

  const balanceChanges = res.balanceChanges.filter(
    (bc) =>
      normalizeStructTag(bc.coinType) === token.coinType &&
      (bc.owner as { AddressOwner: string })?.AddressOwner === address,
  );
  if (balanceChanges.length === 0) return undefined;

  return balanceChanges
    .reduce(
      (acc, balanceChange) => acc.plus(new BigNumber(+balanceChange.amount)),
      new BigNumber(0),
    )
    .div(10 ** token.decimals)
    .plus(isSui(token.coinType) ? getTotalGasFee(res) : 0)
    .times(multiplier);
};

export const mint = (
  lstClient: LstClient,
  transaction: Transaction,
  address: string,
  amount: string,
) => {
  const [sui] = transaction.splitCoins(transaction.gas, [BigInt(amount)]);
  const rSui = lstClient.mint(transaction, sui);
  transaction.transferObjects([rSui], address);
};

export const redeem = async (
  suiClient: SuiClient,
  lstClient: LstClient,
  transaction: Transaction,
  address: string,
  amount: string,
) => {
  const lstCoins = await suiClient.getCoins({
    owner: address,
    coinType: NORMALIZED_LST_COINTYPE,
    limit: 1000,
  });

  if (lstCoins.data.length > 1) {
    transaction.mergeCoins(
      lstCoins.data[0].coinObjectId,
      lstCoins.data.slice(1).map((c) => c.coinObjectId),
    );
  }

  const [lst] = transaction.splitCoins(lstCoins.data[0].coinObjectId, [
    BigInt(amount),
  ]);
  const sui = lstClient.redeemLst(transaction, lst);

  transaction.transferObjects([sui], address);
};
