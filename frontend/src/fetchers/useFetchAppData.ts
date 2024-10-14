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
import { toast } from "sonner";
import useSWR from "swr";

import { fetchLiquidStakingInfo } from "@springsui/sdk/functions";

import { AppContext, AppData } from "@/contexts/AppContext";
import {
  COINTYPE_LOGO_MAP,
  LIQUID_STAKING_INFO,
  NORMALIZED_LST_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
  isSui,
} from "@/lib/coinType";
import { isOnTestnet } from "@/lib/constants";
import { ParsedLiquidStakingInfo, Token } from "@/lib/types";

export default function useFetchAppData(
  suiClient: SuiClient,
  address: string | undefined,
) {
  // Data
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
    const coinTypes = [NORMALIZED_SUI_COINTYPE, NORMALIZED_LST_COINTYPE];

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

    // Balance
    const balanceMap: Record<string, BigNumber> = {};
    if (address) {
      const rawBalances = (
        await suiClient.getAllBalances({
          owner: address,
        })
      )
        .map((cb) => ({ ...cb, coinType: normalizeStructTag(cb.coinType) }))
        .sort((a, b) => (a.coinType < b.coinType ? -1 : 1));

      for (const coinType of coinTypes) {
        balanceMap[coinType] = new BigNumber(
          rawBalances.find((balance) => balance.coinType === coinType)
            ?.totalBalance ?? 0,
        ).div(10 ** coinMetadataMap[coinType].decimals);
      }
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

    const fees = new BigNumber(rawLiquidStakingInfo.fees.value.toString()).div(
      10 ** coinMetadataMap[NORMALIZED_SUI_COINTYPE].decimals,
    );

    const liquidStakingInfo = {
      totalSuiSupply,
      totalLstSupply,
      suiToLstExchangeRate,
      lstToSuiExchangeRate,
      fees,
    } as ParsedLiquidStakingInfo;

    return {
      suiPrice,
      coinMetadataMap,
      balanceMap,
      liquidStakingInfo,
    } as AppData;
  };

  const { data, mutate } = useSWR<AppContext["data"]>(
    `appData-${address}`,
    dataFetcher,
    {
      refreshInterval: 30 * 1000,
      onSuccess: (data) => {
        console.log("Refreshed app data", data);
      },
      onError: (err) => {
        toast.error("Failed to refresh app data.", {
          description: (err as Error)?.message || "An unknown error occured",
        });
        console.error(err);
      },
    },
  );

  return {
    data,
    mutate,
  };
}
