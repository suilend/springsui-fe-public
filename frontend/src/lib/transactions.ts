import { Transaction } from "@mysten/sui/transactions";

import { LstClient } from "@suilend/springsui-sdk";

export const convertLsts = (
  inLstClient: LstClient,
  outLstClient: LstClient,
  transaction: Transaction,
  address: string,
  amount: string,
) => {
  const suiCoin = inLstClient.redeemAmount(transaction, address, amount);
  const lstCoin = outLstClient.mint(transaction, suiCoin);

  outLstClient.rebalance(
    transaction,
    outLstClient.liquidStakingObject.weightHookId,
  );

  return lstCoin;
};

export const convertLstsAndSendToUser = (
  inLstClient: LstClient,
  outLstClient: LstClient,
  transaction: Transaction,
  address: string,
  amount: string,
) => {
  const lstCoin = convertLsts(
    inLstClient,
    outLstClient,
    transaction,
    address,
    amount,
  );
  transaction.transferObjects([lstCoin], address);
};
