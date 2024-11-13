import { normalizeStructTag } from "@mysten/sui/utils";
import { SuiPriceServiceConnection } from "@pythnetwork/pyth-sui-js";
import BigNumber from "bignumber.js";
import useSWR from "swr";

import {
  NORMALIZED_SEND_POINTS_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
  getCoinMetadataMap,
  getToken,
  isSendPoints,
  showErrorToast,
  useSettingsContext,
} from "@suilend/frontend-sui";
import { ParsedReserve, Side, parseLendingMarket } from "@suilend/sdk";
import { phantom } from "@suilend/sdk/_generated/_framework/reified";
import { LendingMarket } from "@suilend/sdk/_generated/suilend/lending-market/structs";
import {
  LENDING_MARKET_ID,
  LENDING_MARKET_TYPE,
  SuilendClient,
} from "@suilend/sdk/client";
import * as simulate from "@suilend/sdk/utils/simulate";
import {
  LstClient,
  fetchLiquidStakingInfo,
  getSpringSuiApy,
} from "@suilend/springsui-sdk";

import {
  AppData,
  LIQUID_STAKING_INFO_MAP,
  LstData,
  LstId,
  NORMALIZED_LST_COINTYPES,
  VALIDATOR_MAP,
} from "@/contexts/AppContext";
import {
  formatRewards,
  getDedupedPerDayRewards,
  getFilteredRewards,
  getTotalAprPercent,
} from "@/lib/liquidityMining";

