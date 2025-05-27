import { SUI_DECIMALS } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";
import useSWR, { useSWRConfig } from "swr";

import {
  API_URL,
  NORMALIZED_SEND_POINTS_S2_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
  getCoinMetadataMap,
  getToken,
  isSendPointsS2,
} from "@suilend/frontend-sui";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import {
  LENDING_MARKET_ID,
  LENDING_MARKET_TYPE,
  Side,
  SuilendClient,
  formatRewards,
  getDedupedPerDayRewards,
  getFilteredRewards,
  getTotalAprPercent,
  initializeObligations,
  initializeSuilend,
  initializeSuilendRewards,
} from "@suilend/sdk";
import {
  LiquidStakingObjectInfo,
  LstClient,
  SPRING_SUI_UPGRADE_CAP_ID,
  getLatestPackageId,
} from "@suilend/springsui-sdk";
import { LiquidStakingInfo } from "@suilend/springsui-sdk/_generated/liquid_staking/liquid-staking/structs";
import { WeightHook } from "@suilend/springsui-sdk/_generated/liquid_staking/weight/structs";

import { AppData, LstData } from "@/contexts/AppContext";

export default function useFetchAppData() {
  const { suiClient } = useSettingsContext();
  const { address } = useWalletContext();

  const { cache } = useSWRConfig();

  const dataFetcher = async () => {
    const suilendClient = await SuilendClient.initialize(
      LENDING_MARKET_ID,
      LENDING_MARKET_TYPE,
      suiClient,
    );

    const {
      refreshedRawReserves,
      reserveMap,

      activeRewardCoinTypes,
      rewardCoinMetadataMap,
    } = await initializeSuilend(suiClient, suilendClient);

    const { rewardPriceMap } = await initializeSuilendRewards(
      reserveMap,
      activeRewardCoinTypes,
    );

    const { obligationOwnerCaps, obligations } = await initializeObligations(
      suiClient,
      suilendClient,
      refreshedRawReserves,
      reserveMap,
      address,
    );

    const rewardMap = formatRewards(
      reserveMap,
      rewardCoinMetadataMap,
      rewardPriceMap,
      obligations,
    );

    // LSTs
    const lstInfoRes = await fetch(`${API_URL}/springsui/lst-info`);
    const lstInfoJson: Record<
      string,
      {
        LIQUID_STAKING_INFO: LiquidStakingObjectInfo;
        liquidStakingInfo: LiquidStakingInfo<string>;
        weightHook: WeightHook<string>;
        apy: string;
      }
    > = await lstInfoRes.json();
    if ((lstInfoRes as any)?.statusCode === 500)
      throw new Error("Failed to fetch SpringSui LST data");

    const lstInfoMap = lstInfoJson;

    const lstCoinTypes = Array.from(new Set(Object.keys(lstInfoMap)));

    // CoinMetadata
    const springuiCoinTypes: string[] = [
      NORMALIZED_SUI_COINTYPE,
      ...lstCoinTypes,
      NORMALIZED_SEND_POINTS_S2_COINTYPE,
    ];
    const uniqueSpringuiCoinTypes = Array.from(new Set(springuiCoinTypes));

    const springuiCoinMetadataMap = await getCoinMetadataMap(
      uniqueSpringuiCoinTypes,
    );

    // SEND Points
    const sendPointsToken = getToken(
      NORMALIZED_SEND_POINTS_S2_COINTYPE,
      springuiCoinMetadataMap[NORMALIZED_SEND_POINTS_S2_COINTYPE],
    );

    // SUI
    const suiToken = getToken(
      NORMALIZED_SUI_COINTYPE,
      springuiCoinMetadataMap[NORMALIZED_SUI_COINTYPE],
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

    // LSTs - parse
    const publishedAt = await getLatestPackageId(
      suiClient,
      SPRING_SUI_UPGRADE_CAP_ID,
    );

    const lstData: [string, LstData][] = await Promise.all(
      Object.entries(lstInfoMap).map(([coinType, lstInfo]) =>
        (async () => {
          const { LIQUID_STAKING_INFO, liquidStakingInfo, weightHook, apy } =
            lstInfo;

          // Client
          const lstClient = await LstClient.initialize(
            suiClient,
            LIQUID_STAKING_INFO,
            publishedAt,
          );

          // Staking info
          const totalSuiSupply = new BigNumber(
            liquidStakingInfo.storage.totalSuiSupply.toString(),
          ).div(10 ** SUI_DECIMALS);
          const totalLstSupply = new BigNumber(
            liquidStakingInfo.lstTreasuryCap.totalSupply.value.toString(),
          ).div(
            10 ** springuiCoinMetadataMap[LIQUID_STAKING_INFO.type].decimals,
          );

          const suiToLstExchangeRate = !totalSuiSupply.eq(0)
            ? totalLstSupply.div(totalSuiSupply)
            : new BigNumber(1);
          const lstToSuiExchangeRate = !totalLstSupply.eq(0)
            ? totalSuiSupply.div(totalLstSupply)
            : new BigNumber(1);

          const mintFeePercent = new BigNumber(
            liquidStakingInfo.feeConfig.element?.suiMintFeeBps.toString() ?? 0,
          ).div(100);
          // stakedSuiMintFeeBps
          const redeemFeePercent = new BigNumber(
            liquidStakingInfo.feeConfig.element?.redeemFeeBps.toString() ?? 0,
          ).div(100);
          // stakedSuiRedeemFeeBps
          const spreadFeePercent = new BigNumber(
            liquidStakingInfo.feeConfig.element?.spreadFeeBps.toString() ?? 0,
          ).div(100);
          // customRedeemFeeBps

          const aprPercent = new BigNumber(apy);

          const fees = new BigNumber(
            liquidStakingInfo.fees.value.toString(),
          ).div(10 ** SUI_DECIMALS);
          const accruedSpreadFees = new BigNumber(
            liquidStakingInfo.accruedSpreadFees.toString(),
          ).div(
            10 ** springuiCoinMetadataMap[LIQUID_STAKING_INFO.type].decimals,
          );

          const lstToken = getToken(
            LIQUID_STAKING_INFO.type,
            springuiCoinMetadataMap[LIQUID_STAKING_INFO.type],
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

          return [
            coinType,
            {
              lstInfo,
              lstClient,

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
            },
          ];
        })(),
      ),
    );
    const lstDataMap = Object.fromEntries(lstData);

    return {
      suilendClient,
      reserveMap,
      obligationOwnerCaps,
      obligations,

      sendPointsToken,
      suiToken,
      suiPrice,

      lstCoinTypes,
      lstDataMap,

      currentEpoch,
      currentEpochProgressPercent,
      currentEpochEndMs,
    };
  };

  const { data, mutate } = useSWR<AppData>(`appData-${address}`, dataFetcher, {
    refreshInterval: 30 * 1000,
    onSuccess: (data) => {
      console.log("Fetched app data", data);
    },
    onError: (err, key) => {
      const isInitialLoad = cache.get(key)?.data === undefined;
      if (isInitialLoad) showErrorToast("Failed to fetch app data", err);

      console.error(err);
    },
  });

  return { data, mutateData: mutate };
}
