import { Transaction } from "@mysten/sui/transactions";

import { LstClient } from "../client";

export const convertLstsAndRebalance = (
  inLstClient: LstClient,
  outLstClient: LstClient,
  transaction: Transaction,
  address: string,
  amount: string,
) => {
  const suiCoin = inLstClient.redeemAmountAndRebalance(
    transaction,
    address,
    amount,
  );
  const lstCoin = outLstClient.mint(transaction, suiCoin);

  outLstClient.rebalance(
    transaction,
    outLstClient.liquidStakingObject.weightHookId,
  );

  return lstCoin;
};

export const convertLstsAndRebalanceAndSendToUser = (
  inLstClient: LstClient,
  outLstClient: LstClient,
  transaction: Transaction,
  address: string,
  amount: string,
) => {
  const lstCoin = convertLstsAndRebalance(
    inLstClient,
    outLstClient,
    transaction,
    address,
    amount,
  );
  transaction.transferObjects([lstCoin], address);
};
