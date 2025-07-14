import { Transaction } from "@mysten/sui/transactions";

import { LstClient } from "../client";

export const convertLstsAndRebalance = async (
  inLstClient: LstClient,
  outLstClient: LstClient,
  transaction: Transaction,
  address: string,
  amount: string,
) => {
  const suiCoin = await inLstClient.redeemAmountAndRebalance(
    transaction,
    address,
    amount,
    inLstClient.client,
  );
  const lstCoin = outLstClient.mint(transaction, suiCoin);

  outLstClient.rebalance(
    transaction,
    outLstClient.liquidStakingObject.weightHookId,
  );

  return lstCoin;
};

export const convertLstsAndRebalanceAndSendToUser = async (
  inLstClient: LstClient,
  outLstClient: LstClient,
  transaction: Transaction,
  address: string,
  amount: string,
) => {
  const lstCoin = await convertLstsAndRebalance(
    inLstClient,
    outLstClient,
    transaction,
    address,
    amount,
  );
  transaction.transferObjects([lstCoin], address);
};
