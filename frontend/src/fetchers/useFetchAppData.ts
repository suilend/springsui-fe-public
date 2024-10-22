import { CoinMetadata, SuiClient } from "@mysten/sui/client";
import { normalizeStructTag } from "@mysten/sui/utils";
import { SuiPriceServiceConnection } from "@pythnetwork/pyth-sui-js";
import { phantom } from "@suilend/sdk/mainnet/_generated/_framework/reified";
import { LendingMarket } from "@suilend/sdk/mainnet/_generated/suilend/lending-market/structs";
import {
  LENDING_MARKET_ID,
  LENDING_MARKET_TYPE,
} from "@suilend/sdk/mainnet/client";
import { WAD } from "@suilend/sdk/mainnet/constants";
import * as simulate from "@suilend/sdk/mainnet/utils/simulate";
import BigNumber from "bignumber.js";
import useSWR from "swr";

import {
  fetchLiquidStakingInfo,
  getSpringSuiApy,
} from "@springsui/sdk/functions";

import { AppContext, AppData } from "@/contexts/AppContext";
import {
  COINTYPE_LOGO_MAP,
  LIQUID_STAKING_INFO,
  NORMALIZED_LST_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
  coinTypes,
  isSui,
} from "@/lib/coinType";
import { isOnTestnet } from "@/lib/constants";
import { errorToast } from "@/lib/toasts";
import { ParsedLiquidStakingInfo, Token } from "@/lib/types";

export default function useFetchAppData(suiClient: SuiClient) {
  const dataFetcher = async () => {
    // Sui price
    let suiPrice;
    if (isOnTestnet) suiPrice = new BigNumber(2.25);
    else {
      const now = Math.floor(Date.now() / 1000);
      const rawLendingMarket = await LendingMarket.fetch(
        suiClient,
        phantom(LENDING_MARKET_TYPE),
        LENDING_MARKET_ID,
      );

      const refreshedRawReserves = await simulate.refreshReservePrice(
        rawLendingMarket.reserves
          .filter((r) => isSui(normalizeStructTag(r.coinType.name)))
          .map((r) => simulate.compoundReserveInterest(r, now)),
        new SuiPriceServiceConnection("https://hermes.pyth.network"),
      );

      const suiRefreshedRawReserve = refreshedRawReserves.find((r) =>
        isSui(normalizeStructTag(r.coinType.name)),
      );
      if (!suiRefreshedRawReserve) throw new Error("Missing SUI reserve");

      suiPrice = new BigNumber(
        suiRefreshedRawReserve.price.value.toString(),
      ).div(WAD);
    }

    // Metadata
    const coinMetadataMap: Record<string, Token> = {};
    for (const coinType of coinTypes) {
      const metadata = (await suiClient.getCoinMetadata({
        coinType,
      })) as CoinMetadata;

      coinMetadataMap[coinType] = {
        coinType,
        ...metadata,
        iconUrl: COINTYPE_LOGO_MAP[coinType] ?? metadata.iconUrl,
      };
    }

    // State
    const rawLiquidStakingInfo = await fetchLiquidStakingInfo(
      LIQUID_STAKING_INFO,
      suiClient,
    );

    const totalSuiSupply = new BigNumber(
      rawLiquidStakingInfo.storage.totalSuiSupply.toString(),
    ).div(10 ** coinMetadataMap[NORMALIZED_SUI_COINTYPE].decimals);
    const totalLstSupply = new BigNumber(
      rawLiquidStakingInfo.lstTreasuryCap.totalSupply.value.toString(),
    ).div(10 ** coinMetadataMap[NORMALIZED_LST_COINTYPE].decimals);

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

    const fees = new BigNumber(rawLiquidStakingInfo.fees.value.toString()).div(
      10 ** coinMetadataMap[NORMALIZED_SUI_COINTYPE].decimals,
    );

    const apy = await getSpringSuiApy(suiClient);
    const apyPercent = new BigNumber(apy ?? 0).times(100);

    const liquidStakingInfo = {
      totalSuiSupply,
      totalLstSupply,
      suiToLstExchangeRate,
      lstToSuiExchangeRate,
      mintFeePercent,
      redeemFeePercent,
      fees,
      apyPercent,
      // totalStakers: new BigNumber(11022), // TODO
    } as ParsedLiquidStakingInfo;

    return {
      suiPrice,
      coinMetadataMap,
      liquidStakingInfo,
    } as AppData;
  };

  const { data, mutate } = useSWR<AppContext["appData"]>(
    "appData",
    dataFetcher,
    {
      refreshInterval: 30 * 1000,
      onSuccess: (data) => {
        console.log("Refreshed app data", data);
      },
      onError: (err) => {
        errorToast("Failed to refresh app data.", err);
        console.error(err);
      },
    },
  );

  return { data, mutate };
}