export default function useFetchAppData() {
  const { suiClient } = useSettingsContext();

  const dataFetcher = async () => {
    // Reserves
    const now = Math.floor(Date.now() / 1000);
    const rawLendingMarket = await LendingMarket.fetch(
      suiClient,
      phantom(LENDING_MARKET_TYPE),
      LENDING_MARKET_ID,
    );

    const suilendClient = await SuilendClient.initializeWithLendingMarket(
      rawLendingMarket,
      suiClient,
    );

    const refreshedRawReserves = await simulate.refreshReservePrice(
      rawLendingMarket.reserves
        .filter((r) =>
          [NORMALIZED_SUI_COINTYPE, ...NORMALIZED_LST_COINTYPES].includes(
            normalizeStructTag(r.coinType.name),
          ),
        )
        .map((r) => simulate.compoundReserveInterest(r, now)),
      new SuiPriceServiceConnection("https://hermes.pyth.network"),
    );

    const coinTypes: string[] = [
      NORMALIZED_SUI_COINTYPE,
      ...NORMALIZED_LST_COINTYPES,
      NORMALIZED_SEND_POINTS_COINTYPE,
    ];
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

    const reserveMap = lendingMarket.reserves.reduce(
      (acc, reserve) => ({ ...acc, [reserve.coinType]: reserve }),
      {},
    ) as Record<string, ParsedReserve>;

    const rewardMap = formatRewards(reserveMap, coinMetadataMap);

    // SEND Points
    const sendPointsToken = getToken(
      NORMALIZED_SEND_POINTS_COINTYPE,
      coinMetadataMap[NORMALIZED_SEND_POINTS_COINTYPE],
    );

    // SUI
    const suiToken = getToken(
      NORMALIZED_SUI_COINTYPE,
      coinMetadataMap[NORMALIZED_SUI_COINTYPE],
    );
    const suiPrice = reserveMap[NORMALIZED_SUI_COINTYPE].price;

    // Epoch
    const latestSuiSystemState = await suiClient.getLatestSuiSystemState();

    const currentEpoch = +latestSuiSystemState.epoch;
    const currentEpochProgressPercent =
      ((Date.now() - +latestSuiSystemState.epochStartTimestampMs) /
        +latestSuiSystemState.epochDurationMs) *
      100;
    const currentEpochEndMs =
      +latestSuiSystemState.epochStartTimestampMs +
      +latestSuiSystemState.epochDurationMs;

    // LSTs
    const lstClientMap = Object.values(LstId).reduce(
      (acc, lstId) => ({ ...acc, [lstId]: {} }),
      {} as Record<LstId, LstClient>,
    );
    const lstDataMap = Object.values(LstId).reduce(
      (acc, lstId) => ({ ...acc, [lstId]: {} }),
      {} as Record<LstId, LstData>,
    );

    for (const _lstId of Object.values(LstId)) {
      const LIQUID_STAKING_INFO = LIQUID_STAKING_INFO_MAP[_lstId];
      const validatorAddress = VALIDATOR_MAP[_lstId];

      // Client
      const lstClient = await LstClient.initialize(
        suiClient,
        LIQUID_STAKING_INFO,
      );

      // Staking info
      const rawLiquidStakingInfo = await fetchLiquidStakingInfo(
        LIQUID_STAKING_INFO,
        suiClient,
      );

      const totalSuiSupply = new BigNumber(
        rawLiquidStakingInfo.storage.totalSuiSupply.toString(),
      ).div(10 ** coinMetadataMap[NORMALIZED_SUI_COINTYPE].decimals);
      const totalLstSupply = new BigNumber(
        rawLiquidStakingInfo.lstTreasuryCap.totalSupply.value.toString(),
      ).div(10 ** coinMetadataMap[LIQUID_STAKING_INFO.type].decimals);

      const suiToLstExchangeRate = !totalSuiSupply.eq(0)
        ? totalLstSupply.div(totalSuiSupply)
        : new BigNumber(0);
      const lstToSuiExchangeRate = !totalLstSupply.eq(0)
        ? totalSuiSupply.div(totalLstSupply)
        : new BigNumber(0);

      const mintFeePercent = new BigNumber(
        rawLiquidStakingInfo.feeConfig.element?.suiMintFeeBps.toString() ?? 0,
      ).div(100);
      // stakedSuiMintFeeBps
      const redeemFeePercent = new BigNumber(
        rawLiquidStakingInfo.feeConfig.element?.redeemFeeBps.toString() ?? 0,
      ).div(100);
      // stakedSuiRedeemFeeBps
      const spreadFeePercent = new BigNumber(
        rawLiquidStakingInfo.feeConfig.element?.spreadFeeBps.toString() ?? 0,
      ).div(100);
      // customRedeemFeeBps

      const apr = await getSpringSuiApy(suiClient, validatorAddress); // TODO: Use APR
      const aprPercent =
        apr !== undefined ? new BigNumber(apr).times(100) : undefined;

      const fees = new BigNumber(
        rawLiquidStakingInfo.fees.value.toString(),
      ).div(10 ** coinMetadataMap[NORMALIZED_SUI_COINTYPE].decimals);
      const accruedSpreadFees = new BigNumber(
        rawLiquidStakingInfo.accruedSpreadFees.toString(),
      ).div(10 ** coinMetadataMap[LIQUID_STAKING_INFO.type].decimals);

      const lstToken = getToken(
        LIQUID_STAKING_INFO.type,
        coinMetadataMap[LIQUID_STAKING_INFO.type],
      );
      const lstPrice = !suiToLstExchangeRate.eq(0)
        ? suiPrice.div(suiToLstExchangeRate)
        : suiPrice;

      const suilendLstReserve = reserveMap[LIQUID_STAKING_INFO.type];
      const suilendLstRewards = rewardMap[LIQUID_STAKING_INFO.type];

      const suilendReserveStats =
        suilendLstReserve && suilendLstRewards
          ? {
              aprPercent: getTotalAprPercent(
                Side.DEPOSIT,
                suilendLstReserve.depositAprPercent,
                getFilteredRewards(suilendLstRewards.deposit),
              ),
              tvlUsd: suilendLstReserve.availableAmountUsd,
              sendPointsPerDay:
                getDedupedPerDayRewards(
                  getFilteredRewards(suilendLstRewards.deposit),
                ).find((r) => isSendPoints(r.stats.rewardCoinType))?.stats
                  .perDay ?? new BigNumber(0),
            }
          : undefined;

      lstClientMap[_lstId] = lstClient;
      lstDataMap[_lstId] = {
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

        token: lstToken,
        price: lstPrice,

        suilendReserveStats,
      };
    }

    return {
      suilendClient,

      sendPointsToken,
      suiToken,
      suiPrice,

      lstClientMap,
      lstDataMap,

      currentEpoch,
      currentEpochProgressPercent,
      currentEpochEndMs,
    };
  };

  const { data, mutate } = useSWR<AppData>("appData", dataFetcher, {
    refreshInterval: 30 * 1000,
    onSuccess: (data) => {
      console.log("Refreshed app data", data);
    },
    onError: (err) => {
      showErrorToast("Failed to refresh app data", err);
      console.error(err);
    },
  });

  return { data, mutateData: mutate };
}
