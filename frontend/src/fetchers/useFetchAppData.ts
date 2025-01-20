import { SUI_DECIMALS } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";
import useSWR from "swr";

import {
  LIQUID_STAKING_INFO_MAP,
  LstId,
  NORMALIZED_LST_COINTYPES,
  NORMALIZED_SEND_POINTS_S2_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
  getCoinMetadataMap,
  getDedupedPerDayRewards,
  getFilteredRewards,
  getToken,
  getTotalAprPercent,
  initializeSuilend,
  initializeSuilendRewards,
  isSendPointsS2,
} from "@suilend/frontend-sui";
import { showErrorToast, useSettingsContext } from "@suilend/frontend-sui-next";
import {
  LENDING_MARKET_ID,
  LENDING_MARKET_TYPE,
  Side,
  SuilendClient,
} from "@suilend/sdk";
import { LstClient, fetchLiquidStakingInfo } from "@suilend/springsui-sdk";

import { AppData, LstData } from "@/contexts/AppContext";

export default function useFetchAppData() {
  const { suiClient } = useSettingsContext();

  const dataFetcher = async () => {
    const suilendClient = await SuilendClient.initialize(
      LENDING_MARKET_ID,
      LENDING_MARKET_TYPE,
      suiClient,
    );

    const {
      reserveMap,
      rewardCoinTypes,
      rewardCoinMetadataMap,

      obligationOwnerCaps,
      obligations,
    } = await initializeSuilend(suiClient, suilendClient);

    const { rewardMap } = await initializeSuilendRewards(
      reserveMap,
      rewardCoinTypes,
      rewardCoinMetadataMap,
    );

    // CoinMetadata
    const coinTypes: string[] = [
      NORMALIZED_SUI_COINTYPE,
      ...NORMALIZED_LST_COINTYPES,
      NORMALIZED_SEND_POINTS_S2_COINTYPE,
    ];
    const uniqueCoinTypes = Array.from(new Set(coinTypes));

    const coinMetadataMap = await getCoinMetadataMap(
      suiClient,
      uniqueCoinTypes,
    );

    // SEND Points
    const sendPointsToken = getToken(
      NORMALIZED_SEND_POINTS_S2_COINTYPE,
      coinMetadataMap[NORMALIZED_SEND_POINTS_S2_COINTYPE],
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
      ).div(10 ** SUI_DECIMALS);
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

      const apr = await lstClient.getSpringSuiApy(); // TODO: Use APR
      const aprPercent = new BigNumber(apr).times(100);

      const fees = new BigNumber(
        rawLiquidStakingInfo.fees.value.toString(),
      ).div(10 ** SUI_DECIMALS);
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
                ).find((r) => isSendPointsS2(r.stats.rewardCoinType))?.stats
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
      obligationOwnerCaps,
      obligations,

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
