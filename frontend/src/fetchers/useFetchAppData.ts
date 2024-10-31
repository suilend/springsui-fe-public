import { SuiClient } from "@mysten/sui/client";
import { normalizeStructTag } from "@mysten/sui/utils";
import { SuiPriceServiceConnection } from "@pythnetwork/pyth-sui-js";
import { ParsedReserve, Side, parseLendingMarket } from "@suilend/sdk";
import { phantom } from "@suilend/sdk/_generated/_framework/reified";
import { LendingMarket } from "@suilend/sdk/_generated/suilend/lending-market/structs";
import { LENDING_MARKET_ID, LENDING_MARKET_TYPE } from "@suilend/sdk/client";
import * as simulate from "@suilend/sdk/utils/simulate";
import BigNumber from "bignumber.js";
import useSWR from "swr";

import {
  fetchLiquidStakingInfo,
  getSpringSuiApy,
} from "@suilend/springsui-sdk";

import { AppDataContext } from "@/contexts/AppDataContext";
import { getCoinMetadataMap } from "@/lib/coinMetadata";
import {
  LIQUID_STAKING_INFO,
  NORMALIZED_LST_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
  isLst,
  isSendPoints,
  isSui,
} from "@/lib/coinType";
import {
  formatRewards,
  getDedupedPerDayRewards,
  getFilteredRewards,
  getTotalAprPercent,
} from "@/lib/liquidityMining";
import { errorToast } from "@/lib/toasts";
import { ParsedLiquidStakingInfo, Token } from "@/lib/types";

export default function useFetchAppData(suiClient: SuiClient) {
  const dataFetcher = async () => {
    const now = Math.floor(Date.now() / 1000);
    const rawLendingMarket = await LendingMarket.fetch(
      suiClient,
      phantom(LENDING_MARKET_TYPE),
      LENDING_MARKET_ID,
    );

    const refreshedRawReserves = await simulate.refreshReservePrice(
      rawLendingMarket.reserves
        .filter((r) => {
          const coinType = normalizeStructTag(r.coinType.name);
          return isSui(coinType) || isLst(coinType);
        })
        .map((r) => simulate.compoundReserveInterest(r, now)),
      new SuiPriceServiceConnection("https://hermes.pyth.network"),
    );

    const coinTypes: string[] = [NORMALIZED_LST_COINTYPE]; // Add in case there isn't a Suilend reserve for the LST coinType
    refreshedRawReserves.forEach((r) => {
      coinTypes.push(normalizeStructTag(r.coinType.name));

      [
        ...r.depositsPoolRewardManager.poolRewards,
        ...r.borrowsPoolRewardManager.poolRewards,
      ].forEach((pr) => {
        if (!pr) return;
        coinTypes.push(normalizeStructTag(pr.coinType.name));
      });
    });
    const uniqueCoinTypes = Array.from(new Set(coinTypes));

    const coinMetadataMap = await getCoinMetadataMap(
      suiClient,
      uniqueCoinTypes,
    );

    const lendingMarket = parseLendingMarket(
      rawLendingMarket,
      refreshedRawReserves,
      coinMetadataMap,
      now,
    );

    const reservesMap = lendingMarket.reserves.reduce(
      (acc, reserve) => ({ ...acc, [reserve.coinType]: reserve }),
      {},
    ) as Record<string, ParsedReserve>;

    const rewardsMap = formatRewards(reservesMap, coinMetadataMap);

    // Token map
    const tokenMap = Object.entries(coinMetadataMap).reduce(
      (acc, [coinType, coinMetadata]) => ({
        ...acc,
        [coinType]: { coinType, ...coinMetadata },
      }),
      {} as Record<string, Token>,
    );

    // Staking info
    const rawLiquidStakingInfo = await fetchLiquidStakingInfo(
      LIQUID_STAKING_INFO,
      suiClient,
    );

    const totalSuiSupply = new BigNumber(
      rawLiquidStakingInfo.storage.totalSuiSupply.toString(),
    ).div(10 ** tokenMap[NORMALIZED_SUI_COINTYPE].decimals);
    const totalLstSupply = new BigNumber(
      rawLiquidStakingInfo.lstTreasuryCap.totalSupply.value.toString(),
    ).div(10 ** tokenMap[NORMALIZED_LST_COINTYPE].decimals);

    const suiToLstExchangeRate = !totalSuiSupply.eq(0)
      ? totalLstSupply.div(totalSuiSupply)
      : new BigNumber(0);
    const lstToSuiExchangeRate = !totalLstSupply.eq(0)
      ? totalSuiSupply.div(totalLstSupply)
      : new BigNumber(0);

    const mintFeePercent = new BigNumber(
      rawLiquidStakingInfo.feeConfig.element?.suiMintFeeBps.toString() ?? 0,
    ).div(100);
    const redeemFeePercent = new BigNumber(
      rawLiquidStakingInfo.feeConfig.element?.redeemFeeBps.toString() ?? 0,
    ).div(100);
    const spreadFeePercent = new BigNumber(
      rawLiquidStakingInfo.feeConfig.element?.spreadFeeBps.toString() ?? 0,
    ).div(100);

    const apr = await getSpringSuiApy(suiClient); // TODO: Use APR
    const aprPercent = new BigNumber(apr ?? 0).times(100);

    const fees = new BigNumber(rawLiquidStakingInfo.fees.value.toString()).div(
      10 ** tokenMap[NORMALIZED_SUI_COINTYPE].decimals,
    );
    const accruedSpreadFees = new BigNumber(
      rawLiquidStakingInfo.accruedSpreadFees.toString(),
    ).div(10 ** tokenMap[NORMALIZED_SUI_COINTYPE].decimals);

    const liquidStakingInfo = {
      totalSuiSupply,
      totalLstSupply,
      suiToLstExchangeRate,
      lstToSuiExchangeRate,
      mintFeePercent,
      redeemFeePercent,
      spreadFeePercent,
      aprPercent,

      fees,
      accruedSpreadFees,
    } as ParsedLiquidStakingInfo;

    // Stats
    const suiReserve = reservesMap[NORMALIZED_SUI_COINTYPE];
    const lstReserve = reservesMap[NORMALIZED_LST_COINTYPE] ?? suiReserve;

    const suiRewards = rewardsMap[NORMALIZED_SUI_COINTYPE];
    const lstRewards = rewardsMap[NORMALIZED_LST_COINTYPE] ?? suiRewards;

    const suiPrice = suiReserve.price;
    const lstPrice = lstReserve.price.times(
      liquidStakingInfo.suiToLstExchangeRate,
    );

    const lstReserveAprPercent = getTotalAprPercent(
      Side.DEPOSIT,
      lstReserve.depositAprPercent,
      getFilteredRewards(lstRewards.deposit),
    );
    const lstReserveTvlUsd = lstReserve.availableAmountUsd;
    const lstReserveSendPointsPerDay =
      getDedupedPerDayRewards(getFilteredRewards(lstRewards.deposit)).find(
        (r) => isSendPoints(r.stats.rewardCoinType),
      )?.stats.perDay ?? new BigNumber(0);

    return {
      tokenMap,
      liquidStakingInfo,

      suiPrice,
      lstPrice,
      lstReserveAprPercent,
      lstReserveTvlUsd,
      lstReserveSendPointsPerDay,
    };
  };

  const { data, mutate } = useSWR<AppDataContext["appData"]>(
    "appData",
    dataFetcher,
    {
      refreshInterval: 30 * 1000,
      onSuccess: (data) => {
        console.log("Refreshed app data", data);
      },
      onError: (err) => {
        errorToast("Failed to refresh app data", err);
        console.error(err);
      },
    },
  );

  return { appData: data, mutateAppData: mutate };
}
